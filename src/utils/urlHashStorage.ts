import type { StateStorage } from "zustand/middleware";

const hashStorage: StateStorage = {
  getItem: (key: string): string => {
    const searchParams = new URLSearchParams(location.hash.slice(1));
    const storedValue = searchParams.get(key) ?? "";
    try {
      // Handle both base64 encoded and regular JSON for backwards compatibility
      const decoded = storedValue.startsWith("b64:")
        ? atob(storedValue.slice(4))
        : storedValue;
      return JSON.parse(decoded);
    } catch {
      // If URL is corrupted, clear the hash and return empty string
      // This will let the store use its default values
      if (storedValue) {
        console.warn(
          `Corrupted URL hash detected for key: ${key}. Clearing hash.`
        );
        location.hash = "";
      }
      return storedValue;
    }
  },
  setItem: (key: string, newValue: unknown): void => {
    // Check if URL sharing is enabled
    const embeddedConfig = getEmbeddedConfig();
    if (!embeddedConfig?.urlSharingEnabled) {
      // Don't write to URL when sharing is disabled
      return;
    }

    const searchParams = new URLSearchParams(location.hash.slice(1));
    // Encode as base64 to make URL much cleaner
    const encoded = "b64:" + btoa(JSON.stringify(newValue));
    searchParams.set(key, encoded);
    location.hash = searchParams.toString();
  },
  removeItem: (key: string): void => {
    const searchParams = new URLSearchParams(location.hash.slice(1));
    searchParams.delete(key);
    location.hash = searchParams.toString();
  },
};

// Helper function to get embedded configuration from sessionStorage
function getEmbeddedConfig(): { urlSharingEnabled: boolean } | null {
  try {
    const stored = sessionStorage.getItem("embedded-configuration");
    if (!stored) return null;

    const parsed = JSON.parse(stored);
    return parsed.state || null;
  } catch {
    return null;
  }
}

export default hashStorage;
