-- Create QC sessions table
CREATE TABLE IF NOT EXISTS public.qc_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  grn_id UUID NOT NULL REFERENCES public.grn_entries(id) ON DELETE CASCADE,
  session_name TEXT NOT NULL,
  session_timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_saved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create QC session items table
CREATE TABLE IF NOT EXISTS public.qc_session_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  qc_session_id UUID NOT NULL REFERENCES public.qc_sessions(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN ('sku', 'misc')),
  item_id UUID NOT NULL,
  sku_id UUID REFERENCES public.skus(id),
  size_id UUID REFERENCES public.sizes(id),
  misc_name TEXT,
  received_qty INTEGER NOT NULL DEFAULT 0,
  samples_checked INTEGER NOT NULL DEFAULT 0,
  samples_ok INTEGER NOT NULL DEFAULT 0,
  samples_not_ok INTEGER NOT NULL DEFAULT 0,
  qc_percentage NUMERIC(5,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on QC tables
ALTER TABLE public.qc_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qc_session_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for QC tables
CREATE POLICY "Users can view QC sessions" 
  ON public.qc_sessions 
  FOR SELECT 
  USING (true);

CREATE POLICY "Users can insert QC sessions" 
  ON public.qc_sessions 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Users can update QC sessions" 
  ON public.qc_sessions 
  FOR UPDATE 
  USING (true);

CREATE POLICY "Users can delete QC sessions" 
  ON public.qc_sessions 
  FOR DELETE 
  USING (true);

CREATE POLICY "Users can view QC session items" 
  ON public.qc_session_items 
  FOR SELECT 
  USING (true);

CREATE POLICY "Users can insert QC session items" 
  ON public.qc_session_items 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Users can update QC session items" 
  ON public.qc_session_items 
  FOR UPDATE 
  USING (true);

CREATE POLICY "Users can delete QC session items" 
  ON public.qc_session_items 
  FOR DELETE 
  USING (true);

-- Create function to get QC items for GRN
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

-- Create function to get QC sessions
CREATE OR REPLACE FUNCTION public.get_qc_sessions(p_grn_id UUID)
RETURNS TABLE (
  session_id UUID,
  session_name TEXT,
  session_timestamp TIMESTAMPTZ,
  is_saved BOOLEAN,
  items JSONB
)
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT 
    qs.id as session_id,
    qs.session_name,
    qs.session_timestamp,
    qs.is_saved,
    COALESCE(
      json_agg(
        json_build_object(
          'item_type', qsi.item_type,
          'item_id', qsi.item_id,
          'sku_id', qsi.sku_id,
          'size_id', qsi.size_id,
          'misc_name', qsi.misc_name,
          'received_qty', qsi.received_qty,
          'samples_checked', qsi.samples_checked,
          'samples_ok', qsi.samples_ok,
          'samples_not_ok', qsi.samples_not_ok,
          'qc_percentage', qsi.qc_percentage
        )
      ) FILTER (WHERE qsi.id IS NOT NULL),
      '[]'::json
    ) as items
  FROM public.qc_sessions qs
  LEFT JOIN public.qc_session_items qsi ON qs.id = qsi.qc_session_id
  WHERE qs.grn_id = p_grn_id
  GROUP BY qs.id, qs.session_name, qs.session_timestamp, qs.is_saved
  ORDER BY qs.session_timestamp DESC;
$$;

-- Create function to save QC session
CREATE OR REPLACE FUNCTION public.save_qc_session(
  p_grn_id UUID,
  p_session_name TEXT,
  p_session_data JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  qc_session_id UUID;
  item_data JSONB;
BEGIN
  -- Create QC session
  INSERT INTO public.qc_sessions (grn_id, session_name, is_saved)
  VALUES (p_grn_id, p_session_name, true)
  RETURNING id INTO qc_session_id;

  -- Insert QC session items
  FOR item_data IN SELECT * FROM jsonb_array_elements(p_session_data)
  LOOP
    INSERT INTO public.qc_session_items (
      qc_session_id,
      item_type,
      item_id,
      sku_id,
      size_id,
      misc_name,
      received_qty,
      samples_checked,
      samples_ok,
      samples_not_ok,
      qc_percentage
    ) VALUES (
      qc_session_id,
      (item_data->>'item_type')::TEXT,
      (item_data->>'item_id')::UUID,
      CASE WHEN item_data->>'sku_id' IS NOT NULL THEN (item_data->>'sku_id')::UUID ELSE NULL END,
      CASE WHEN item_data->>'size_id' IS NOT NULL THEN (item_data->>'size_id')::UUID ELSE NULL END,
      item_data->>'misc_name',
      (item_data->>'received_qty')::INTEGER,
      (item_data->>'samples_checked')::INTEGER,
      (item_data->>'samples_ok')::INTEGER,
      (item_data->>'samples_not_ok')::INTEGER,
      (item_data->>'qc_percentage')::NUMERIC(5,2)
    );
  END LOOP;

  RETURN qc_session_id;
END;
$$;

-- Create function to delete QC session
CREATE OR REPLACE FUNCTION public.delete_qc_session(
  p_session_id UUID,
  p_grn_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete QC session items first (cascade will handle this, but being explicit)
  DELETE FROM public.qc_session_items 
  WHERE qc_session_id = p_session_id;
  
  -- Delete QC session
  DELETE FROM public.qc_sessions 
  WHERE id = p_session_id AND grn_id = p_grn_id;
END;
$$;

-- Create triggers for automatic timestamp tracking
CREATE TRIGGER handle_qc_sessions_updated_at
  BEFORE UPDATE ON public.qc_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_qc_session_items_updated_at
  BEFORE UPDATE ON public.qc_session_items
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
