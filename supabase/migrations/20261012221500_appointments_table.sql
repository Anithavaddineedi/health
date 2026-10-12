CREATE TABLE IF NOT EXISTS public.appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid()
    REFERENCES auth.users(id) ON DELETE CASCADE,
  doctor_id text NOT NULL,
  doctor_name text NOT NULL,
  specialty text NOT NULL,
  hospital text NOT NULL,
  scheduled_at timestamptz NOT NULL,
  visit_type text NOT NULL CHECK (visit_type IN ('inPerson', 'video')),
  notes text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'confirmed'
    CHECK (status IN ('confirmed', 'cancelled')),
  room_code uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_appointments" ON public.appointments;
CREATE POLICY "select_own_appointments" ON public.appointments
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_appointments" ON public.appointments;
CREATE POLICY "insert_own_appointments" ON public.appointments
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_appointments" ON public.appointments;
CREATE POLICY "update_own_appointments" ON public.appointments
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_appointments" ON public.appointments;
CREATE POLICY "delete_own_appointments" ON public.appointments
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.appointments TO authenticated;

CREATE INDEX IF NOT EXISTS idx_appointments_user_date
  ON public.appointments(user_id, scheduled_at);
