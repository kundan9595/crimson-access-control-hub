-- Create function to get global inventory
CREATE OR REPLACE FUNCTION public.get_global_inventory(
  search_query TEXT DEFAULT NULL,
  page_number INTEGER DEFAULT 1,
  page_size INTEGER DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  warehouse_id UUID,
  sku_id UUID,
  total_quantity INTEGER,
  reserved_quantity INTEGER,
  available_quantity INTEGER,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  warehouse_name TEXT,
  warehouse_city TEXT,
  warehouse_state TEXT,
  sku_code TEXT,
  brand_name TEXT,
  style_name TEXT,
  color_name TEXT,
  size_name TEXT
)
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT
    wi.id,
    wi.warehouse_id,
    wi.sku_id,
    wi.total_quantity,
    wi.reserved_quantity,
    wi.available_quantity,
    wi.created_at,
    wi.updated_at,
    w.name as warehouse_name,
    w.city as warehouse_city,
    w.state as warehouse_state,
    s.sku_code,
    b.name as brand_name,
    st.name as style_name,
    c.name as color_name,
    sz.name as size_name
  FROM public.warehouse_inventory wi
  JOIN public.warehouses w ON wi.warehouse_id = w.id
  JOIN public.skus s ON wi.sku_id = s.id
  JOIN public.classes cl ON s.class_id = cl.id
  JOIN public.styles st ON cl.style_id = st.id
  JOIN public.brands b ON st.brand_id = b.id
  JOIN public.colors c ON cl.color_id = c.id
  JOIN public.sizes sz ON s.size_id = sz.id
  WHERE (search_query IS NULL OR 
         s.sku_code ILIKE '%' || search_query || '%' OR
         b.name ILIKE '%' || search_query || '%' OR
         st.name ILIKE '%' || search_query || '%')
  ORDER BY wi.created_at DESC
  LIMIT page_size
  OFFSET (page_number - 1) * page_size;
$$;

-- Create function to get global inventory statistics
CREATE OR REPLACE FUNCTION public.get_global_inventory_statistics()
RETURNS TABLE (
  total_items BIGINT,
  total_quantity BIGINT,
  reserved_quantity BIGINT,
  available_quantity BIGINT
)
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT
    COUNT(*) as total_items,
    COALESCE(SUM(total_quantity), 0) as total_quantity,
    COALESCE(SUM(reserved_quantity), 0) as reserved_quantity,
    COALESCE(SUM(available_quantity), 0) as available_quantity
  FROM public.warehouse_inventory;
$$; 