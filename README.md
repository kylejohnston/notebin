# notebin

A fast, minimal, single-note web app for iOS Safari. Perfect for quick, transitory notes that don't need organization or syncing.

## Features

- **Single note** - One note at a time, auto-saves as you type
- **Smart keyboard** - Auto-focuses when note is empty, waits for tap when content exists
- **LocalStorage** - All data stored locally in IndexedDB (iOS Safari compatible)
- **Text sizing** - Adjustable text size (16px - 32px)
- **Light/dark mode** - Follows system preference with manual override
- **PWA ready** - Install to iOS home screen for app-like experience
- **Offline-first** - Works without internet connection

## Setup

### Local Development

1. Clone or download this repository
2. Serve the files using any local web server:

**Using Python:**
```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

**Using Node.js (http-server):**
```bash
npx http-server -p 8000
```

**Using PHP:**
```bash
php -S localhost:8000
```

3. Open `http://localhost:8000` in your browser

### iOS Installation

1. Open the app in Safari on iOS
2. Tap the Share button (square with arrow)
3. Scroll down and tap "Add to Home Screen"
4. Tap "Add"
5. Launch from your home screen

## Icon Customization

Replace the placeholder icons with your own:
- `icon-180.png` - 180×180px (Apple touch icon)
- `icon-192.png` - 192×192px (PWA manifest)
- `icon-512.png` - 512×512px (PWA manifest)

All icons should be PNG format.

## File Structure

```
notebin/
├── index.html       # Main HTML structure
├── style.css        # All styles and theming
├── app.js           # Alpine.js app logic
├── manifest.json    # PWA manifest
├── sw.js            # Service worker for offline
├── icon-180.png     # Apple touch icon
├── icon-192.png     # PWA icon (small)
├── icon-512.png     # PWA icon (large)
└── README.md        # This file
```

## Usage

### Taking Notes
- Open the app
- Start typing (keyboard auto-focuses if note is empty)
- Notes save automatically as you type

### Menu Controls
- Tap the icon (top right) to open the menu
- **Text size**: Use - and + buttons to adjust
- **Color mode**: Toggle between system/light/dark modes
- **Clear note**: Tap once, then tap again to confirm deletion
- **Close**: Tap outside the menu

## Technical Details

### Storage
- Uses **IndexedDB** via LocalForage library for reliable storage
- Automatic fallback to localStorage if IndexedDB unavailable
- **Note**: iOS Safari may clear storage after ~7 days of inactivity or if device storage is low

### Frameworks
- **Alpine.js** (3.x) - Lightweight reactive framework
- **LocalForage** (1.10.0) - IndexedDB wrapper with localStorage fallback

### Browser Support
- iOS Safari 13+
- Modern browsers with PWA support

## Customization

### Default Text Size
Edit `DEFAULTS.TEXT_SIZE` in `app.js` (currently 24px)

### Text Size Range
Edit `DEFAULTS.MIN_TEXT_SIZE` and `DEFAULTS.MAX_TEXT_SIZE` in `app.js`

### Line Height
Edit the `line-height` value in the textarea style attribute in `index.html` (currently 1.3)

### Colors
Edit CSS custom properties in `style.css`:
```css
:root {
  --bg-color: #fafafa;
  --text-color: #121212;
  --control-active: #8888ff;
  /* etc. */
}
```

## License

This is a personal, just-for-me project. Use freely, ymmv
