-- Create function to get filtered consolidated SKU inventory
CREATE OR REPLACE FUNCTION public.get_filtered_consolidated_sku_inventory(
  search_query TEXT DEFAULT NULL,
  warehouse_id UUID DEFAULT NULL,
  brand_name TEXT DEFAULT NULL,
  category_name TEXT DEFAULT NULL,
  color_name TEXT DEFAULT NULL,
  size_name TEXT DEFAULT NULL,
  min_quantity INTEGER DEFAULT NULL,
  max_quantity INTEGER DEFAULT NULL,
  stock_status TEXT DEFAULT NULL,
  has_reservations BOOLEAN DEFAULT NULL,
  page_number INTEGER DEFAULT 1,
  page_size INTEGER DEFAULT 20
)
RETURNS TABLE (
  sku_id UUID,
  sku_code TEXT,
  brand_name TEXT,
  style_name TEXT,
  class_name TEXT,
  color_name TEXT,
  size_name TEXT,
  total_quantity BIGINT,
  reserved_quantity BIGINT,
  available_quantity BIGINT,
  warehouse_count BIGINT,
  locations_count BIGINT
)
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT
    s.id as sku_id,
    s.sku_code,
    b.name as brand_name,
    st.name as style_name,
    cl.name as class_name,
    c.name as color_name,
    sz.name as size_name,
    COALESCE(SUM(wi.total_quantity), 0) as total_quantity,
    COALESCE(SUM(wi.reserved_quantity), 0) as reserved_quantity,
    COALESCE(SUM(wi.available_quantity), 0) as available_quantity,
    COUNT(DISTINCT wi.warehouse_id) as warehouse_count,
    COUNT(DISTINCT wil.id) as locations_count
  FROM public.skus s
  JOIN public.classes cl ON s.class_id = cl.id
  JOIN public.styles st ON cl.style_id = st.id
  JOIN public.brands b ON st.brand_id = b.id
  LEFT JOIN public.colors c ON cl.color_id = c.id
  LEFT JOIN public.sizes sz ON s.size_id = sz.id
  LEFT JOIN public.categories cat ON st.category_id = cat.id
  LEFT JOIN public.warehouse_inventory wi ON s.id = wi.sku_id
  LEFT JOIN public.warehouse_inventory_locations wil ON wi.id = wil.warehouse_inventory_id
  WHERE 
    -- Search query filter
    (search_query IS NULL OR 
     s.sku_code ILIKE '%' || search_query || '%' OR
     b.name ILIKE '%' || search_query || '%' OR
     st.name ILIKE '%' || search_query || '%' OR
     cl.name ILIKE '%' || search_query || '%' OR
     c.name ILIKE '%' || search_query || '%') AND
    -- Warehouse filter
    (warehouse_id IS NULL OR wi.warehouse_id = warehouse_id) AND
    -- Brand filter
    (brand_name IS NULL OR b.name = brand_name) AND
    -- Category filter
    (category_name IS NULL OR cat.name = category_name) AND
    -- Color filter
    (color_name IS NULL OR c.name = color_name) AND
    -- Size filter
    (size_name IS NULL OR sz.name = size_name) AND
    -- Quantity range filters
    (min_quantity IS NULL OR COALESCE(SUM(wi.available_quantity), 0) >= min_quantity) AND
    (max_quantity IS NULL OR COALESCE(SUM(wi.available_quantity), 0) <= max_quantity) AND
    -- Stock status filter
    (stock_status IS NULL OR 
     (stock_status = 'in_stock' AND COALESCE(SUM(wi.available_quantity), 0) > 0) OR
     (stock_status = 'low_stock' AND COALESCE(SUM(wi.available_quantity), 0) BETWEEN 1 AND 10) OR
     (stock_status = 'out_of_stock' AND COALESCE(SUM(wi.available_quantity), 0) = 0)) AND
    -- Reservations filter
    (has_reservations IS NULL OR 
     (has_reservations = true AND COALESCE(SUM(wi.reserved_quantity), 0) > 0) OR
     (has_reservations = false AND COALESCE(SUM(wi.reserved_quantity), 0) = 0))
  GROUP BY s.id, s.sku_code, b.name, st.name, cl.name, c.name, sz.name
  HAVING 
    -- Apply quantity filters after grouping
    (min_quantity IS NULL OR COALESCE(SUM(wi.available_quantity), 0) >= min_quantity) AND
    (max_quantity IS NULL OR COALESCE(SUM(wi.available_quantity), 0) <= max_quantity) AND
    -- Apply stock status filter after grouping
    (stock_status IS NULL OR 
     (stock_status = 'in_stock' AND COALESCE(SUM(wi.available_quantity), 0) > 0) OR
     (stock_status = 'low_stock' AND COALESCE(SUM(wi.available_quantity), 0) BETWEEN 1 AND 10) OR
     (stock_status = 'out_of_stock' AND COALESCE(SUM(wi.available_quantity), 0) = 0)) AND
    -- Apply reservations filter after grouping
    (has_reservations IS NULL OR 
     (has_reservations = true AND COALESCE(SUM(wi.reserved_quantity), 0) > 0) OR
     (has_reservations = false AND COALESCE(SUM(wi.reserved_quantity), 0) = 0))
  ORDER BY total_quantity DESC, s.sku_code ASC
  LIMIT page_size
  OFFSET (page_number - 1) * page_size;
