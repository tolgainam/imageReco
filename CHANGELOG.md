# Changelog

## [1.1.1] - 2025-11-09 - Documentation Updates

### Fixed

#### QUICK_START.md
- **Removed outdated HTML editing instructions**
  - Old Step 2: "Update HTML" (edit index.html)
  - New Step 2: "Update products.json" (JSON configuration)

- **Removed manual model loading instructions**
  - Old Step 5: Edit HTML to add assets and models
  - New Step 5: Configure models in products.json

- **Added validation reminders**
  - Check browser console for configuration messages
  - Verify no validation errors before testing

- **Enhanced testing checklist**
  - Added console validation checks
  - Added UI and button testing items
  - Removed HTML editing requirement

- **Added Important Notes section**
  - Explained JSON configuration system
  - Clarified automatic HTML configuration
  - Added multiple products guidance
  - Included .mind file creation reference

### Added

#### FUTURE_ENHANCEMENTS.md
- Documented multi-model layering system (planned feature)
- Complete implementation plan with code examples
- Z-ordering guidelines for background/foreground layers
- Migration path from single to multiple models
- 3 practical use case examples
- Performance considerations and testing checklist

---

## [1.1.0] - 2025-11-09 - Target Management Improvements

### Added

#### New Documentation
- **TARGET_MANAGEMENT_GUIDE.md** - Comprehensive guide for creating and managing `.mind` files
  - Combined vs individual .mind file strategies
  - Step-by-step MindAR compiler instructions
  - Image quality guidelines
  - Troubleshooting common issues
  - Best practices for single-product-at-a-time scanning

#### Enhanced Features
- **Automatic target validation** in `config-loader.js`
  - Detects mismatched .mind files
  - Warns when multiple different paths are used
  - Provides helpful error messages with solutions
  - Logs clear configuration info to console

- **Better console logging**
  - ✅ Success indicators
  - ⚠️ Warning messages
  - ❌ Error descriptions
  - 📦 Configuration summary
  - 🎯 Target file information

### Changed

#### index.html
- **Removed hardcoded imageTargetSrc path**
  - Was: `imageTargetSrc: ./assets/targets/zynSpearmint.mind`
  - Now: `imageTargetSrc: ;` (empty, auto-configured)
  - Added comment explaining automatic configuration

#### config-loader.js
- **Enhanced `loadConfig()` method**
  - Added validation call
  - Better error messages
  - Improved console output with emojis

- **New `validateTargets()` method**
  - Checks for target path consistency
  - Warns about multiple .mind files
  - Suggests combined .mind solution
  - Shows which products use which files

- **Improved `updateSceneConfig()` method**
  - Better logic for detecting target source
  - Handles edge cases
  - Detailed logging of configuration
  - Lists all products with their indices

#### products.json
- **Added helpful comments**
  - Usage instructions at top
  - Workflow summary
  - Notes on combined vs separate .mind files
  - Per-product examples

- **Updated example paths**
  - Changed from separate files to combined approach
  - Both examples now use `./assets/targets/products.mind`
  - Clear indication of targetIndex usage

#### PRODUCTS_CONFIG_GUIDE.md
- **Added "Use Case" section**
  - Clarified single-product-at-a-time scanning
  - Explained typical workflow
  - Referenced TARGET_MANAGEMENT_GUIDE.md

- **Enhanced "Workflow" section**
  - Differentiated between single product and catalog
  - Added visual workflow diagram
  - Separate instructions for combined vs individual files

#### README.md
- **Updated documentation structure**
  - Added TARGET_MANAGEMENT_GUIDE.md to file tree
  - Reorganized documentation list by importance

- **Improved "For Developers" section**
  - Clearer 3-step process
  - Direct links to relevant guides
  - Emphasized automatic configuration

### Fixed

#### Target Configuration Issues
- **Problem**: Confusing whether to edit index.html or products.json for targets
- **Solution**: Only products.json needs editing; index.html auto-configured

- **Problem**: Unclear error messages when using multiple .mind files
- **Solution**: Detailed validation with actionable suggestions

