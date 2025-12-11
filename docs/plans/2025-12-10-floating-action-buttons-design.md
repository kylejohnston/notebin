# Floating Action Buttons Design
**Date:** 2025-12-10
**Status:** Approved
**Features:** Paste button, Undo button

## Overview

Add two floating action buttons to notebin: a paste button and an undo button. Both buttons appear temporarily in the lower-right corner of the viewport, above the keyboard, providing quick access to common editing actions without requiring the menu or keyboard shortcuts.

## Visual Design

### Appearance
- **Style:** 44px circular buttons matching existing menu control buttons
- **Position:** Lower-right corner at `bottom: calc(80px + env(safe-area-inset-bottom))` and `right: calc(20px + env(safe-area-inset-right))`
- **Layout:** Side-by-side with 8px gap (matching menu button spacing)
- **Order:** Undo button on left, paste button on right
- **Placeholders:** 'U' for undo, 'P' for paste (will be replaced with SVGs later)

### Button States
- **Active:** Full opacity with same styling as `.control-btn`
- **Hover/Active:** Same interaction states as menu buttons
- **Hiding:** 2-second opacity fade transition
- **Hidden:** `display: none` via Alpine's `x-show`

## Behavior

### Undo Button
**Trigger:** Appears after any text edit in the contenteditable div

**Visibility:**
- Appears immediately when text changes
- Stays visible for 8 seconds after last edit
- Hides with 2-second fade transition
- Resets 8-second timer each time an edit occurs

**Action:**
- Executes `document.execCommand('undo')` when tapped
- After tap: Resets the 8-second timer and stays visible (enables multiple undos)
- Uses browser's native undo stack

**Hide Conditions:**
- 8 seconds of inactivity (no edits)
- Menu opens
- During 2-second fade, pointer-events disabled

### Paste Button
**Trigger:** Appears when user copies or cuts content

**Visibility:**
- Appears immediately on `copy` or `cut` event
- Stays visible for 8 seconds
- Hides with 2-second fade transition
- Timer does not reset (one-shot after clipboard write)

**Action:**
- Reads clipboard using `navigator.clipboard.readText()`
- Inserts text using `document.execCommand('insertText', false, text)`
- After tap: Immediately disappears (no fade, instant hide)
- Matches existing `handlePaste()` behavior (plain text only)

**Hide Conditions:**
- After being tapped
- 8 seconds after appearing
- Menu opens
- During fade, pointer-events disabled

## Technical Implementation

### Alpine.js State
Add to `noteApp()` function:
```javascript
undoButtonVisible: false,
pasteButtonVisible: false,
undoTimeout: null,
pasteTimeout: null
```

### Methods

**showUndoButton():**
- Clear existing `undoTimeout` if present
- Set `undoButtonVisible = true`
- Start new 8-second timeout to hide button

**hideUndoButton():**
- Set `undoButtonVisible = false`
- Clear `undoTimeout`

**showPasteButton():**
- Clear existing `pasteTimeout` if present
- Set `pasteButtonVisible = true`
- Start new 8-second timeout to hide button

**hidePasteButton():**
- Set `pasteButtonVisible = false`
- Clear `pasteTimeout`

**handleUndo():**
- Execute `document.execCommand('undo')`
- Call `showUndoButton()` to reset timer

**handlePasteButton():**
- Read clipboard: `await navigator.clipboard.readText()`
- Insert text: `document.execCommand('insertText', false, text)`
- Call `hidePasteButton()`
- Handle clipboard permission errors gracefully

### Event Listeners
**During init():**
- Add `copy` event listener → `showPasteButton()`
- Add `cut` event listener → `showPasteButton()`

**Existing hooks:**
- `handleInput()` → call `showUndoButton()`
- `toggleMenu()` / `closeMenu()` → hide both buttons immediately

### HTML Structure
```html
<div class="floating-actions"
     x-show="undoButtonVisible || pasteButtonVisible"
     x-transition.opacity.duration.2000ms>
  <button x-show="undoButtonVisible"
          @click="handleUndo()"
          class="action-btn"
          aria-label="Undo">U</button>
  <button x-show="pasteButtonVisible"
          @click="handlePasteButton()"
          class="action-btn"
          aria-label="Paste">P</button>
</div>
```

### CSS Styling
```css
.floating-actions {
  position: fixed;
  bottom: calc(80px + env(safe-area-inset-bottom));
  right: calc(20px + env(safe-area-inset-right));
  display: flex;
  flex-direction: row;
  gap: 8px;
  z-index: 50;
}

.floating-actions[style*="display: none"] {
  pointer-events: none;
}

.action-btn {
  /* Mirror .control-btn styling */
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: var(--control-bg);
  border: none;
  color: var(--control-text);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s;
  -webkit-tap-highlight-color: transparent;
  font-size: 18px;
  font-weight: 600;
}

.action-btn:active {
  background: var(--control-active);
  color: white;
}
```

## Edge Cases & Considerations

### Clipboard API Permissions
- `navigator.clipboard.readText()` requires user permission (granted per-session on iOS Safari)
- If permission denied or API unavailable, fail gracefully - paste button simply won't work
- Users can still use native long-press paste
- `copy` and `cut` events don't require permissions

### Browser Compatibility
- `execCommand('undo')` - supported in iOS Safari 13+
- Clipboard API - supported in iOS Safari 13.4+
- Event listeners for `copy`/`cut` - widely supported
- Falls within existing browser support targets

### Empty Undo Stack
- If undo stack is empty, `execCommand('undo')` fails silently
- Button does nothing but doesn't break
- Button still hides after timeout
- Future enhancement: check `document.queryCommandEnabled('undo')` to conditionally show button

### Security
- Uses `execCommand('insertText')` for paste (same as existing `handlePaste()`)
- Plain text only - no HTML injection or XSS risk
- Maintains existing security posture

### Menu Interaction
- Both buttons hide immediately when menu opens (via `toggleMenu()` / `closeMenu()`)
- Prevents visual clutter and potential overlap
- Buttons reappear normally after menu closes (if triggers occur)

### Focus & Keyboard Behavior
- Buttons positioned in safe zone assuming keyboard is visible
- Fixed positioning (not dynamic keyboard detection) for simplicity
- Can iterate to dynamic positioning if testing reveals issues

## Testing Plan

1. **Undo button:**
   - Type text → verify button appears
   - Wait 8 seconds → verify fade and hide
   - Type, wait 4 seconds, type again → verify timer resets
   - Tap undo → verify text reverts and button stays visible
   - Tap undo multiple times → verify multiple undo steps work

2. **Paste button:**
   - Copy text → verify button appears
   - Tap paste → verify text inserts and button disappears
   - Copy text, wait 8 seconds → verify button fades
   - Copy text, open menu → verify button hides

3. **Both buttons together:**
   - Copy text, then type → verify both buttons visible side-by-side
   - Verify 8px gap and proper alignment

4. **Edge cases:**
   - Tap undo with empty stack → verify no errors
   - Deny clipboard permission → verify graceful fallback
   - Open/close menu → verify buttons hide/reappear correctly

## Future Enhancements

- Replace placeholder letters with custom SVG icons
- Check undo stack state before showing undo button
- Dynamic keyboard detection for more precise positioning
- Haptic feedback on button tap (iOS)
- Animation entrance (slide up vs fade in)
