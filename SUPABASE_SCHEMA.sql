-- ============================================================================
-- Supabase Database Schema for Image Recognition AR Experience
-- ============================================================================
-- Version: 1.0
-- Created: 2025-11-09
-- Description: Complete database schema for dynamic product management
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- TABLE: products
-- Main product configuration table
-- ============================================================================

CREATE TABLE products (
  -- Identity
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  target_index INTEGER NOT NULL,

  -- Status and visibility
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  published_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  version INTEGER DEFAULT 1
);

-- Indexes
CREATE INDEX idx_products_product_id ON products(product_id);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_published_at ON products(published_at DESC);
CREATE INDEX idx_products_target_index ON products(target_index);

-- Partial unique index: Only one published product per target_index
CREATE UNIQUE INDEX idx_products_unique_target_published
  ON products(target_index)
  WHERE status = 'published';

COMMENT ON TABLE products IS 'Main product configuration table';
COMMENT ON COLUMN products.product_id IS 'Custom ID for frontend compatibility (e.g., "product-1")';
COMMENT ON COLUMN products.target_index IS 'Index in MindAR .mind file (0, 1, 2, etc.)';
COMMENT ON COLUMN products.status IS 'Product visibility: draft, published, or archived';

-- ============================================================================
-- TABLE: product_targets
-- Image target configuration (.mind files)
-- ============================================================================

CREATE TABLE product_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,

  -- Target files
  mind_file_path TEXT NOT NULL,
  mind_file_url TEXT NOT NULL,
  preview_image_path TEXT,
  preview_image_url TEXT,

  -- Target metadata
  mind_file_size INTEGER,
  mind_file_hash TEXT,
  target_count INTEGER DEFAULT 1,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_product_targets_product_id ON product_targets(product_id);

COMMENT ON TABLE product_targets IS 'Image tracking target files (.mind)';
COMMENT ON COLUMN product_targets.mind_file_url IS 'Public URL from Supabase Storage';
COMMENT ON COLUMN product_targets.mind_file_hash IS 'Hash for cache busting';

-- ============================================================================
-- TABLE: product_models
-- 3D model configurations (supports multi-model)
-- ============================================================================

CREATE TABLE product_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,

  -- Model identity
  model_id TEXT NOT NULL,
  model_order INTEGER DEFAULT 0,

  -- Model file
  glb_file_path TEXT NOT NULL,
  glb_file_url TEXT NOT NULL,
  glb_file_size INTEGER,
  glb_file_hash TEXT,

  -- Positioning
  position_x DECIMAL(10, 4) DEFAULT 0,
  position_y DECIMAL(10, 4) DEFAULT 0,
  position_z DECIMAL(10, 4) DEFAULT 0,

  rotation_x DECIMAL(10, 4) DEFAULT 0,
  rotation_y DECIMAL(10, 4) DEFAULT 0,
  rotation_z DECIMAL(10, 4) DEFAULT 0,

  scale_x DECIMAL(10, 4) DEFAULT 1,
  scale_y DECIMAL(10, 4) DEFAULT 1,
  scale_z DECIMAL(10, 4) DEFAULT 1,

  -- Animation settings
  animation_enabled BOOLEAN DEFAULT false,
  animation_clip TEXT DEFAULT '*',
  animation_loop TEXT DEFAULT 'repeat' CHECK (animation_loop IN ('repeat', 'once', 'pingpong')),

  -- Layer settings (for future multi-model support)
  layer TEXT,
  render_order INTEGER,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_product_models_product_id ON product_models(product_id);
CREATE INDEX idx_product_models_order ON product_models(product_id, model_order);

COMMENT ON TABLE product_models IS '3D GLB models (supports multiple models per product)';
COMMENT ON COLUMN product_models.model_order IS 'Order for multi-model rendering';
COMMENT ON COLUMN product_models.layer IS 'Layer type: background, foreground, ui';

