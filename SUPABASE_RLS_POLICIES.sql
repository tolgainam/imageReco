-- ============================================================================
-- SUPABASE ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
-- This file contains all Row Level Security policies for the AR Experience
-- Run this AFTER creating tables with SUPABASE_SCHEMA.sql
--
-- Security Model:
-- - Public users: Can read published products and analytics (insert only)
-- - Authenticated users: Same as public (extend as needed)
-- - Service role: Full access (for admin panel and migrations)
--
-- Setup Instructions:
-- 1. Create tables using SUPABASE_SCHEMA.sql first
-- 2. Run this file in Supabase SQL Editor
-- 3. Verify policies in Authentication > Policies
-- 4. Test with anon key (should only see published products)
-- ============================================================================

-- ============================================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================================

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_ui_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_buttons ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE global_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_versions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PRODUCTS TABLE POLICIES
-- ============================================================================

-- Public: Read published products only
CREATE POLICY "Public users can view published products"
  ON products FOR SELECT
  USING (status = 'published');

-- Authenticated: Read all products (for future admin users)
CREATE POLICY "Authenticated users can view all products"
  ON products FOR SELECT
  TO authenticated
  USING (true);

-- Service role: Full access (managed automatically by Supabase)
-- No explicit policy needed - service_role bypasses RLS

-- ============================================================================
-- PRODUCT_TARGETS TABLE POLICIES
-- ============================================================================

-- Public: Read targets for published products only
CREATE POLICY "Public users can view targets for published products"
  ON product_targets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = product_targets.product_id
      AND products.status = 'published'
    )
  );

-- Authenticated: Read all targets
CREATE POLICY "Authenticated users can view all targets"
  ON product_targets FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================================
-- PRODUCT_MODELS TABLE POLICIES
-- ============================================================================

-- Public: Read models for published products only
CREATE POLICY "Public users can view models for published products"
  ON product_models FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = product_models.product_id
      AND products.status = 'published'
    )
  );

-- Authenticated: Read all models
CREATE POLICY "Authenticated users can view all models"
  ON product_models FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================================
-- PRODUCT_UI_CONFIG TABLE POLICIES
-- ============================================================================

-- Public: Read UI config for published products only
CREATE POLICY "Public users can view UI config for published products"
  ON product_ui_config FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = product_ui_config.product_id
      AND products.status = 'published'
    )
  );

-- Authenticated: Read all UI configs
CREATE POLICY "Authenticated users can view all UI configs"
  ON product_ui_config FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================================
-- PRODUCT_BUTTONS TABLE POLICIES
-- ============================================================================

-- Public: Read buttons for published products only
CREATE POLICY "Public users can view buttons for published products"
  ON product_buttons FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = product_buttons.product_id
      AND products.status = 'published'
    )
  );

-- Authenticated: Read all buttons
CREATE POLICY "Authenticated users can view all buttons"
  ON product_buttons FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================================
-- PRODUCT_INTERACTIONS TABLE POLICIES
-- ============================================================================

-- Public: Read interactions for published products only
CREATE POLICY "Public users can view interactions for published products"
  ON product_interactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = product_interactions.product_id
      AND products.status = 'published'
    )
  );

-- Authenticated: Read all interactions
CREATE POLICY "Authenticated users can view all interactions"
  ON product_interactions FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================================
-- GLOBAL_SETTINGS TABLE POLICIES
-- ============================================================================

-- Public: Read global settings (needed for AR experience to work)
CREATE POLICY "Public users can view global settings"
  ON global_settings FOR SELECT
  USING (true);

-- Authenticated: Read global settings
CREATE POLICY "Authenticated users can view global settings"
  ON global_settings FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================================
-- ANALYTICS_EVENTS TABLE POLICIES
-- ============================================================================

-- Public: Insert analytics events ONLY (no read access)
CREATE POLICY "Public users can insert analytics events"
  ON analytics_events FOR INSERT
  WITH CHECK (true);

-- Authenticated: Insert analytics events
CREATE POLICY "Authenticated users can insert analytics events"
  ON analytics_events FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Authenticated: Read their own analytics (optional)
