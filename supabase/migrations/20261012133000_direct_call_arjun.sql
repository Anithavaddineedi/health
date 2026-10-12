CREATE TABLE IF NOT EXISTS public.doctor_directory (
  doctor_id text PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL,
  active boolean NOT NULL DEFAULT true
);

ALTER TABLE public.doctor_directory ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "doctors_read_own_directory_entry" ON public.doctor_directory;
CREATE POLICY "doctors_read_own_directory_entry" ON public.doctor_directory
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- After creating and verifying Arjun's Auth account, register its UUID:
-- INSERT INTO public.doctor_directory (doctor_id, user_id, display_name)
-- VALUES ('dr-arjun', '<verified-auth-user-uuid>', 'Dr. Arjun');

CREATE OR REPLACE FUNCTION public.add_appointment_owner_as_video_participant()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  doctor_user_id uuid;
BEGIN
  IF NEW.visit_type = 'video' THEN
    INSERT INTO public.video_call_participants (appointment_id, user_id)
    VALUES (NEW.id, NEW.user_id)
    ON CONFLICT DO NOTHING;

    IF NEW.doctor_id = 'dr-arjun' THEN
      SELECT user_id INTO doctor_user_id
      FROM public.doctor_directory
      WHERE doctor_id = 'dr-arjun' AND active;

      IF doctor_user_id IS NOT NULL THEN
        INSERT INTO public.video_call_participants (appointment_id, user_id)
        VALUES (NEW.id, doctor_user_id)
        ON CONFLICT DO NOTHING;
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_arjun_doctor()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.doctor_directory
    WHERE doctor_id = 'dr-arjun' AND user_id = auth.uid() AND active
  );
$$;

CREATE OR REPLACE FUNCTION public.start_direct_video_call()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  doctor_user_id uuid;
  call_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT user_id INTO doctor_user_id
  FROM public.doctor_directory
  WHERE doctor_id = 'dr-arjun' AND active;

  IF doctor_user_id IS NULL THEN
    RAISE EXCEPTION 'Dr. Arjun is not configured in the doctor directory yet';
  END IF;
  IF doctor_user_id = auth.uid() THEN
    RAISE EXCEPTION 'You cannot call the doctor account while signed in as Dr. Arjun';
  END IF;

  SELECT id INTO call_id
  FROM public.appointments
  WHERE user_id = auth.uid()
    AND doctor_id = 'dr-arjun'
    AND visit_type = 'video'
    AND status = 'confirmed'
    AND scheduled_at >= now() - interval '30 minutes'
  ORDER BY created_at DESC
  LIMIT 1;

  IF call_id IS NOT NULL THEN
    RETURN call_id;
  END IF;

  INSERT INTO public.appointments (
    user_id, doctor_id, doctor_name, specialty, hospital,
    scheduled_at, visit_type, notes, status
  )
  VALUES (
    auth.uid(), 'dr-arjun', 'Dr. Arjun', 'General Medicine', 'Health Copilot Video Clinic',
    now(), 'video', '', 'confirmed'
  )
  RETURNING id INTO call_id;

  INSERT INTO public.video_call_participants (appointment_id, user_id)
  VALUES (call_id, doctor_user_id)
  ON CONFLICT DO NOTHING;

  RETURN call_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_arjun_incoming_calls()
RETURNS SETOF public.appointments
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_arjun_doctor() THEN
    RAISE EXCEPTION 'Only the registered Dr. Arjun account can view incoming calls';
  END IF;

  RETURN QUERY
  SELECT appointment.*
  FROM public.appointments AS appointment
  JOIN public.video_call_participants AS participant
    ON participant.appointment_id = appointment.id
  WHERE appointment.doctor_id = 'dr-arjun'
    AND appointment.visit_type = 'video'
    AND appointment.status = 'confirmed'
    AND appointment.scheduled_at BETWEEN now() - interval '30 minutes' AND now() + interval '2 hours'
    AND participant.user_id = auth.uid()
    AND participant.user_id <> appointment.user_id
  ORDER BY appointment.created_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.finish_direct_video_call(target_appointment_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_appointment_video_participant(target_appointment_id) THEN
    RAISE EXCEPTION 'You are not a participant in this video call';
  END IF;

  UPDATE public.appointments
  SET status = 'completed'
  WHERE id = target_appointment_id
    AND doctor_id = 'dr-arjun'
    AND status = 'confirmed';
END;
$$;

DROP FUNCTION IF EXISTS public.join_video_appointment(uuid);

ALTER TABLE public.appointments DROP CONSTRAINT IF EXISTS appointments_status_check;
ALTER TABLE public.appointments
  ADD CONSTRAINT appointments_status_check
  CHECK (status IN ('confirmed', 'cancelled', 'completed'));

REVOKE ALL ON FUNCTION public.is_arjun_doctor() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.start_direct_video_call() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_arjun_incoming_calls() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.finish_direct_video_call(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_arjun_doctor() TO authenticated;
GRANT EXECUTE ON FUNCTION public.start_direct_video_call() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_arjun_incoming_calls() TO authenticated;
GRANT EXECUTE ON FUNCTION public.finish_direct_video_call(uuid) TO authenticated;
