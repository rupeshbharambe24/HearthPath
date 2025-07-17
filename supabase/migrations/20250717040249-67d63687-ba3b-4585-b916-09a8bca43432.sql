
-- Create storage bucket for profile photos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('profile-photos', 'profile-photos', true);

-- Create policy to allow authenticated users to upload their own photos
CREATE POLICY "Users can upload their own photos" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'profile-photos' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Create policy to allow public read access to photos
CREATE POLICY "Public read access for profile photos" ON storage.objects
FOR SELECT USING (bucket_id = 'profile-photos');

-- Create policy to allow users to update their own photos
CREATE POLICY "Users can update their own photos" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'profile-photos' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Create policy to allow users to delete their own photos
CREATE POLICY "Users can delete their own photos" ON storage.objects
FOR DELETE USING (
  bucket_id = 'profile-photos' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);
