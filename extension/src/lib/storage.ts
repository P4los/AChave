/**
 * Storage wrapper that uses chrome.storage.local when available (extension mode)
 * and falls back to localStorage (development mode).
 */

const isChromeExtension = typeof chrome !== 'undefined' && chrome.storage;

export const storage = {
  async get(key: string): Promise<string | null> {
    if (isChromeExtension) {
      return new Promise((resolve) => {
        chrome.storage.local.get([key], (result) => {
          resolve((result[key] as string) ?? null);
        });
      });
    }
    return localStorage.getItem(key);
  },

  async set(key: string, value: string): Promise<void> {
    if (isChromeExtension) {
      return new Promise((resolve) => {
        chrome.storage.local.set({ [key]: value }, resolve);
      });
    }
    localStorage.setItem(key, value);
  },

  async remove(key: string): Promise<void> {
    if (isChromeExtension) {
      return new Promise((resolve) => {
        chrome.storage.local.remove([key], resolve);
      });
    }
    localStorage.removeItem(key);
  },
};
