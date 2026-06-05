
-- Add csv_upload_id column to orders to link orders to their source upload
ALTER TABLE public.orders ADD COLUMN csv_upload_id uuid REFERENCES public.csv_uploads(id) ON DELETE CASCADE;

-- Create index for fast lookup when deleting uploads
CREATE INDEX idx_orders_csv_upload_id ON public.orders(csv_upload_id);

-- Allow users to delete their own uploads
CREATE POLICY "Users can delete their own uploads"
ON public.csv_uploads
FOR DELETE
USING (auth.uid() = user_id);
