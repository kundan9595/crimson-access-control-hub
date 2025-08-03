-- Create function to get global class inventory
CREATE OR REPLACE FUNCTION public.get_global_class_inventory(
  search_query TEXT DEFAULT NULL,
  page_number INTEGER DEFAULT 1,
  page_size INTEGER DEFAULT 20
)
RETURNS TABLE (
  class_id UUID,
  class_name TEXT,
  style_name TEXT,
  brand_name TEXT,
  color_name TEXT,
  size_group_name TEXT,
  total_quantity BIGINT,
  reserved_quantity BIGINT,
  available_quantity BIGINT,
  sku_count BIGINT,
  warehouse_count BIGINT,
  locations_count BIGINT
)
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT
    cl.id as class_id,
    cl.name as class_name,
    st.name as style_name,
    b.name as brand_name,
    c.name as color_name,
    sg.name as size_group_name,
    COALESCE(SUM(wi.total_quantity), 0) as total_quantity,
    COALESCE(SUM(wi.reserved_quantity), 0) as reserved_quantity,
    COALESCE(SUM(wi.available_quantity), 0) as available_quantity,
    COUNT(DISTINCT s.id) as sku_count,
    COUNT(DISTINCT wi.warehouse_id) as warehouse_count,
    COUNT(DISTINCT wil.id) as locations_count
  FROM public.classes cl
  JOIN public.styles st ON cl.style_id = st.id
  JOIN public.brands b ON st.brand_id = b.id
  LEFT JOIN public.colors c ON cl.color_id = c.id
  LEFT JOIN public.size_groups sg ON cl.size_group_id = sg.id
  LEFT JOIN public.skus s ON cl.id = s.class_id
  LEFT JOIN public.warehouse_inventory wi ON s.id = wi.sku_id
  LEFT JOIN public.warehouse_inventory_locations wil ON wi.id = wil.warehouse_inventory_id
  WHERE (search_query IS NULL OR 
         cl.name ILIKE '%' || search_query || '%' OR
         st.name ILIKE '%' || search_query || '%' OR
         b.name ILIKE '%' || search_query || '%' OR
         c.name ILIKE '%' || search_query || '%')
  GROUP BY cl.id, cl.name, st.name, b.name, c.name, sg.name
  ORDER BY total_quantity DESC, cl.name ASC
  LIMIT page_size
  OFFSET (page_number - 1) * page_size;
$$;

-- Create function to get global style inventory
CREATE OR REPLACE FUNCTION public.get_global_style_inventory(
  search_query TEXT DEFAULT NULL,
  page_number INTEGER DEFAULT 1,
  page_size INTEGER DEFAULT 20
)
RETURNS TABLE (
  style_id UUID,
  style_name TEXT,
  brand_name TEXT,
  category_name TEXT,
  total_quantity BIGINT,
  reserved_quantity BIGINT,
  available_quantity BIGINT,
  class_count BIGINT,
  sku_count BIGINT,
  warehouse_count BIGINT,
  locations_count BIGINT
)
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT
    st.id as style_id,
    st.name as style_name,
    b.name as brand_name,
    cat.name as category_name,
    COALESCE(SUM(wi.total_quantity), 0) as total_quantity,
    COALESCE(SUM(wi.reserved_quantity), 0) as reserved_quantity,
    COALESCE(SUM(wi.available_quantity), 0) as available_quantity,
    COUNT(DISTINCT cl.id) as class_count,
    COUNT(DISTINCT s.id) as sku_count,
    COUNT(DISTINCT wi.warehouse_id) as warehouse_count,
    COUNT(DISTINCT wil.id) as locations_count
  FROM public.styles st
  JOIN public.brands b ON st.brand_id = b.id
  LEFT JOIN public.categories cat ON st.category_id = cat.id
  LEFT JOIN public.classes cl ON st.id = cl.style_id
  LEFT JOIN public.skus s ON cl.id = s.class_id
  LEFT JOIN public.warehouse_inventory wi ON s.id = wi.sku_id
  LEFT JOIN public.warehouse_inventory_locations wil ON wi.id = wil.warehouse_inventory_id
  WHERE (search_query IS NULL OR 
         st.name ILIKE '%' || search_query || '%' OR
         b.name ILIKE '%' || search_query || '%' OR
         cat.name ILIKE '%' || search_query || '%')
  GROUP BY st.id, st.name, b.name, cat.name
  ORDER BY total_quantity DESC, st.name ASC
  LIMIT page_size
  OFFSET (page_number - 1) * page_size;
$$;

-- Create function to get class inventory statistics
CREATE OR REPLACE FUNCTION public.get_global_class_inventory_statistics()
RETURNS TABLE (
  total_classes BIGINT,
  total_quantity BIGINT,
  reserved_quantity BIGINT,
  available_quantity BIGINT,
  total_skus BIGINT,
  total_warehouses BIGINT
)
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT
    COUNT(DISTINCT cl.id) as total_classes,
    COALESCE(SUM(wi.total_quantity), 0) as total_quantity,
    COALESCE(SUM(wi.reserved_quantity), 0) as reserved_quantity,
    COALESCE(SUM(wi.available_quantity), 0) as available_quantity,
    COUNT(DISTINCT s.id) as total_skus,
    COUNT(DISTINCT wi.warehouse_id) as total_warehouses
  FROM public.classes cl
  LEFT JOIN public.skus s ON cl.id = s.class_id
  LEFT JOIN public.warehouse_inventory wi ON s.id = wi.sku_id;
$$;

-- Create function to get style inventory statistics
CREATE OR REPLACE FUNCTION public.get_global_style_inventory_statistics()
RETURNS TABLE (
  total_styles BIGINT,
  total_quantity BIGINT,
  reserved_quantity BIGINT,
  available_quantity BIGINT,
  total_classes BIGINT,
  total_skus BIGINT,
  total_warehouses BIGINT
)
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT
    COUNT(DISTINCT st.id) as total_styles,
    COALESCE(SUM(wi.total_quantity), 0) as total_quantity,
    COALESCE(SUM(wi.reserved_quantity), 0) as reserved_quantity,
    COALESCE(SUM(wi.available_quantity), 0) as available_quantity,
    COUNT(DISTINCT cl.id) as total_classes,
    COUNT(DISTINCT s.id) as total_skus,
    COUNT(DISTINCT wi.warehouse_id) as total_warehouses
  FROM public.styles st
  LEFT JOIN public.classes cl ON st.id = cl.style_id
  LEFT JOIN public.skus s ON cl.id = s.class_id
  LEFT JOIN public.warehouse_inventory wi ON s.id = wi.sku_id;
$$; 