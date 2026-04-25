-- Task 7 (Phase 1 security hardening) — lock down verification-documents bucket.
--
-- Before this migration, authenticated users could INSERT/UPDATE/DELETE objects
-- in the verification-documents bucket directly from the browser, bypassing any
-- MIME / size / magic-byte validation. After Task 7, only the service-role
-- caller inside the upload-verification-doc edge function may write to the
-- bucket, ensuring every uploaded student-ID document is validated.
--
-- The SELECT policy ("Users can view their own verification documents", added
-- in 20260405230000_add_student_id_verification_flow.sql) is intentionally
-- preserved so the client can still preview their own document before admin
-- review. Service-role reads (used by the admin review function) bypass RLS.
DROP POLICY IF EXISTS "Users can upload their own verification documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own verification documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own verification documents" ON storage.objects;
