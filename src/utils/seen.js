const STORAGE_KEY = 'vfm-seen-reports';

export function loadSeen() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw));
  } catch {
    return new Set();
  }
}

export function saveSeen(seen) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...seen]));
  } catch (err) {
    console.warn('[seen] localStorage write failed', err);
  }
}

export function clearSeen() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function createSeenStore() {
  let seen = loadSeen();

  return {
    get: () => seen,
    has: (id) => seen.has(id),
    add: (id) => {
      seen.add(id);
      saveSeen(seen);
    },
    addAll: (ids) => {
      ids.forEach((id) => seen.add(id));
      saveSeen(seen);
    },
    clear: () => {
      seen = new Set();
      clearSeen();
    },
  };
}
