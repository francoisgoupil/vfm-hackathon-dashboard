const STORAGE_KEY = 'vfm-dashboard-seen';

export function createSeenStore() {
  const seen = new Set<string>();

  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) JSON.parse(raw).forEach((id: string) => seen.add(id));
    } catch {
      /* ignore */
    }
  }

  return {
    has(id: string | number | null | undefined) {
      return id != null && seen.has(String(id));
    },
    add(id: string | number | null | undefined) {
      if (id == null) return;
      seen.add(String(id));
      persist();
    },
    addAll(ids: (string | number | null | undefined)[]) {
      ids.forEach((id) => {
        if (id != null) seen.add(String(id));
      });
      persist();
    },
    clear() {
      seen.clear();
      if (typeof window !== 'undefined') localStorage.removeItem(STORAGE_KEY);
    },
  };

  function persist() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...seen]));
    } catch {
      /* ignore */
    }
  }
}
