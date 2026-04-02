export const cacheManager = {
  set: (key, value, expiryMinutes = 60) => {
    const item = {
      value: value,
      expiry: Date.now() + expiryMinutes * 60000,
    };
    localStorage.setItem(key, JSON.stringify(item));
  },

  get: (key) => {
    const itemStr = localStorage.getItem(key);
    if (!itemStr) return null;

    const item = JSON.parse(itemStr);
    if (Date.now() > item.expiry) {
      localStorage.removeItem(key);
      return null;
    }
    return item.value;
  },

  remove: (key) => {
    localStorage.removeItem(key);
  },

  clear: () => {
    localStorage.clear();
  },
};