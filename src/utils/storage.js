export const getStorage = (key) => { try { return localStorage.getItem(key); } catch { return null; } };
  export const setStorage = (key, val) => { try { localStorage.setItem(key, val); } catch {} };
  export const removeStorage = (key) => { try { localStorage.removeItem(key); } catch {} };
  