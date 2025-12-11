# Floating Action Buttons Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add paste and undo floating action buttons that appear temporarily in the lower-right corner of the viewport.

**Architecture:** Two independent buttons with timeout-based visibility. Undo button appears on text edits and uses browser's native undo stack. Paste button appears on copy/cut events and uses Clipboard API. Both styled to match existing menu controls.

**Tech Stack:** Alpine.js 3.x, Vanilla JavaScript, CSS with custom properties

---

## Task 1: Add Alpine.js State Properties

**Files:**
- Modify: `app.js:22-30` (inside `noteApp()` function return object)

**Step 1: Add state properties for button visibility and timeouts**

In `app.js`, add these properties to the object returned by `noteApp()`:

```javascript
function noteApp() {
    return {
        noteContent: '',
        textSize: DEFAULTS.TEXT_SIZE,
        colorModeOverride: null,
        colorMode: 'light',
        menuOpen: false,
        clearConfirmPending: false,
        clearConfirmTimeout: null,

        // Floating action buttons
        undoButtonVisible: false,
        pasteButtonVisible: false,
        undoTimeout: null,
        pasteTimeout: null,
```

**Step 2: Commit**

```bash
git add app.js
git commit -m "feat: add state properties for floating action buttons"
```

---

## Task 2: Add HTML Structure

**Files:**
- Modify: `index.html:113` (after menu-panel closing div, before script tags)

**Step 1: Add floating action buttons HTML**

In `index.html`, add this after the menu panel (line ~113, before the script tags):

```html
    </div>

    <!-- Floating action buttons -->
    <div
        class="floating-actions"
        x-show="undoButtonVisible || pasteButtonVisible"
        x-transition.opacity.duration.2000ms
    >
        <button
            x-show="undoButtonVisible"
            @click="handleUndo()"
            class="action-btn"
            aria-label="Undo"
        >U</button>
        <button
            x-show="pasteButtonVisible"
            @click="handlePasteButton()"
            class="action-btn"
            aria-label="Paste"
        >P</button>
    </div>

    <script src="app.js"></script>
```

**Step 2: Verify HTML structure**

