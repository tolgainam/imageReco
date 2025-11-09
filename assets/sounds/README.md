# Audio Files

This folder contains sound effects for AR interactions.

## Supported Formats

- **MP3** (recommended): Best browser compatibility
- **WAV**: Larger files, lossless quality
- **OGG**: Good compression, some browser limitations

## Usage

Add sound effects in `products.json`:

```json
{
  "interactions": {
    "onFound": {
      "playSound": true,
      "soundPath": "./assets/sounds/found.mp3"
    }
  }
}
```

## Sound Tips

### File Size
- Keep files < 100KB
- Short sounds (0.5-2 seconds) work best
- Compress using Audacity or online tools

### Volume
- Normalize audio levels
- Don't make sounds too loud
- Test on actual devices

### Types of Sounds

**Target Found:**
- Positive beep
- Chime
- Success tone

**Target Lost:**
- Soft fade
- Neutral tone

## Free Sound Resources

- **Freesound.org**: https://freesound.org/
- **Zapsplat**: https://www.zapsplat.com/
- **Mixkit**: https://mixkit.co/free-sound-effects/

## Important Notes

- **Mobile Safari**: May require user interaction before playing sound
- **Autoplay**: Some browsers block autoplay with sound
- **Testing**: Always test audio on actual mobile devices
- **Optional**: Sounds are optional, set `playSound: false` to disable