CREATE POLICY "Authenticated users can view all analytics"
  ON analytics_events FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================================
-- PRODUCT_VERSIONS TABLE POLICIES
-- ============================================================================

-- Public: No access to versions
-- (Versions are for admin audit trail only)

-- Authenticated: Read product versions
CREATE POLICY "Authenticated users can view product versions"
  ON product_versions FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================================
-- STORAGE BUCKET POLICIES
-- ============================================================================
-- These are created separately in Supabase Dashboard > Storage > Policies
-- or via JavaScript using the Supabase client
--
-- Required Buckets:
-- 1. ar-targets (public)
-- 2. ar-models (public)
-- 3. ar-images (public)
-- 4. ar-sounds (public)
--
-- Run the following SQL to create storage buckets:
-- ============================================================================

-- Create storage buckets (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('ar-targets', 'ar-targets', true),
  ('ar-models', 'ar-models', true),
  ('ar-images', 'ar-images', true),
  ('ar-sounds', 'ar-sounds', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- STORAGE POLICIES FOR ar-targets BUCKET
-- ============================================================================

-- Public: Read all target files
CREATE POLICY "Public users can view target files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'ar-targets');

-- Authenticated: Upload target files
CREATE POLICY "Authenticated users can upload target files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'ar-targets');

-- Authenticated: Update target files
CREATE POLICY "Authenticated users can update target files"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'ar-targets');

-- Authenticated: Delete target files
CREATE POLICY "Authenticated users can delete target files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'ar-targets');

-- ============================================================================
-- STORAGE POLICIES FOR ar-models BUCKET
-- ============================================================================

-- Public: Read all model files
CREATE POLICY "Public users can view model files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'ar-models');

-- Authenticated: Upload model files
CREATE POLICY "Authenticated users can upload model files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'ar-models');

-- Authenticated: Update model files
CREATE POLICY "Authenticated users can update model files"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'ar-models');

-- Authenticated: Delete model files
CREATE POLICY "Authenticated users can delete model files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'ar-models');

-- ============================================================================
-- STORAGE POLICIES FOR ar-images BUCKET
-- ============================================================================

-- Public: Read all image files
CREATE POLICY "Public users can view image files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'ar-images');

-- Authenticated: Upload image files
CREATE POLICY "Authenticated users can upload image files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'ar-images');

-- Authenticated: Update image files
CREATE POLICY "Authenticated users can update image files"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'ar-images');

-- Authenticated: Delete image files
CREATE POLICY "Authenticated users can delete image files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'ar-images');

-- ============================================================================
-- STORAGE POLICIES FOR ar-sounds BUCKET
-- ============================================================================

-- Public: Read all sound files
CREATE POLICY "Public users can view sound files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'ar-sounds');

-- Authenticated: Upload sound files
CREATE POLICY "Authenticated users can upload sound files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'ar-sounds');

-- Authenticated: Update sound files
CREATE POLICY "Authenticated users can update sound files"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'ar-sounds');

-- Authenticated: Delete sound files
CREATE POLICY "Authenticated users can delete sound files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'ar-sounds');

-- ============================================================================
-- TESTING QUERIES
-- ============================================================================
-- Test these queries as different user types to verify policies work
-- ============================================================================

-- Test 1: Verify anon users can only see published products
-- SET ROLE anon;
-- SELECT * FROM products; -- Should only show status='published'

-- Test 2: Verify anon users can read complete product view
-- SET ROLE anon;
-- SELECT * FROM products_complete; -- Should work

-- Test 3: Verify anon users can insert analytics
-- SET ROLE anon;
-- INSERT INTO analytics_events (event_type, product_id, session_id)
-- VALUES ('product_found', 'product-1', 'test-session-123');
-- -- Should work

-- Test 4: Verify anon users cannot read analytics
-- SET ROLE anon;
-- SELECT * FROM analytics_events; -- Should fail

-- Test 5: Verify authenticated users can see all products
-- (Requires actual authenticated session via Supabase client)

-- Test 6: Verify storage bucket access
-- (Test via Supabase Storage UI or client SDK)

