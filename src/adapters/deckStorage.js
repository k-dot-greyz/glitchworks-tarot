export function createDeckStorage({ getItem, setItem, removeItem }) {
  return {
    load: (key) => {
      try {
        return getItem(key);
      } catch {
        return null;
      }
    },
    save: (key, value) => {
      try {
        setItem(key, value);
        return { ok: true };
      } catch (err) {
        return { ok: false, error: err.message };
      }
    },
    clear: (key) => {
      try {
        removeItem(key);
        return { ok: true };
      } catch (err) {
        return { ok: false, error: err.message };
      }
    }
  };
}
