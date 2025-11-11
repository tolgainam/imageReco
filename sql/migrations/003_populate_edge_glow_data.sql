-- ============================================================================
-- Migration: Populate Edge Glow Data from products.json
-- ============================================================================
-- Version: 003
-- Created: 2025-11-11
-- Description: Migrates existing edgeGlow configuration from products.json
--              to Supabase database for products product-1 and product-2
-- ============================================================================
-- NOTE: Only run this if you have existing products in your database
-- ============================================================================

-- Product 1: Zyn Spearmint
-- edgeGlow: { enabled: true, glowIntensity: 120, glowOpacity: 0.25 }
UPDATE product_ui_config
SET
  edge_glow_enabled = true,
  edge_glow_intensity = 120,
  edge_glow_opacity = 0.25
WHERE product_id = (
  SELECT id FROM products WHERE product_id = 'product-1' LIMIT 1
);

-- Product 2: Zyn Cool Mint
-- edgeGlow: { enabled: true, glowIntensity: 140, glowOpacity: 0.30 }
UPDATE product_ui_config
SET
  edge_glow_enabled = true,
  edge_glow_intensity = 140,
  edge_glow_opacity = 0.30
WHERE product_id = (
  SELECT id FROM products WHERE product_id = 'product-2' LIMIT 1
);

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- Run this query to verify the data was updated:
--
-- SELECT
--   p.product_id,
--   p.name,
--   ui.edge_glow_enabled,
--   ui.edge_glow_intensity,
--   ui.edge_glow_opacity
-- FROM products p
-- JOIN product_ui_config ui ON ui.product_id = p.id
-- WHERE p.product_id IN ('product-1', 'product-2');
--
-- Expected output:
-- product-1 | Zyn Spearmint | true | 120 | 0.25
-- product-2 | Zyn Cool Mint | true | 140 | 0.30
-- ============================================================================

-- ============================================================================
-- ALTERNATIVE: Insert if products don't exist yet
-- ============================================================================
-- If you haven't created products in Supabase yet, you can use this template
-- to insert them with edgeGlow configuration:
--
-- INSERT INTO products (product_id, name, description, target_index, status)
-- VALUES ('product-1', 'Zyn Spearmint', 'Zyn Spearmint nicotine pouches', 0, 'published')
-- RETURNING id;
--
-- -- Then insert UI config with the returned ID
-- INSERT INTO product_ui_config (
--   product_id,
--   title, subtitle, description_text,
--   edge_glow_enabled, edge_glow_intensity, edge_glow_opacity
-- ) VALUES (
--   '[INSERT_ID_HERE]',
--   'Zyn Spearmint', 'X-Low 1.5MG', 'Product description...',
--   true, 120, 0.25
-- );
-- ============================================================================
