CREATE TABLE IF NOT EXISTS public.medication_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  medication_id uuid NOT NULL REFERENCES public.medications(id) ON DELETE CASCADE,
  reminder_time time NOT NULL,
  timezone text NOT NULL DEFAULT 'Asia/Kolkata',
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (medication_id)
);

ALTER TABLE public.medication_reminders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_medication_reminders" ON public.medication_reminders;
CREATE POLICY "select_own_medication_reminders" ON public.medication_reminders
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_medication_reminders" ON public.medication_reminders;
CREATE POLICY "insert_own_medication_reminders" ON public.medication_reminders
  FOR INSERT TO authenticated WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.medications
      WHERE medications.id = medication_id AND medications.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "update_own_medication_reminders" ON public.medication_reminders;
CREATE POLICY "update_own_medication_reminders" ON public.medication_reminders
  FOR UPDATE TO authenticated USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.medications
      WHERE medications.id = medication_id AND medications.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "delete_own_medication_reminders" ON public.medication_reminders;
CREATE POLICY "delete_own_medication_reminders" ON public.medication_reminders
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_medication_reminders_user_id
  ON public.medication_reminders(user_id);

CREATE TABLE IF NOT EXISTS public.appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  doctor_id text NOT NULL,
  doctor_name text NOT NULL,
  specialty text NOT NULL,
  hospital text NOT NULL,
  scheduled_at timestamptz NOT NULL,
  visit_type text NOT NULL CHECK (visit_type IN ('inPerson', 'video')),
  notes text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled')),
  room_code uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.video_call_participants (
  appointment_id uuid NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (appointment_id, user_id)
);

ALTER TABLE public.video_call_participants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "participants_read_own_memberships" ON public.video_call_participants;
CREATE POLICY "participants_read_own_memberships" ON public.video_call_participants
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.add_appointment_owner_as_video_participant()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.visit_type = 'video' THEN
    INSERT INTO public.video_call_participants (appointment_id, user_id)
    VALUES (NEW.id, NEW.user_id)
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS add_appointment_owner_as_video_participant ON public.appointments;
CREATE TRIGGER add_appointment_owner_as_video_participant
  AFTER INSERT ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.add_appointment_owner_as_video_participant();

CREATE OR REPLACE FUNCTION public.is_appointment_video_participant(target_appointment_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.video_call_participants
    WHERE appointment_id = target_appointment_id
      AND user_id = auth.uid()
  );
$$;

DROP POLICY IF EXISTS "select_own_or_joined_appointments" ON public.appointments;
CREATE POLICY "select_own_or_joined_appointments" ON public.appointments
  FOR SELECT TO authenticated USING (
    auth.uid() = user_id OR public.is_appointment_video_participant(id)
  );

DROP POLICY IF EXISTS "insert_own_appointments" ON public.appointments;
CREATE POLICY "insert_own_appointments" ON public.appointments
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_appointments" ON public.appointments;
CREATE POLICY "update_own_appointments" ON public.appointments
  FOR UPDATE TO authenticated USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_appointments" ON public.appointments;
CREATE POLICY "delete_own_appointments" ON public.appointments
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_appointments_user_date
  ON public.appointments(user_id, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_video_call_participants_user
  ON public.video_call_participants(user_id, appointment_id);

CREATE OR REPLACE FUNCTION public.join_video_appointment(invite_code uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_id uuid;
  owner_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT id, user_id INTO target_id, owner_id
  FROM public.appointments
  WHERE room_code = invite_code
    AND visit_type = 'video'
    AND status = 'confirmed'
    AND scheduled_at BETWEEN now() - interval '2 hours' AND now() + interval '2 hours';

  IF target_id IS NULL THEN
    RAISE EXCEPTION 'Invalid invite code or video visit is outside its join window';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.video_call_participants
    WHERE appointment_id = target_id
      AND user_id <> owner_id
      AND user_id <> auth.uid()
  ) THEN
    RAISE EXCEPTION 'Another invitee has already joined this video visit';
  END IF;

  INSERT INTO public.video_call_participants (appointment_id, user_id)
  VALUES (target_id, auth.uid())
  ON CONFLICT DO NOTHING;

  RETURN target_id;
END;
$$;

REVOKE ALL ON FUNCTION public.join_video_appointment(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.join_video_appointment(uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.is_appointment_video_participant(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_appointment_video_participant(uuid) TO authenticated;

CREATE TABLE IF NOT EXISTS public.video_call_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN ('offer', 'answer', 'ice-candidate')),
  payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.video_call_signals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "participants_read_video_signals" ON public.video_call_signals;
CREATE POLICY "participants_read_video_signals" ON public.video_call_signals
  FOR SELECT TO authenticated USING (
    public.is_appointment_video_participant(appointment_id)
  );

DROP POLICY IF EXISTS "participants_send_video_signals" ON public.video_call_signals;
CREATE POLICY "participants_send_video_signals" ON public.video_call_signals
  FOR INSERT TO authenticated WITH CHECK (
    sender_id = auth.uid()
    AND public.is_appointment_video_participant(appointment_id)
  );

DROP POLICY IF EXISTS "participants_delete_own_video_signals" ON public.video_call_signals;
DROP POLICY IF EXISTS "participants_clear_video_signals" ON public.video_call_signals;
CREATE POLICY "participants_clear_video_signals" ON public.video_call_signals
  FOR DELETE TO authenticated USING (
    public.is_appointment_video_participant(appointment_id)
  );

CREATE INDEX IF NOT EXISTS idx_video_call_signals_appointment
  ON public.video_call_signals(appointment_id, created_at);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'video_call_signals'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.video_call_signals;
  END IF;
END;
$$;

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

-- Register the verified Arjun provider account after creating its Auth user:
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
    AND appointment.scheduled_at >= now() - interval '30 minutes'
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
