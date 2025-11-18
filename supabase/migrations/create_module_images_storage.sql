-- Create storage bucket for module images
-- This bucket will store images uploaded for learner modules
-- Run this in Supabase SQL Editor

-- Note: Storage buckets are created via the Supabase Dashboard UI, not SQL
-- Go to: Storage > Create Bucket
-- Bucket Name: module-images
-- Public: Yes (checked)
-- File size limit: 10MB (or as needed)
-- Allowed MIME types: image/*

-- After creating the bucket, set up RLS policies:

-- Policy: Allow authenticated users to upload images
CREATE POLICY "Admins can upload module images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'module-images' AND
  (storage.foldername(name))[1] IS NOT NULL
);

-- Policy: Allow public read access to module images
CREATE POLICY "Public can view module images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'module-images');

-- Policy: Admins can delete module images
CREATE POLICY "Admins can delete module images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'module-images' AND
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