$$;

-- Create function to get filtered consolidated SKU inventory count
CREATE OR REPLACE FUNCTION public.get_filtered_consolidated_sku_inventory_count(
  search_query TEXT DEFAULT NULL,
  warehouse_id UUID DEFAULT NULL,
  brand_name TEXT DEFAULT NULL,
  category_name TEXT DEFAULT NULL,
  color_name TEXT DEFAULT NULL,
  size_name TEXT DEFAULT NULL,
  min_quantity INTEGER DEFAULT NULL,
  max_quantity INTEGER DEFAULT NULL,
  stock_status TEXT DEFAULT NULL,
  has_reservations BOOLEAN DEFAULT NULL
)
RETURNS BIGINT
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT COUNT(DISTINCT s.id)
  FROM public.skus s
  JOIN public.classes cl ON s.class_id = cl.id
  JOIN public.styles st ON cl.style_id = st.id
  JOIN public.brands b ON st.brand_id = b.id
  LEFT JOIN public.colors c ON cl.color_id = c.id
  LEFT JOIN public.sizes sz ON s.size_id = sz.id
  LEFT JOIN public.categories cat ON st.category_id = cat.id
  LEFT JOIN public.warehouse_inventory wi ON s.id = wi.sku_id
  LEFT JOIN public.warehouse_inventory_locations wil ON wi.id = wil.warehouse_inventory_id
  WHERE 
    -- Search query filter
    (search_query IS NULL OR 
     s.sku_code ILIKE '%' || search_query || '%' OR
     b.name ILIKE '%' || search_query || '%' OR
     st.name ILIKE '%' || search_query || '%' OR
     cl.name ILIKE '%' || search_query || '%' OR
     c.name ILIKE '%' || search_query || '%') AND
    -- Warehouse filter
    (warehouse_id IS NULL OR wi.warehouse_id = warehouse_id) AND
    -- Brand filter
    (brand_name IS NULL OR b.name = brand_name) AND
    -- Category filter
    (category_name IS NULL OR cat.name = category_name) AND
    -- Color filter
    (color_name IS NULL OR c.name = color_name) AND
    -- Size filter
    (size_name IS NULL OR sz.name = size_name) AND
    -- Quantity range filters
    (min_quantity IS NULL OR COALESCE(SUM(wi.available_quantity), 0) >= min_quantity) AND
    (max_quantity IS NULL OR COALESCE(SUM(wi.available_quantity), 0) <= max_quantity) AND
    -- Stock status filter
    (stock_status IS NULL OR 
     (stock_status = 'in_stock' AND COALESCE(SUM(wi.available_quantity), 0) > 0) OR
     (stock_status = 'low_stock' AND COALESCE(SUM(wi.available_quantity), 0) BETWEEN 1 AND 10) OR
     (stock_status = 'out_of_stock' AND COALESCE(SUM(wi.available_quantity), 0) = 0)) AND
    -- Reservations filter
    (has_reservations IS NULL OR 
     (has_reservations = true AND COALESCE(SUM(wi.reserved_quantity), 0) > 0) OR
     (has_reservations = false AND COALESCE(SUM(wi.reserved_quantity), 0) = 0))
  GROUP BY s.id, s.sku_code, b.name, st.name, cl.name, c.name, sz.name
  HAVING 
    -- Apply quantity filters after grouping
    (min_quantity IS NULL OR COALESCE(SUM(wi.available_quantity), 0) >= min_quantity) AND
    (max_quantity IS NULL OR COALESCE(SUM(wi.available_quantity), 0) <= max_quantity) AND
    -- Apply stock status filter after grouping
    (stock_status IS NULL OR 
     (stock_status = 'in_stock' AND COALESCE(SUM(wi.available_quantity), 0) > 0) OR
     (stock_status = 'low_stock' AND COALESCE(SUM(wi.available_quantity), 0) BETWEEN 1 AND 10) OR
     (stock_status = 'out_of_stock' AND COALESCE(SUM(wi.available_quantity), 0) = 0)) AND
    -- Apply reservations filter after grouping
    (has_reservations IS NULL OR 
     (has_reservations = true AND COALESCE(SUM(wi.reserved_quantity), 0) > 0) OR
     (has_reservations = false AND COALESCE(SUM(wi.reserved_quantity), 0) = 0));
$$;