- **Problem**: No feedback about which target file is being used
- **Solution**: Console logs show exact configuration

### Developer Experience Improvements

#### Clearer Workflow
```
Before: ❓ Edit index.html? Or products.json? Both?
After:  ✅ Only edit products.json - system handles the rest
```

#### Better Errors
```
Before: Silent failure or cryptic errors
After:  Clear messages with solutions and links
```

#### Validation
```
Before: No validation until runtime errors
After:  Immediate validation with helpful suggestions
```

### Console Output Examples

#### Success (Single Product)
```
✅ Configuration loaded successfully
📦 Products found: 1
🎯 Target validation:
   Total products: 1
   Unique .mind files: 1
   ✅ All products use: ./assets/targets/product-1.mind
🎯 Setting image target source: ./assets/targets/product-1.mind
📱 MindAR configuration:
   Target file: ./assets/targets/product-1.mind
   Products configured: 1
   1. My Product (targetIndex: 0)
```

#### Success (Multiple Products, Combined File)
```
✅ Configuration loaded successfully
📦 Products found: 3
🎯 Target validation:
   Total products: 3
   Unique .mind files: 1
   ✅ All products use: ./assets/targets/products.mind
   ℹ️ Multiple products will be tracked from single .mind file
🎯 Setting image target source: ./assets/targets/products.mind
📱 MindAR configuration:
   Target file: ./assets/targets/products.mind
   Products configured: 3
   1. Product A (targetIndex: 0)
   2. Product B (targetIndex: 1)
   3. Product C (targetIndex: 2)
```

#### Error (Mismatched Files)
```
✅ Configuration loaded successfully
📦 Products found: 2
🎯 Target validation:
   Total products: 2
   Unique .mind files: 2
   ❌ Multiple different .mind files detected:
      1. ./assets/targets/product-1.mind (used by 1 product(s))
      2. ./assets/targets/product-2.mind (used by 1 product(s))
   ⚠️ MindAR can only load ONE .mind file at a time!
   💡 Solution: Compile all product images into one combined .mind file
   🔗 Use: https://hiukim.github.io/mind-ar-js-doc/tools/compile
```

### Migration Guide

#### For Existing Users

If you have an existing `products.json` with separate .mind files:

**Option 1: Create Combined File (Recommended)**
1. Collect all product images
2. Upload to MindAR compiler together
3. Download `products.mind`
4. Update all products to use same path:
```json
{
  "products": [
    {"id": "p1", "targetIndex": 0, "target": {"imagePath": "./assets/targets/products.mind"}},
    {"id": "p2", "targetIndex": 1, "target": {"imagePath": "./assets/targets/products.mind"}}
  ]
}
```

**Option 2: Keep Individual Files**
- Keep one product active at a time
- System will use first product's .mind file
- You'll see a warning in console

### Technical Details

#### File Changes
- `index.html` - 1 line changed (removed hardcoded path)
- `js/config-loader.js` - 3 methods enhanced, 1 method added (~60 lines)
- `products.json` - Comments added, paths updated
- `PRODUCTS_CONFIG_GUIDE.md` - 2 sections updated
- `README.md` - 2 sections updated
- `TARGET_MANAGEMENT_GUIDE.md` - New file (~400 lines)

#### Backward Compatibility
- ✅ Existing configurations still work
- ✅ Console warnings for deprecated patterns
- ✅ No breaking changes
- ⚠️ Hardcoded paths in index.html now ignored

### Known Issues

None - all changes are additive and backward compatible.

### Recommendations

1. **Use combined .mind files** for multiple products
2. **Check browser console** on first load to verify configuration
3. **Read TARGET_MANAGEMENT_GUIDE.md** before creating targets
4. **Test on actual devices** with printed targets

---

## [1.0.0] - 2025-11-09 - Initial Release

### Added
- JSON-based product configuration system
- Dynamic AR scene generation
- Product-specific UI with custom colors
- Interactive buttons with links
- MindAR + A-Frame integration
- Complete documentation suite
- Example configurations

---

**Last Updated**: 2025-11-09
