# Recompile .mind Files for arm64 (Apple Silicon)

## Problem
RangeError during .mind file parsing suggests binary format mismatch.
Your Mac is arm64 (Apple Silicon) but .mind files may have been compiled on x86/x64.

## Solution: Recompile .mind Files

### Step 1: Backup Current Files
```bash
mkdir -p assets/targets/backup
cp assets/targets/*.mind assets/targets/backup/
```

### Step 2: Delete Old .mind Files
```bash
rm assets/targets/*.mind
```

### Step 3: Recompile Using Online Tool

**IMPORTANT: Use your current arm64 Mac's browser**

1. Open https://hiukim.github.io/mind-ar-js-doc/tools/compile
2. Upload your product images (the original JPG/PNG images you used)
3. Download the new .mind files
4. Save to `assets/targets/`

### Step 4: Verify Binary Format

After recompiling, check the file:
```bash
xxd assets/targets/zynSpearmint.mind | head -5
```

Should see MessagePack header: `82a1 7602 a864 6174 614c 6973 74`

### Step 5: Test

Refresh browser with hard reload:
- Chrome/Safari: Cmd+Shift+R
- Clear cache if needed

## Why This Should Work

- .mind files contain binary data with architecture-specific byte ordering
- Recompiling on arm64 ensures correct binary format
- MindAR expects consistent architecture between compilation and runtime

## If Error Persists

If RangeError continues after recompiling:
1. Try different source images (higher resolution)
2. Use MindAR compiler with different settings
3. Check MindAR GitHub issues for known bugs
