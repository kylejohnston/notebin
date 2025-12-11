// Configure LocalForage
localforage.config({
    name: 'notebin',
    storeName: 'notes'
});

// Storage keys
const STORAGE_KEYS = {
    NOTE_CONTENT: 'noteContent',
    TEXT_SIZE: 'textSize',
    COLOR_MODE: 'colorModeOverride'
};

// Default values
const DEFAULTS = {
    TEXT_SIZE: 24,
    MIN_TEXT_SIZE: 16, // Prevents iOS Safari auto-zoom on focus
    MAX_TEXT_SIZE: 48,
    TEXT_SIZE_INCREMENT: 2
};

function noteApp() {
    return {
        noteContent: '',
        textSize: DEFAULTS.TEXT_SIZE,
        colorModeOverride: null, // null = system, 'light' or 'dark' = override
        colorMode: 'light', // computed: 'light' or 'dark'
        menuOpen: false,
        clearConfirmPending: false,
        clearConfirmTimeout: null,

        // Floating action buttons
        undoButtonVisible: false,
        pasteButtonVisible: false,
        undoTimeout: null,
        pasteTimeout: null,

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

            // Set initial content in contenteditable div
            this.$nextTick(() => {
                this.updateContentEditableContent();

                // Auto-focus logic: focus if note is empty
                if (!this.noteContent || this.noteContent.trim() === '') {
                    this.$refs.noteArea.focus();
                }
            });
        },

        async loadNote() {
            try {
                const saved = await localforage.getItem(STORAGE_KEYS.NOTE_CONTENT);
                if (saved !== null) {
                    this.noteContent = saved;
                }
            } catch (err) {
                console.error('Error loading note:', err);
            }
        },

        handleInput(event) {
            // Get plain text content from contenteditable div
            // Note: We rely on the @blur event to trigger saveNote() to avoid redundant saves
            this.noteContent = this.$refs.noteArea.innerText || '';
        },

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
        },

        updateContentEditableContent() {
            // Update the contenteditable div with saved content
            // SECURITY: Uses textContent (not innerHTML) to prevent XSS when setting user content
            if (this.$refs.noteArea) {
                // Handle empty content: leave innerHTML empty to trigger CSS :empty pseudo-element
                if (!this.noteContent || this.noteContent.trim() === '') {
                    this.$refs.noteArea.innerHTML = '';
                    return;
                }

                // Convert plain text to HTML with proper line breaks
                const lines = this.noteContent.split('\n');
                this.$refs.noteArea.innerHTML = '';

                lines.forEach((line, index) => {
                    const div = document.createElement('div');
                    // Use <br> for empty lines instead of zero-width space to avoid content discrepancies
                    if (line === '') {
                        div.appendChild(document.createElement('br'));
                    } else {
                        // SECURITY: Always use textContent for user content to prevent XSS
                        div.textContent = line;
                    }
                    this.$refs.noteArea.appendChild(div);
                });
            }
        },

        async saveNote() {
            try {
                await localforage.setItem(STORAGE_KEYS.NOTE_CONTENT, this.noteContent);
            } catch (err) {
                console.error('Error saving note:', err);
            }
        },

        async loadTextSize() {
            try {
                const saved = await localforage.getItem(STORAGE_KEYS.TEXT_SIZE);
                if (saved !== null) {
                    this.textSize = saved;
                }
            } catch (err) {
                console.error('Error loading text size:', err);
            }
        },

        async saveTextSize() {
            try {
                await localforage.setItem(STORAGE_KEYS.TEXT_SIZE, this.textSize);
            } catch (err) {
                console.error('Error saving text size:', err);
            }
        },

        increaseTextSize() {
            if (this.textSize < DEFAULTS.MAX_TEXT_SIZE) {
                this.textSize += DEFAULTS.TEXT_SIZE_INCREMENT;
                this.saveTextSize();
            }
        },

        decreaseTextSize() {
            if (this.textSize > DEFAULTS.MIN_TEXT_SIZE) {
                this.textSize -= DEFAULTS.TEXT_SIZE_INCREMENT;
                this.saveTextSize();
            }
        },

        async loadColorMode() {
            try {
                const saved = await localforage.getItem(STORAGE_KEYS.COLOR_MODE);
                if (saved !== null) {
                    this.colorModeOverride = saved;
                }
            } catch (err) {
                console.error('Error loading color mode:', err);
            }
        },

        async saveColorMode() {
            try {
                await localforage.setItem(STORAGE_KEYS.COLOR_MODE, this.colorModeOverride);
            } catch (err) {
                console.error('Error saving color mode:', err);
            }
        },

        updateColorMode() {
            if (this.colorModeOverride !== null) {
                // User has set an override
                this.colorMode = this.colorModeOverride;
            } else {
                // Follow system preference
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                this.colorMode = prefersDark ? 'dark' : 'light';
            }

            // Update theme-color meta tag for iOS status bar
            this.updateThemeColor();
        },

        updateThemeColor() {
            const metaThemeColor = document.querySelector('meta[name="theme-color"]');
            if (metaThemeColor) {
                // Match the background colors from CSS
                const themeColor = this.colorMode === 'dark' ? '#1a1a1a' : '#fafafa';
                metaThemeColor.setAttribute('content', themeColor);
            }
        },

        toggleColorMode() {
            if (this.colorModeOverride === null) {
                // Currently following system, set override to opposite of current
                const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                this.colorModeOverride = systemPrefersDark ? 'light' : 'dark';
            } else {
                // Currently overridden, toggle back to system
                this.colorModeOverride = null;
            }

            this.updateColorMode();
            this.saveColorMode();
        },

        toggleMenu() {
            this.menuOpen = !this.menuOpen;

            // Reset clear confirmation state when opening menu
            if (this.menuOpen) {
                this.clearConfirmPending = false;
                if (this.clearConfirmTimeout) {
                    clearTimeout(this.clearConfirmTimeout);
                    this.clearConfirmTimeout = null;
                }
            }
        },

        closeMenu() {
            this.menuOpen = false;
            this.clearConfirmPending = false;
            if (this.clearConfirmTimeout) {
                clearTimeout(this.clearConfirmTimeout);
                this.clearConfirmTimeout = null;
            }
        },

        handleClear() {
            if (this.clearConfirmPending) {
                // Second tap - actually clear the note
                this.clearNote();
            } else {
                // First tap - enter confirm state
                this.clearConfirmPending = true;

                // Reset after 3 seconds if no second tap
                this.clearConfirmTimeout = setTimeout(() => {
                    this.clearConfirmPending = false;
                }, 3000);
            }
        },

        async clearNote() {
            try {
                // Clear the note content
                this.noteContent = '';
                await localforage.setItem(STORAGE_KEYS.NOTE_CONTENT, '');

                // Clear the contenteditable div
                if (this.$refs.noteArea) {
                    this.$refs.noteArea.innerHTML = '';
                }

                // Reset confirmation state
                this.clearConfirmPending = false;
                if (this.clearConfirmTimeout) {
                    clearTimeout(this.clearConfirmTimeout);
                    this.clearConfirmTimeout = null;
                }

                // Close menu
                this.closeMenu();

                // Focus note area (since it's now empty)
                this.$nextTick(() => {
                    this.$refs.noteArea.focus();
                });
            } catch (err) {
                console.error('Error clearing note:', err);
            }
        }
    };
}
