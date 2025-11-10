#!/usr/bin/env node

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function main() {
  console.log('🔍 Checking database structure...\n');

  // Get products with all related data
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      product_targets (*),
      product_models (*),
      product_ui_config (*),
      product_buttons (*)
    `)
    .eq('status', 'published')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  console.log('📦 Products in database:');
  console.log(JSON.stringify(data, null, 2));

  console.log('\n🎯 Target paths:');
  data.forEach(p => {
    console.log(`  ${p.name}:`);
    console.log(`    mind_file_path: ${p.product_targets[0]?.mind_file_path}`);
    console.log(`    mind_file_url: ${p.product_targets[0]?.mind_file_url}`);
  });
}

main().catch(console.error);
