
-- Create storage bucket for vendor documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('vendor-documents', 'vendor-documents', true);

-- Create storage policies
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'vendor-documents');
CREATE POLICY "Authenticated users can upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'vendor-documents' AND auth.role() = 'authenticated');
