/*
# AI Personal Health Copilot - Complete Database Schema

## Overview
Creates the complete database schema for a personal health copilot application.
Users can upload medical documents, extract data via OCR, track medications, view a medical
timeline, and receive AI-generated health summaries in English and Telugu.

## New Tables
1. profiles — User health profile (name, DOB, gender, blood group, ABHA ID, allergies, etc.)
2. documents — Uploaded medical documents with OCR text and status
3. medical_records — FHIR-style structured records extracted from documents
4. medications — Medicine tracking and prescription history
5. health_summaries — AI-generated health summaries in English and Telugu
6. timeline_events — Chronological medical history events

## Security
- RLS enabled on ALL tables, owner-scoped (auth.uid() = user_id).
- Four separate policies per table (SELECT, INSERT, UPDATE, DELETE).
- user_id columns default to auth.uid().
- Auto-create profile trigger on signup.
*/

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text DEFAULT '',
  date_of_birth date,
  gender text DEFAULT '',
  blood_group text DEFAULT '',
  phone text DEFAULT '',
  abha_id text DEFAULT '',
  allergies text[] DEFAULT '{}',
  chronic_conditions text[] DEFAULT '{}',
  emergency_contact text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "delete_own_profile" ON profiles;
CREATE POLICY "delete_own_profile" ON profiles FOR DELETE
  TO authenticated USING (auth.uid() = id);

-- 2. DOCUMENTS TABLE
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_type text NOT NULL DEFAULT 'image',
  file_url text,
  status text NOT NULL DEFAULT 'pending',
  ocr_text text DEFAULT '',
  document_type text DEFAULT 'other',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_documents" ON documents;
CREATE POLICY "select_own_documents" ON documents FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_documents" ON documents;
CREATE POLICY "insert_own_documents" ON documents FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_documents" ON documents;
CREATE POLICY "update_own_documents" ON documents FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_documents" ON documents;
CREATE POLICY "delete_own_documents" ON documents FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- 3. MEDICAL_RECORDS TABLE
CREATE TABLE IF NOT EXISTS medical_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  document_id uuid REFERENCES documents(id) ON DELETE SET NULL,
  record_type text NOT NULL DEFAULT 'observation',
  fhir_resource_type text NOT NULL DEFAULT 'Observation',
  code text DEFAULT '',
  display_name text DEFAULT '',
  value text DEFAULT '',
  unit text DEFAULT '',
  reference_range text DEFAULT '',
  status text DEFAULT 'normal',
  is_abnormal boolean DEFAULT false,
  notes text DEFAULT '',
  record_date date,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_records" ON medical_records;
CREATE POLICY "select_own_records" ON medical_records FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_records" ON medical_records;
CREATE POLICY "insert_own_records" ON medical_records FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_records" ON medical_records;
CREATE POLICY "update_own_records" ON medical_records FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_records" ON medical_records;
CREATE POLICY "delete_own_records" ON medical_records FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- 4. MEDICATIONS TABLE
CREATE TABLE IF NOT EXISTS medications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  dosage text DEFAULT '',
  frequency text DEFAULT '',
  start_date date,
  end_date date,
  status text DEFAULT 'active',
  prescribed_for text DEFAULT '',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE medications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_medications" ON medications;
CREATE POLICY "select_own_medications" ON medications FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_medications" ON medications;
CREATE POLICY "insert_own_medications" ON medications FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_medications" ON medications;
CREATE POLICY "update_own_medications" ON medications FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_medications" ON medications;
CREATE POLICY "delete_own_medications" ON medications FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- 5. HEALTH_SUMMARIES TABLE
CREATE TABLE IF NOT EXISTS health_summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  document_id uuid REFERENCES documents(id) ON DELETE SET NULL,
  summary_english text DEFAULT '',
  summary_telugu text DEFAULT '',
  abnormal_findings jsonb DEFAULT '[]',
  key_findings jsonb DEFAULT '[]',
  recommendations jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE health_summaries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_summaries" ON health_summaries;
CREATE POLICY "select_own_summaries" ON health_summaries FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_summaries" ON health_summaries;
CREATE POLICY "insert_own_summaries" ON health_summaries FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_summaries" ON health_summaries;
CREATE POLICY "update_own_summaries" ON health_summaries FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_summaries" ON health_summaries;
CREATE POLICY "delete_own_summaries" ON health_summaries FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- 6. TIMELINE_EVENTS TABLE
CREATE TABLE IF NOT EXISTS timeline_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  event_date date NOT NULL DEFAULT CURRENT_DATE,
  event_type text NOT NULL DEFAULT 'visit',
  title text NOT NULL,
  description text DEFAULT '',
  related_record_id uuid,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE timeline_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_timeline" ON timeline_events;
CREATE POLICY "select_own_timeline" ON timeline_events FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_timeline" ON timeline_events;
CREATE POLICY "insert_own_timeline" ON timeline_events FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_timeline" ON timeline_events;
CREATE POLICY "update_own_timeline" ON timeline_events FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_timeline" ON timeline_events;
CREATE POLICY "delete_own_timeline" ON timeline_events FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_user_id ON medical_records(user_id);
CREATE INDEX IF NOT EXISTS idx_medications_user_id ON medications(user_id);
CREATE INDEX IF NOT EXISTS idx_health_summaries_user_id ON health_summaries(user_id);
CREATE INDEX IF NOT EXISTS idx_timeline_events_user_id ON timeline_events(user_id);
CREATE INDEX IF NOT EXISTS idx_timeline_events_date ON timeline_events(event_date DESC);
CREATE INDEX IF NOT EXISTS idx_medical_records_date ON medical_records(record_date DESC);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();