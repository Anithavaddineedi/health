CREATE OR REPLACE FUNCTION public.complete_document_analysis(
  p_document_id uuid,
  p_document_type text,
  p_medications jsonb,
  p_records jsonb,
  p_summary jsonb,
  p_timeline_title text,
  p_timeline_description text
)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication is required to save report analysis';
  END IF;

  IF jsonb_typeof(p_medications) IS DISTINCT FROM 'array'
    OR jsonb_typeof(p_records) IS DISTINCT FROM 'array'
    OR jsonb_typeof(p_summary) IS DISTINCT FROM 'object' THEN
    RAISE EXCEPTION 'Invalid report analysis payload';
  END IF;

  UPDATE public.documents
  SET document_type = p_document_type,
      status = 'completed'
  WHERE id = p_document_id
    AND user_id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Document not found or access denied';
  END IF;

  INSERT INTO public.medications (
    user_id, name, dosage, frequency, prescribed_for, status
  )
  SELECT auth.uid(), medication.name, medication.dosage,
         medication.frequency, medication.prescribed_for, 'active'
  FROM jsonb_to_recordset(p_medications) AS medication(
    name text, dosage text, frequency text, prescribed_for text
  );

  INSERT INTO public.medical_records (
    user_id, document_id, record_type, fhir_resource_type, code,
    display_name, value, unit, reference_range, status, is_abnormal, notes
  )
  SELECT auth.uid(), p_document_id, record.record_type,
         record.fhir_resource_type, record.code, record.display_name,
         record.value, record.unit, record.reference_range, record.status,
         record.is_abnormal, record.notes
  FROM jsonb_to_recordset(p_records) AS record(
    record_type text, fhir_resource_type text, code text,
    display_name text, value text, unit text, reference_range text,
    status text, is_abnormal boolean, notes text
  );

  INSERT INTO public.health_summaries (
    user_id, document_id, summary_english, summary_telugu,
    abnormal_findings, key_findings, recommendations
  )
  VALUES (
    auth.uid(), p_document_id,
    p_summary->>'summary_english',
    p_summary->>'summary_telugu',
    COALESCE(p_summary->'abnormal_findings', '[]'::jsonb),
    COALESCE(p_summary->'key_findings', '[]'::jsonb),
    COALESCE(p_summary->'recommendations', '[]'::jsonb)
  );

  INSERT INTO public.timeline_events (
    user_id, event_type, title, description
  )
  VALUES (
    auth.uid(),
    CASE WHEN p_document_type = 'prescription' THEN 'prescription' ELSE 'test' END,
    p_timeline_title,
    p_timeline_description
  );
END;
$$;

REVOKE ALL ON FUNCTION public.complete_document_analysis(
  uuid, text, jsonb, jsonb, jsonb, text, text
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.complete_document_analysis(
  uuid, text, jsonb, jsonb, jsonb, text, text
) TO authenticated;

DO $$
DECLARE
  table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'documents',
    'medical_records',
    'medications',
    'health_summaries',
    'timeline_events'
  ] LOOP
    IF NOT EXISTS (
      SELECT 1
      FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = table_name
    ) THEN
      EXECUTE format(
        'ALTER PUBLICATION supabase_realtime ADD TABLE public.%I',
        table_name
      );
    END IF;
  END LOOP;
END;
$$;
