/**
 * modalHistory.ts
 * Single-Page Application back button navigation manager for all modals, drawers, and lightboxes.
 * Ensures pressing mobile device back button / browser back arrow steps back by one overlay
 * rather than exiting the website.
 */

interface ModalEntry {
  id: string;
  onClose: () => void;
}

class ModalHistoryManager {
  private stack: ModalEntry[] = [];
  private programmaticPopsRemaining = 0;
  private isInitialized = false;

  constructor() {
    this.init();
  }

  private init() {
    if (typeof window === 'undefined' || this.isInitialized) return;
    this.isInitialized = true;

    window.addEventListener('popstate', () => {
      // If this popstate was triggered by our own programmatic history.back() / history.go(), consume it
      if (this.programmaticPopsRemaining > 0) {
        this.programmaticPopsRemaining--;
        return;
      }

      // If there are open modals on our stack, close the topmost one
      if (this.stack.length > 0) {
        const top = this.stack.pop();
        if (top) {
          try {
            top.onClose();
          } catch (err) {
            console.error('[ModalHistory] Error closing overlay:', top.id, err);
          }
        }
      }
    });
  }

  /**
   * Push an overlay onto the history stack and push a browser history entry
   */
  public push(id: string, onClose: () => void): () => void {
    if (typeof window === 'undefined') return () => {};

    // If already on the stack, update its callback and don't duplicate browser history
    const existingIndex = this.stack.findIndex((entry) => entry.id === id);
    if (existingIndex !== -1) {
      this.stack[existingIndex].onClose = onClose;
      return () => this.pop(id);
    }

    try {
      window.history.pushState({ zarbOverlayId: id, timestamp: Date.now() }, '', window.location.href);
    } catch (e) {
      console.warn('[ModalHistory] pushState failed:', e);
    }

    this.stack.push({ id, onClose });

    return () => this.pop(id);
  }

  /**
   * Pop an overlay when closed via UI (e.g., X button, backdrop click, or action)
   * Programmatically rolls back the browser history entry so history remains clean.
   */
  public pop(id: string) {
    if (typeof window === 'undefined') return;

    const index = this.stack.findIndex((entry) => entry.id === id);
    if (index === -1) {
      // Already popped via popstate
      return;
    }

    // Number of entries to remove (including any child overlays opened on top of this one)
    const entriesToRemove = this.stack.length - index;
    this.stack.splice(index, entriesToRemove);
    this.programmaticPopsRemaining += entriesToRemove;

    try {
      if (entriesToRemove === 1) {
        window.history.back();
      } else if (entriesToRemove > 1) {
        window.history.go(-entriesToRemove);
      }
    } catch (e) {
      console.warn('[ModalHistory] history roll back failed:', e);
    }
  }

  /**
   * Check if an overlay is currently on stack
   */
  public isOpen(id: string): boolean {
    return this.stack.some((entry) => entry.id === id);
  }

  /**
   * Clear all modals on page navigation if needed
   */
  public clearAll() {
    this.stack = [];
    this.programmaticPopsRemaining = 0;
  }
}

export const modalHistory = new ModalHistoryManager();
