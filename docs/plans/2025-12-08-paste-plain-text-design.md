# Paste Plain Text Design

## Problem

When pasting content from apps with rich formatting (styled text, different fonts, etc.), the contenteditable area retains the source app's styling. This causes two issues:

1. Unwanted visual styling appears in the note
2. Text resizing breaks for the pasted content and any text typed after it

The styling persists because contenteditable naturally accepts HTML from the clipboard, including inline styles like `<span style="font-size: 14px">` that override the div-level font-size setting.

## Current Workaround

Users must either:
- Live with broken text resizing
- Clear the entire note and manually retype content

## Solution

Intercept paste events and insert only plain text, preventing any HTML/styling from entering the DOM.

### Implementation

**1. Add paste event handler to contenteditable div (index.html:34)**

```html
<div
    x-ref="noteArea"
    contenteditable="true"
    @input="handleInput($event)"
    @blur="saveNote()"
    @paste="handlePaste($event)"
    ...
>
```

**2. Add handlePaste method to noteApp() (app.js)**

```javascript
handlePaste(event) {
    // Prevent default paste behavior (which would insert HTML)
    event.preventDefault();

    // Get plain text from clipboard
    const text = event.clipboardData.getData('text/plain');

    // Insert plain text at cursor position
    // execCommand maintains undo/redo and triggers proper events
    document.execCommand('insertText', false, text);

    // Note: No need to manually call saveNote() here because
    // execCommand('insertText') triggers the @input event,
    // which calls handleInput(), and saveNote() is called on @blur
}
```

**3. Bump service worker cache version (sw.js:2)**

Change `CACHE_NAME` from `'notebin-v4'` to `'notebin-v5'` to ensure PWA users receive the update.

### Why This Works

- **Clipboard API provides multiple formats**: When you copy text, the clipboard stores both HTML (with formatting) and plain text versions
- **We explicitly request plain text**: `getData('text/plain')` ignores the HTML version
- **execCommand('insertText') is reliable**: While deprecated for most use cases, it's still the best cross-browser way to insert text at cursor position while maintaining undo/redo
- **No performance impact**: Reading from clipboard and inserting text happens in milliseconds

### Benefits

- Styled content can never break text sizing again
- Clean, predictable paste behavior
- Works immediately without requiring app reload
- Maintains proper undo/redo functionality
- Simple implementation with minimal code

### PWA Update Deployment

To deploy this fix to iOS PWA users:

1. Push updated code to hosted website
2. Service worker cache version must be bumped (v4 → v5)
3. Users force-quit and reopen PWA to trigger service worker update
4. New code loads on next launch

**Important**: Always increment `CACHE_NAME` in sw.js when deploying code changes, otherwise PWA users will continue using cached old versions.