-- ============================================================================
-- TABLE: product_ui_config
-- UI configuration for each product
-- ============================================================================

CREATE TABLE product_ui_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE UNIQUE,

  -- Colors
  color_primary TEXT DEFAULT '#4CC3D9',
  color_secondary TEXT DEFAULT '#667eea',
  color_background TEXT DEFAULT 'rgba(0, 0, 0, 0.85)',
  color_text TEXT DEFAULT '#ffffff',

  -- Content
  title TEXT NOT NULL,
  subtitle TEXT,
  description_text TEXT,
  features JSONB DEFAULT '[]'::jsonb,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_product_ui_config_product_id ON product_ui_config(product_id);

COMMENT ON TABLE product_ui_config IS 'Product-specific UI colors and content';
COMMENT ON COLUMN product_ui_config.features IS 'Array of feature strings';

-- ============================================================================
-- TABLE: product_buttons
-- Interactive buttons for each product
-- ============================================================================

CREATE TABLE product_buttons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,

  -- Button configuration
  button_id TEXT NOT NULL,
  label TEXT NOT NULL,
  icon TEXT,
  link TEXT NOT NULL,
  button_style TEXT DEFAULT 'primary' CHECK (button_style IN ('primary', 'secondary')),
  button_order INTEGER DEFAULT 0,
  position TEXT,

  -- Visibility
  enabled BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT unique_button_id_per_product UNIQUE (product_id, button_id)
);

CREATE INDEX idx_product_buttons_product_id ON product_buttons(product_id);
CREATE INDEX idx_product_buttons_order ON product_buttons(product_id, button_order);

COMMENT ON TABLE product_buttons IS 'Interactive buttons with links';
COMMENT ON COLUMN product_buttons.icon IS 'Emoji or icon identifier';

-- ============================================================================
-- TABLE: product_interactions
-- Interaction configurations (onFound, onLost)
-- ============================================================================

CREATE TABLE product_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE UNIQUE,

  -- onFound settings
  on_found_show_ui BOOLEAN DEFAULT true,
  on_found_play_sound BOOLEAN DEFAULT false,
  on_found_sound_path TEXT,
  on_found_sound_url TEXT,

  -- onLost settings
  on_lost_hide_ui BOOLEAN DEFAULT true,
  on_lost_pause_animation BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_product_interactions_product_id ON product_interactions(product_id);

COMMENT ON TABLE product_interactions IS 'Product behavior on target found/lost';

-- ============================================================================
-- TABLE: global_settings
-- System-wide configuration
-- ============================================================================

CREATE TABLE global_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value JSONB NOT NULL,
  description TEXT,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_global_settings_key ON global_settings(setting_key);

COMMENT ON TABLE global_settings IS 'System-wide configuration settings';

-- Pre-populate with default settings
INSERT INTO global_settings (setting_key, setting_value, description) VALUES
  ('ar_config', '{
    "multipleTargets": true,
    "maxSimultaneousTargets": 3
  }'::jsonb, 'AR system configuration'),

  ('default_colors', '{
    "primary": "#4CC3D9",
    "secondary": "#667eea",
    "background": "rgba(0, 0, 0, 0.85)",
    "text": "#ffffff"
  }'::jsonb, 'Default UI colors'),

  ('loading_screen', '{
    "title": "Loading AR Experience",
    "subtitle": "Please wait...",
    "backgroundColor": "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
  }'::jsonb, 'Loading screen configuration'),

  ('instructions_screen', '{
    "title": "Point Camera at Product",
    "subtitle": "Align your camera with the product to see the AR experience",
    "backgroundColor": "rgba(0, 0, 0, 0.75)"
  }'::jsonb, 'Instructions screen configuration');

-- ============================================================================
-- TABLE: analytics_events
-- Track AR usage for insights
-- ============================================================================

CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Event details
  event_type TEXT NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  button_id UUID REFERENCES product_buttons(id) ON DELETE SET NULL,

  -- Session info
  session_id UUID,
  user_agent TEXT,

  -- Metadata
  event_data JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for analytics queries
CREATE INDEX idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_events_product ON analytics_events(product_id);
CREATE INDEX idx_analytics_events_created ON analytics_events(created_at DESC);
CREATE INDEX idx_analytics_events_session ON analytics_events(session_id);
CREATE INDEX idx_analytics_events_type_created ON analytics_events(event_type, created_at DESC);

COMMENT ON TABLE analytics_events IS 'AR usage analytics and tracking';
COMMENT ON COLUMN analytics_events.event_type IS 'session_start, product_found, product_lost, button_click';

-- ============================================================================
-- TABLE: product_versions
-- Version history for products
-- ============================================================================

CREATE TABLE product_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  snapshot JSONB NOT NULL,
  change_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_product_versions_product_id ON product_versions(product_id);
CREATE INDEX idx_product_versions_created ON product_versions(created_at DESC);

COMMENT ON TABLE product_versions IS 'Product version history for rollback';
COMMENT ON COLUMN product_versions.snapshot IS 'Complete product data snapshot';

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Function: Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_targets_updated_at
  BEFORE UPDATE ON product_targets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_models_updated_at
  BEFORE UPDATE ON product_models
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_ui_config_updated_at
  BEFORE UPDATE ON product_ui_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_buttons_updated_at
  BEFORE UPDATE ON product_buttons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_interactions_updated_at
  BEFORE UPDATE ON product_interactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_global_settings_updated_at
  BEFORE UPDATE ON global_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function: Save product version on update
CREATE OR REPLACE FUNCTION save_product_version()
RETURNS TRIGGER AS $$
BEGIN
  IF (OLD.* IS DISTINCT FROM NEW.*) THEN
    INSERT INTO product_versions (product_id, version_number, snapshot, created_by)
    VALUES (
      OLD.id,
      NEW.version,
      row_to_json(OLD)::jsonb,
      auth.uid()
    );
    NEW.version = OLD.version + 1;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER save_version_on_update
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION save_product_version();

-- ============================================================================
-- VIEWS
-- ============================================================================

-- View: Complete product with all relations
CREATE OR REPLACE VIEW products_complete AS
SELECT
  p.id,
  p.product_id,
  p.name,
  p.description,
  p.target_index,
  p.status,
  p.published_at,
  p.version,

  -- Target data
  jsonb_build_object(
    'imagePath', pt.mind_file_url,
    'imagePreview', pt.preview_image_url,
    'fileSize', pt.mind_file_size,
    'hash', pt.mind_file_hash
  ) as target,

  -- Models array (supports multi-model)
  COALESCE(
    (SELECT jsonb_agg(
      jsonb_build_object(
        'id', pm.model_id,
        'path', pm.glb_file_url,
        'position', jsonb_build_object('x', pm.position_x, 'y', pm.position_y, 'z', pm.position_z),
        'rotation', jsonb_build_object('x', pm.rotation_x, 'y', pm.rotation_y, 'z', pm.rotation_z),
        'scale', jsonb_build_object('x', pm.scale_x, 'y', pm.scale_y, 'z', pm.scale_z),
        'animation', jsonb_build_object(
          'enabled', pm.animation_enabled,
          'clip', pm.animation_clip,
          'loop', pm.animation_loop
        ),
        'layer', pm.layer,
        'renderOrder', pm.render_order
      ) ORDER BY pm.model_order
    )
    FROM product_models pm
    WHERE pm.product_id = p.id
    ), '[]'::jsonb
  ) as models,

  -- UI config
  jsonb_build_object(
    'colors', jsonb_build_object(
      'primary', ui.color_primary,
      'secondary', ui.color_secondary,
      'background', ui.color_background,
      'text', ui.color_text
    ),
    'content', jsonb_build_object(
      'title', ui.title,
      'subtitle', ui.subtitle,
      'description', ui.description_text,
      'features', ui.features
    ),
    'buttons', COALESCE(
      (SELECT jsonb_agg(
        jsonb_build_object(
          'id', pb.button_id,
          'label', pb.label,
          'icon', pb.icon,
          'link', pb.link,
          'style', pb.button_style,
          'position', pb.position
        ) ORDER BY pb.button_order
      )
      FROM product_buttons pb
      WHERE pb.product_id = p.id AND pb.enabled = true
      ), '[]'::jsonb
    )
  ) as ui,

  -- Interactions
  jsonb_build_object(
    'onFound', jsonb_build_object(
      'showUI', pi.on_found_show_ui,
      'playSound', pi.on_found_play_sound,
      'soundPath', pi.on_found_sound_url
    ),
    'onLost', jsonb_build_object(
      'hideUI', pi.on_lost_hide_ui,
      'pauseAnimation', pi.on_lost_pause_animation
    )
  ) as interactions

