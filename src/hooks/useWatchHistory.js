import { useState, useEffect, useCallback } from 'react';

/**
 * useWatchHistory Hook
 *
 * Saves user watch history to localStorage so they can "Continue Watching"
 * when they come back. Stores the last 20 items.
 */

const HISTORY_KEY = 'cinevault_watch_history';

export function useWatchHistory() {
  const [history, setHistory] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(HISTORY_KEY));
      if (Array.isArray(stored)) {
        setHistory(stored);
      }
    } catch {
      // corrupted data, reset
      localStorage.removeItem(HISTORY_KEY);
    }
    setIsLoaded(true);
  }, []);

  /**
   * Add a movie/TV show to watch history.
   * @param {Object} item - { id, title, poster_path, mediaType, season, episode, timestamp }
   */
  const addToHistory = useCallback((item) => {
    setHistory((prev) => {
      // Remove duplicate if exists
      const filtered = prev.filter(
        (h) => !(h.id === item.id && h.mediaType === item.mediaType)
      );

      // Add new item at the front with timestamp
      const updated = [
        { ...item, timestamp: Date.now() },
        ...filtered,
      ].slice(0, 20); // Keep max 20 items

      localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  /**
   * Remove an item from history.
   */
  const removeFromHistory = useCallback((id, mediaType) => {
    setHistory((prev) => {
      const updated = prev.filter(
        (h) => !(h.id === id && h.mediaType === mediaType)
      );
      localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  /**
   * Clear entire watch history.
   */
  const clearHistory = useCallback(() => {
    setHistory([]);
    localStorage.removeItem(HISTORY_KEY);
  }, []);

  return {
    history,
    isLoaded,
    addToHistory,
    removeFromHistory,
    clearHistory,
    hasHistory: history.length > 0,
  };
}