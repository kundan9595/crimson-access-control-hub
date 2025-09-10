-- Simplify QC tables from two tables to one
-- Drop existing QC tables and functions
DROP TABLE IF EXISTS public.qc_session_items CASCADE;
DROP TABLE IF EXISTS public.qc_sessions CASCADE;
DROP FUNCTION IF EXISTS public.get_qc_items_for_grn(UUID);
DROP FUNCTION IF EXISTS public.get_qc_sessions(UUID);
DROP FUNCTION IF EXISTS public.save_qc_session(UUID, TEXT, JSONB);
DROP FUNCTION IF EXISTS public.delete_qc_session(UUID, UUID);

-- Create simplified QC reports table
CREATE TABLE IF NOT EXISTS public.qc_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  grn_id UUID NOT NULL REFERENCES public.grn_entries(id) ON DELETE CASCADE,
  report_name TEXT NOT NULL,
  report_timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Item identification
  item_type TEXT NOT NULL CHECK (item_type IN ('sku', 'misc')),
  sku_id UUID REFERENCES public.skus(id),
  size_id UUID REFERENCES public.sizes(id),
  misc_name TEXT,
  
  -- QC data
  received_qty INTEGER NOT NULL DEFAULT 0,
  samples_checked INTEGER NOT NULL DEFAULT 0,
  samples_ok INTEGER NOT NULL DEFAULT 0,
  samples_not_ok INTEGER NOT NULL DEFAULT 0,
  qc_percentage NUMERIC(5,2) NOT NULL DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Create indexes for better performance
CREATE INDEX idx_qc_reports_grn_id ON public.qc_reports(grn_id);
CREATE INDEX idx_qc_reports_sku_id ON public.qc_reports(sku_id);
CREATE INDEX idx_qc_reports_report_timestamp ON public.qc_reports(report_timestamp);

-- Enable RLS
ALTER TABLE public.qc_reports ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view QC reports" 
  ON public.qc_reports 
  FOR SELECT 
  USING (true);

CREATE POLICY "Users can insert QC reports" 
  ON public.qc_reports 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Users can update QC reports" 
  ON public.qc_reports 
  FOR UPDATE 
  USING (true);

CREATE POLICY "Users can delete QC reports" 
  ON public.qc_reports 
  FOR DELETE 
  USING (true);

-- Create function to get QC items for GRN (simplified)
CREATE OR REPLACE FUNCTION public.get_qc_items_for_grn(p_grn_id UUID)
RETURNS TABLE (
  item_id TEXT,
  item_type TEXT,
  sku_id UUID,
  sku_code TEXT,
  sku_name TEXT,
  size_id UUID,
  size_name TEXT,
  size_code TEXT,
  misc_name TEXT,
  ordered_quantity INTEGER,
  received_quantity INTEGER
)
LANGUAGE SQL
SECURITY DEFINER
AS $$
  WITH grn_totals AS (
    SELECT 
      CASE 
        WHEN gsi.item_type = 'sku' THEN CONCAT(gsi.sku_id::text, '-', gsi.size_id::text)
        ELSE gsi.item_id::text
      END as item_id,
      gsi.item_type,
      gsi.sku_id,
      s.sku_code,
      CONCAT(b.name, ' ', st.name) as sku_name,
      gsi.size_id,
      sz.name as size_name,
      sz.code as size_code,
      gsi.misc_name,
      SUM(gsi.ordered_quantity) as ordered_quantity,
      SUM(gsi.good_quantity + gsi.bad_quantity) as received_quantity
    FROM public.grn_session_items gsi
    LEFT JOIN public.skus s ON gsi.sku_id = s.id
    LEFT JOIN public.classes cl ON s.class_id = cl.id
    LEFT JOIN public.styles st ON cl.style_id = st.id
    LEFT JOIN public.brands b ON st.brand_id = b.id
    LEFT JOIN public.sizes sz ON gsi.size_id = sz.id
    WHERE gsi.grn_session_id IN (
      SELECT id FROM public.grn_sessions 
      WHERE grn_id = p_grn_id AND is_saved = true
    )
    GROUP BY 
      CASE 
        WHEN gsi.item_type = 'sku' THEN CONCAT(gsi.sku_id::text, '-', gsi.size_id::text)
        ELSE gsi.item_id::text
      END,
      gsi.item_type,
      gsi.sku_id,
      s.sku_code,
      CONCAT(b.name, ' ', st.name),
      gsi.size_id,
      sz.name,
      sz.code,
      gsi.misc_name
    HAVING SUM(gsi.good_quantity + gsi.bad_quantity) > 0
  )
  SELECT 
    item_id,
    item_type,
    sku_id,
    sku_code,
    sku_name,
    size_id,
    size_name,
    size_code,
    misc_name,
    ordered_quantity,
    received_quantity
  FROM grn_totals
  ORDER BY sku_code, size_code;
