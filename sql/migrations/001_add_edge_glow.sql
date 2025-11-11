-- ============================================================================
-- Migration: Add Edge Glow Support to product_ui_config
-- ============================================================================
-- Version: 001
-- Created: 2025-11-11
-- Description: Adds edgeGlow configuration columns to support ambient edge
--              glow effects around screen borders during AR tracking
-- ============================================================================

-- Add edgeGlow columns to product_ui_config table
ALTER TABLE product_ui_config
ADD COLUMN IF NOT EXISTS edge_glow_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS edge_glow_intensity INTEGER DEFAULT 100,
ADD COLUMN IF NOT EXISTS edge_glow_opacity DECIMAL(3, 2) DEFAULT 0.30;

-- Add column comments for documentation
COMMENT ON COLUMN product_ui_config.edge_glow_enabled
  IS 'Enable edge glow effect around screen borders during AR tracking';

COMMENT ON COLUMN product_ui_config.edge_glow_intensity
  IS 'Glow spread distance in pixels (recommended range: 50-200, default: 100)';

COMMENT ON COLUMN product_ui_config.edge_glow_opacity
  IS 'Glow visibility/opacity (range: 0.0-1.0, default: 0.30)';

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- Run this query to verify the columns were added:
--
-- SELECT column_name, data_type, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'product_ui_config'
--   AND column_name LIKE 'edge_glow%';
-- ============================================================================