Open `index.html` in browser and check console for errors.
Expected: No errors (buttons won't show yet since visibility is false)

**Step 3: Commit**

```bash
git add index.html
git commit -m "feat: add floating action buttons HTML structure"
```

---

## Task 3: Add CSS Styling

**Files:**
- Modify: `style.css:271` (after .clear-btn styles, before @keyframes)

**Step 1: Add floating actions container styles**

In `style.css`, add these styles after the `.clear-btn` styles (around line 271):

```css
/* Floating action buttons */
.floating-actions {
    position: fixed;
    bottom: calc(80px + env(safe-area-inset-bottom));
    right: calc(20px + env(safe-area-inset-right));
    display: flex;
    flex-direction: row;
    gap: 8px;
    z-index: 50;
}

/* Disable pointer events during fade out */
.floating-actions[style*="display: none"] {
    pointer-events: none;
}

.action-btn {
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

**Step 2: Test styling in browser**

Temporarily set `undoButtonVisible: true` in app.js to see the button.
Expected: Button appears in lower-right corner, styled like menu buttons.
Revert the temporary change.

**Step 3: Commit**

```bash
git add style.css
git commit -m "style: add floating action buttons CSS"
```

---

## Task 4: Implement Undo Button Methods

**Files:**
- Modify: `app.js:280` (after `clearNote()` method, before closing brace)

**Step 1: Add showUndoButton method**

In `app.js`, add this method after the `clearNote()` method:

```javascript
        async clearNote() {
            // ... existing clearNote code ...
        },

        showUndoButton() {
            // Clear existing timeout
            if (this.undoTimeout) {
                clearTimeout(this.undoTimeout);
                this.undoTimeout = null;
            }

            // Show button
            this.undoButtonVisible = true;

            // Set timeout to hide after 8 seconds
            this.undoTimeout = setTimeout(() => {
                this.undoButtonVisible = false;
                this.undoTimeout = null;
            }, 8000);
        },

        hideUndoButton() {
            this.undoButtonVisible = false;
            if (this.undoTimeout) {
                clearTimeout(this.undoTimeout);
                this.undoTimeout = null;
            }
        },

        handleUndo() {
            // Execute native undo
            document.execCommand('undo');

            // Reset timer to keep button visible
            this.showUndoButton();
        },
```

**Step 2: Test undo button manually**

In browser console, call `Alpine.$data(document.body).showUndoButton()`.
Expected: Undo button appears, fades out after 8 seconds.

**Step 3: Commit**

```bash
git add app.js
git commit -m "feat: implement undo button visibility and action methods"
```

---

## Task 5: Implement Paste Button Methods

**Files:**
- Modify: `app.js` (after `handleUndo()` method)

**Step 1: Add paste button methods**

In `app.js`, add these methods after `handleUndo()`:

```javascript
        handleUndo() {
            // ... existing code ...
        },

        showPasteButton() {
            // Clear existing timeout
            if (this.pasteTimeout) {
                clearTimeout(this.pasteTimeout);
                this.pasteTimeout = null;
            }

            // Show button
            this.pasteButtonVisible = true;

            // Set timeout to hide after 8 seconds
            this.pasteTimeout = setTimeout(() => {
                this.pasteButtonVisible = false;
                this.pasteTimeout = null;
            }, 8000);
        },

        hidePasteButton() {
            this.pasteButtonVisible = false;
            if (this.pasteTimeout) {
                clearTimeout(this.pasteTimeout);
                this.pasteTimeout = null;
            }
        },

        async handlePasteButton() {
            try {
                // Read text from clipboard
                const text = await navigator.clipboard.readText();

                // Insert text at cursor position (same as handlePaste)
                document.execCommand('insertText', false, text);

                // Hide button immediately after paste
                this.hidePasteButton();
            } catch (err) {
                // Permission denied or clipboard API unavailable
                console.log('Clipboard read failed:', err);
                // Hide button on error
                this.hidePasteButton();
            }
        },
```

**Step 2: Test paste button manually**

Copy some text, then in browser console call `Alpine.$data(document.body).showPasteButton()`.
Click the paste button.
Expected: Text is pasted, button disappears immediately.

**Step 3: Commit**

```bash
git add app.js
git commit -m "feat: implement paste button visibility and action methods"
```

---

## Task 6: Integrate Undo Button with Text Edits

**Files:**
- Modify: `app.js:68-72` (handleInput method)

**Step 1: Call showUndoButton on text input**

Modify the `handleInput()` method to show the undo button:

```javascript
        handleInput(event) {
            // Get plain text content from contenteditable div
            // Note: We rely on the @blur event to trigger saveNote() to avoid redundant saves
            this.noteContent = this.$refs.noteArea.innerText || '';

            // Show undo button when text changes
            this.showUndoButton();
        },
```

**Step 2: Test undo button on typing**

Open app in browser, type some text.
Expected: Undo button appears immediately, fades after 8 seconds.
Type more text within 8 seconds.
Expected: Timer resets, button stays visible for another 8 seconds.

**Step 3: Test undo functionality**

Type "hello world", wait for undo button to appear.
Click undo button.
Expected: Text reverts one step at a time, button stays visible.

**Step 4: Commit**

```bash
git add app.js
git commit -m "feat: integrate undo button with text input events"
```

---

## Task 7: Integrate Paste Button with Copy/Cut Events

**Files:**
- Modify: `app.js:32-54` (init method)

**Step 1: Add copy/cut event listeners in init**

In the `init()` method, add event listeners after the existing color scheme listener:

```javascript
        async init() {
            // Load saved data
            await this.loadNote();
            await this.loadTextSize();
            await this.loadColorMode();

            // Set initial color mode
            this.updateColorMode();

            // Listen for system color scheme changes
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
                this.updateColorMode();
            });

            // Listen for copy/cut events to show paste button
            document.addEventListener('copy', () => {
                this.showPasteButton();
            });

            document.addEventListener('cut', () => {
                this.showPasteButton();
            });

            // Set initial content in contenteditable div
            this.$nextTick(() => {
```

**Step 2: Test paste button on copy**

Open app in browser, select and copy some text (Cmd+C or long-press).
Expected: Paste button appears immediately, fades after 8 seconds.

**Step 3: Test paste button on cut**

Select text and cut it (Cmd+X).
Expected: Paste button appears immediately.

**Step 4: Commit**

```bash
git add app.js
git commit -m "feat: integrate paste button with copy/cut events"
```

---

## Task 8: Hide Buttons When Menu Opens

**Files:**
- Modify: `app.js:215-235` (toggleMenu and closeMenu methods)

**Step 1: Hide buttons in toggleMenu**

Modify `toggleMenu()` to hide floating buttons when menu opens:

```javascript
        toggleMenu() {
            this.menuOpen = !this.menuOpen;

            // Reset clear confirmation state when opening menu
            if (this.menuOpen) {
                this.clearConfirmPending = false;
                if (this.clearConfirmTimeout) {
                    clearTimeout(this.clearConfirmTimeout);
                    this.clearConfirmTimeout = null;
                }

                // Hide floating action buttons when menu opens
                this.hideUndoButton();
                this.hidePasteButton();
            }
        },
```

**Step 2: Hide buttons in closeMenu**

Modify `closeMenu()` to ensure buttons are hidden:

```javascript
        closeMenu() {
            this.menuOpen = false;
            this.clearConfirmPending = false;
            if (this.clearConfirmTimeout) {
                clearTimeout(this.clearConfirmTimeout);
                this.clearConfirmTimeout = null;
            }

            // Hide floating action buttons
            this.hideUndoButton();
            this.hidePasteButton();
        },
```

**Step 3: Test menu interaction**

Type text (undo button appears), then open menu.
Expected: Undo button hides immediately when menu opens.

Copy text (paste button appears), then open menu.
Expected: Paste button hides immediately when menu opens.

**Step 4: Commit**

```bash
git add app.js
git commit -m "feat: hide floating buttons when menu opens"
```

---

## Task 9: End-to-End Testing

**Files:**
- None (manual testing)

**Step 1: Test undo button workflow**

1. Open app in iOS Safari or desktop browser
2. Type "hello world"
3. Verify undo button appears immediately
4. Wait 8 seconds without typing
5. Verify button fades out over 2 seconds
6. Type more text
7. Verify button reappears immediately
8. Within 8 seconds, type again
9. Verify button stays visible (timer resets)
10. Click undo button
11. Verify text reverts one step
12. Verify button stays visible
13. Click undo multiple times
14. Verify each undo step works
15. Open menu
16. Verify undo button disappears

**Step 2: Test paste button workflow**

1. Select text outside the app and copy it (Cmd+C)
2. Return to notebin
3. Verify paste button appears immediately
4. Wait 8 seconds
5. Verify button fades out over 2 seconds
6. Copy new text
7. Verify button reappears
8. Click paste button within 8 seconds
9. Verify text is pasted
10. Verify button disappears immediately
11. Copy text again
12. Paste button appears
13. Open menu
14. Verify paste button disappears

**Step 3: Test both buttons together**

1. Copy text (paste button appears)
2. Type in note (undo button appears)
3. Verify both buttons visible side-by-side
4. Verify 8px gap between buttons
5. Verify undo is on left, paste on right
6. Click paste
7. Verify paste button disappears, undo stays
8. Click undo
9. Verify pasted text is removed

**Step 4: Test edge cases**

1. Click undo when there's nothing to undo
   - Expected: Nothing happens, no errors
2. Copy text, deny clipboard permission when clicking paste
   - Expected: Button disappears, no errors, console shows permission error
3. Test in dark mode
   - Expected: Buttons use dark mode colors (--control-bg, etc.)
4. Test on iOS Safari with virtual keyboard
   - Expected: Buttons positioned above keyboard, not obscured

**Step 5: Document any issues**

Create GitHub issues for any bugs found.
Note positioning issues with keyboard for future enhancement.

---

## Task 10: Final Commit and Verification

**Files:**
- All modified files

**Step 1: Run final verification**

```bash
git status
```

Expected output:
```
On branch 2025-12-10-new-features
nothing to commit, working tree clean
```

**Step 2: View commit history**

```bash
git log --oneline -10
```

Expected: All commits for floating action buttons visible.

**Step 3: Test service worker**

If service worker is enabled, verify buttons work offline:
1. Load app online
2. Go offline
3. Copy text → paste button appears
4. Type text → undo button appears
5. Click buttons → both work offline

**Step 4: Create verification checklist**

Confirm all requirements met:
- ☐ Undo button appears on text edits
- ☐ Undo button uses native execCommand('undo')
- ☐ Undo button visible for 8 seconds, fades over 2 seconds
- ☐ Undo button timer resets on tap
- ☐ Paste button appears on copy/cut events
- ☐ Paste button uses Clipboard API
- ☐ Paste button visible for 8 seconds, fades over 2 seconds
- ☐ Paste button disappears immediately after tap
- ☐ Both buttons styled as 44px circles matching menu
- ☐ Buttons positioned lower-right with safe area insets
- ☐ Buttons side-by-side with 8px gap (undo left, paste right)
- ☐ Both buttons hide when menu opens
- ☐ Works in light and dark mode
- ☐ No console errors
- ☐ Graceful fallback if Clipboard API fails

---

## SVG Icon Replacement (Future Task)

**Note:** User will provide SVG icons to replace 'U' and 'P' placeholders.

When SVGs are ready:

**Files:**
- Modify: `index.html` (replace button content)

**Step 1: Replace undo button placeholder**

Replace `U` with SVG:
```html
<button x-show="undoButtonVisible" @click="handleUndo()" class="action-btn" aria-label="Undo">
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <!-- User-provided SVG path -->
    </svg>
</button>
```

**Step 2: Replace paste button placeholder**

Replace `P` with SVG:
```html
<button x-show="pasteButtonVisible" @click="handlePasteButton()" class="action-btn" aria-label="Paste">
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <!-- User-provided SVG path -->
    </svg>
</button>
```

**Step 3: Verify SVG sizing and centering**

Ensure SVGs are centered in 44px circles and match menu button icon sizing.

**Step 4: Commit**

```bash
git add index.html
git commit -m "design: replace placeholder text with SVG icons for floating buttons"
```

---

## Architecture Notes

### Why This Approach

**Timeout-based visibility:** Simple, predictable UX without complex state tracking.

**Native undo:** Leverages browser's built-in undo stack, no need to implement custom history management.

**Clipboard API:** Modern, secure way to access clipboard. Graceful degradation if permission denied.

**Fixed positioning:** Simpler than dynamic keyboard detection, can iterate later if needed.

**Separate methods:** `show*()` and `hide*()` methods for each button allow independent control and easy testing.

### DRY Opportunities (Not Implemented - YAGNI)

Could extract shared timeout logic into a generic `showTimedButton(buttonName, duration)` method, but:
- Only 2 buttons, abstraction adds complexity
- Different behaviors after tap (undo resets timer, paste hides immediately)
- YAGNI - wait until we have 3+ buttons to justify abstraction

### Testing Strategy

Manual testing only for this initial implementation:
- Core functionality is browser built-ins (execCommand, Clipboard API)
- Alpine.js reactive behavior is well-tested upstream
- Visual/timing behavior best verified manually
- Could add automated tests later with Playwright/Cypress if needed

### Future Enhancements

1. **Dynamic keyboard positioning:** Use `visualViewport` API to track keyboard height
2. **Undo stack awareness:** Check `document.queryCommandEnabled('undo')` before showing button
3. **Haptic feedback:** Add `navigator.vibrate()` on tap for iOS
4. **Animation entrance:** Slide up vs fade in for more polished feel
5. **Paste history:** Show last N clipboard items (requires Clipboard API v2)