-- ============================================================================
-- ADMIN SETUP (OPTIONAL)
-- ============================================================================
-- If you want to add admin users with special permissions:
-- ============================================================================

-- Option 1: Use auth.users metadata
-- Add this to user metadata in Supabase Dashboard:
-- { "role": "admin" }

-- Then create policies like:
-- CREATE POLICY "Admins can update products"
--   ON products FOR UPDATE
--   TO authenticated
--   USING (
--     (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
--   );

-- Option 2: Create admin_users table (recommended for production)
-- CREATE TABLE admin_users (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
--   role TEXT NOT NULL CHECK (role IN ('admin', 'editor', 'viewer')),
--   created_at TIMESTAMPTZ DEFAULT NOW(),
--   UNIQUE(user_id)
-- );

-- Then create policies that check this table:
-- CREATE POLICY "Admins can update products"
--   ON products FOR UPDATE
--   TO authenticated
--   USING (
--     EXISTS (
--       SELECT 1 FROM admin_users
--       WHERE admin_users.user_id = auth.uid()
--       AND admin_users.role IN ('admin', 'editor')
--     )
--   );

-- ============================================================================
-- PERFORMANCE INDEXES FOR RLS
-- ============================================================================
-- These indexes speed up RLS policy checks
-- ============================================================================

-- Index for checking product status in foreign key lookups
CREATE INDEX IF NOT EXISTS idx_products_status_published
  ON products(status) WHERE status = 'published';

-- Index for product_id lookups in child tables
CREATE INDEX IF NOT EXISTS idx_product_targets_product_id
  ON product_targets(product_id);

CREATE INDEX IF NOT EXISTS idx_product_models_product_id
  ON product_models(product_id);

CREATE INDEX IF NOT EXISTS idx_product_ui_config_product_id
  ON product_ui_config(product_id);

CREATE INDEX IF NOT EXISTS idx_product_interactions_product_id
  ON product_interactions(product_id);

-- Index for button lookups via product
CREATE INDEX IF NOT EXISTS idx_product_buttons_product_id
  ON product_buttons(product_id);

-- ============================================================================
-- REFRESH MATERIALIZED VIEW PERMISSIONS
-- ============================================================================
-- Allow the system to refresh materialized views automatically
-- ============================================================================

-- Grant refresh permissions (if using materialized view from schema)
-- This is typically handled by service role, but you can create a scheduled function

-- Example: Refresh every hour
-- (Requires pg_cron extension - available on Supabase Pro and above)

-- SELECT cron.schedule(
--   'refresh-products-view',
--   '0 * * * *', -- Every hour
--   $$
--   REFRESH MATERIALIZED VIEW CONCURRENTLY products_complete_mv;
--   $$
-- );

-- ============================================================================
-- VERIFICATION CHECKLIST
-- ============================================================================
--
-- Before deploying to production:
-- [ ] All tables have RLS enabled
-- [ ] Public users can only read published products
-- [ ] Public users can insert (but not read) analytics
-- [ ] Storage buckets are public for read
-- [ ] Storage buckets require auth for write/update/delete
-- [ ] Indexes are created for performance
-- [ ] Materialized view refresh is scheduled (if using)
-- [ ] Test with anon key in browser (should only see published data)
-- [ ] Test with service key (should see all data)
--
-- ============================================================================

-- ============================================================================
-- NOTES
-- ============================================================================
--
-- 1. Service Role Key bypasses all RLS policies
--    - Never expose service_role key in client-side code
--    - Only use service_role for admin panel backend or migrations
--
-- 2. Anon Key respects RLS policies
--    - Safe to expose in client-side code (index.html)
--    - Users can only access what policies allow
--
-- 3. Storage Policies
--    - Public buckets allow read without auth
--    - Upload/update/delete requires authentication
--    - Fine-grained policies can check file ownership if needed
--
-- 4. Analytics Privacy
--    - Public users can write analytics but not read
--    - Prevents users from seeing others' analytics
--    - Admin/authenticated users can read all analytics
--
-- 5. Performance
--    - RLS policies run on every query
--    - Use indexes to speed up policy checks
--    - Consider materialized views for complex joins
--
-- ============================================================================