$$;

-- Create function to get QC reports for GRN
CREATE OR REPLACE FUNCTION public.get_qc_reports(p_grn_id UUID)
RETURNS TABLE (
  id UUID,
  report_name TEXT,
  report_timestamp TIMESTAMPTZ,
  item_type TEXT,
  sku_id UUID,
  sku_code TEXT,
  sku_name TEXT,
  size_id UUID,
  size_name TEXT,
  size_code TEXT,
  misc_name TEXT,
  received_qty INTEGER,
  samples_checked INTEGER,
  samples_ok INTEGER,
  samples_not_ok INTEGER,
  qc_percentage NUMERIC(5,2)
)
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT 
    qr.id,
    qr.report_name,
    qr.report_timestamp,
    qr.item_type,
    qr.sku_id,
    s.sku_code,
    CONCAT(b.name, ' ', st.name) as sku_name,
    qr.size_id,
    sz.name as size_name,
    sz.code as size_code,
    qr.misc_name,
    qr.received_qty,
    qr.samples_checked,
    qr.samples_ok,
    qr.samples_not_ok,
    qr.qc_percentage
  FROM public.qc_reports qr
  LEFT JOIN public.skus s ON qr.sku_id = s.id
  LEFT JOIN public.classes cl ON s.class_id = cl.id
  LEFT JOIN public.styles st ON cl.style_id = st.id
  LEFT JOIN public.brands b ON st.brand_id = b.id
  LEFT JOIN public.sizes sz ON qr.size_id = sz.id
  WHERE qr.grn_id = p_grn_id
  ORDER BY qr.report_timestamp DESC, s.sku_code, sz.code;
$$;

-- Create function to save QC report (simplified)
CREATE OR REPLACE FUNCTION public.save_qc_report(
  p_grn_id UUID,
  p_report_name TEXT,
  p_report_data JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  report_id UUID;
  item_data JSONB;
BEGIN
  -- Insert QC report items directly
  FOR item_data IN SELECT * FROM jsonb_array_elements(p_report_data)
  LOOP
    INSERT INTO public.qc_reports (
      grn_id,
      report_name,
      item_type,
      sku_id,
      size_id,
      misc_name,
      received_qty,
      samples_checked,
      samples_ok,
      samples_not_ok,
      qc_percentage
    ) VALUES (
      p_grn_id,
      p_report_name,
      (item_data->>'item_type')::TEXT,
      CASE WHEN item_data->>'sku_id' IS NOT NULL THEN (item_data->>'sku_id')::UUID ELSE NULL END,
      CASE WHEN item_data->>'size_id' IS NOT NULL THEN (item_data->>'size_id')::UUID ELSE NULL END,
      item_data->>'misc_name',
      (item_data->>'received_qty')::INTEGER,
      (item_data->>'samples_checked')::INTEGER,
      (item_data->>'samples_ok')::INTEGER,
      (item_data->>'samples_not_ok')::INTEGER,
      (item_data->>'qc_percentage')::NUMERIC(5,2)
    ) RETURNING id INTO report_id;
  END LOOP;

  RETURN report_id;
END;
$$;

-- Create function to delete QC report
CREATE OR REPLACE FUNCTION public.delete_qc_report(
  p_report_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.qc_reports 
  WHERE id = p_report_id;
END;
$$;

-- Create trigger for automatic timestamp tracking
CREATE TRIGGER handle_qc_reports_updated_at
  BEFORE UPDATE ON public.qc_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
