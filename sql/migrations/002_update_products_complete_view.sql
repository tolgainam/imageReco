-- ============================================================================
-- Migration: Update products_complete VIEW with Edge Glow Support
-- ============================================================================
-- Version: 002
-- Created: 2025-11-11
-- Description: Updates the products_complete view and materialized view to
--              include edgeGlow configuration in the UI JSON structure
-- ============================================================================

-- Drop and recreate the products_complete VIEW with edgeGlow support
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

  -- UI config (WITH EDGE GLOW)
  jsonb_build_object(
    'colors', jsonb_build_object(
      'primary', ui.color_primary,
      'secondary', ui.color_secondary,
      'background', ui.color_background,
      'text', ui.color_text
    ),
    'edgeGlow', jsonb_build_object(
      'enabled', COALESCE(ui.edge_glow_enabled, false),
      'glowIntensity', COALESCE(ui.edge_glow_intensity, 100),
      'glowOpacity', COALESCE(ui.edge_glow_opacity, 0.30)
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

COMMENT ON VIEW products_complete IS 'Complete product data matching products.json structure (with edgeGlow)';

-- ============================================================================
-- REFRESH MATERIALIZED VIEW
-- ============================================================================
-- This ensures the cached version includes edgeGlow data
REFRESH MATERIALIZED VIEW CONCURRENTLY products_complete_mv;

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- Run this query to verify edgeGlow is in the view:
--
-- SELECT product_id, ui->'edgeGlow' as edge_glow
-- FROM products_complete
-- LIMIT 5;
-- ============================================================================
