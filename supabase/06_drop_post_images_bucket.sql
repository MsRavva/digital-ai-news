-- Drop legacy post images bucket and related storage policies.
-- Run manually in Supabase only if the application no longer uses post image uploads.

DROP POLICY IF EXISTS "Authenticated users can delete own post images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update own post images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload own post images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view post images" ON storage.objects;

DELETE FROM storage.objects
WHERE bucket_id = 'post-images';

DELETE FROM storage.buckets
WHERE id = 'post-images';