FROM products p
LEFT JOIN product_targets pt ON pt.product_id = p.id
LEFT JOIN product_ui_config ui ON ui.product_id = p.id
LEFT JOIN product_interactions pi ON pi.product_id = p.id
WHERE p.status = 'published';

COMMENT ON VIEW products_complete IS 'Complete product data matching products.json structure';

-- ============================================================================
-- MATERIALIZED VIEW (for better performance)
-- ============================================================================

CREATE MATERIALIZED VIEW products_complete_mv AS
SELECT * FROM products_complete;

CREATE UNIQUE INDEX idx_products_complete_mv_id ON products_complete_mv(id);
CREATE INDEX idx_products_complete_mv_product_id ON products_complete_mv(product_id);

COMMENT ON MATERIALIZED VIEW products_complete_mv IS 'Cached version of products_complete for better performance';

-- Function: Refresh materialized view
CREATE OR REPLACE FUNCTION refresh_products_complete()
RETURNS TRIGGER AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY products_complete_mv;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Refresh on product changes
CREATE TRIGGER refresh_products_view
  AFTER INSERT OR UPDATE OR DELETE ON products
  FOR EACH STATEMENT
  EXECUTE FUNCTION refresh_products_complete();

-- ============================================================================
-- STORAGE BUCKETS (Run in Supabase Dashboard or via API)
-- ============================================================================

/*
-- Create storage buckets (run via Supabase Dashboard or API)

INSERT INTO storage.buckets (id, name, public) VALUES
  ('product-models', 'product-models', true),
  ('target-files', 'target-files', true),
  ('product-images', 'product-images', true),
  ('product-sounds', 'product-sounds', true);

-- Storage policies (see SUPABASE_RLS_POLICIES.sql)
*/

-- ============================================================================
-- UTILITY FUNCTIONS
-- ============================================================================

-- Function: Get product count by status
CREATE OR REPLACE FUNCTION get_product_count_by_status()
RETURNS TABLE(status TEXT, count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT p.status, COUNT(*)
  FROM products p
  GROUP BY p.status;
END;
$$ LANGUAGE plpgsql;

-- Function: Get popular products
CREATE OR REPLACE FUNCTION get_popular_products(days INTEGER DEFAULT 7)
RETURNS TABLE(
  product_id TEXT,
  product_name TEXT,
  scan_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.product_id,
    p.name,
    COUNT(*) as scan_count
  FROM analytics_events ae
  JOIN products p ON p.id = ae.product_id
  WHERE ae.event_type = 'product_found'
    AND ae.created_at > now() - (days || ' days')::interval
  GROUP BY p.product_id, p.name
  ORDER BY scan_count DESC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SCHEMA COMPLETE
-- ============================================================================
-- Next steps:
-- 1. Run SUPABASE_RLS_POLICIES.sql to set up security
-- 2. Create storage buckets in Supabase Dashboard
-- 3. Run migration scripts to populate data
-- ============================================================================
