/*
# Storage bucket policies for medical documents

## Overview
Sets up RLS policies on the storage.objects table so authenticated users
can upload, read, and delete their own medical documents in the 'documents' bucket.
Files are stored under a per-user path: user_id/filename.

## Security
- Only authenticated users can access the documents bucket.
- Users can only manage files in their own folder (user_id/).
*/

-- Allow users to read their own files in the documents bucket
DROP POLICY IF EXISTS "docs_select_own" ON storage.objects;
CREATE POLICY "docs_select_own" ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow users to insert their own files
DROP POLICY IF EXISTS "docs_insert_own" ON storage.objects;
CREATE POLICY "docs_insert_own" ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow users to update their own files
DROP POLICY IF EXISTS "docs_update_own" ON storage.objects;
CREATE POLICY "docs_update_own" ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow users to delete their own files
DROP POLICY IF EXISTS "docs_delete_own" ON storage.objects;
CREATE POLICY "docs_delete_own" ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);