
// Minimal "store" i minnet med TTL.
// OBS: Dette er for testing/dev. Ved produksjon: bytt til Redis/Upstash.

const store = new Map(); // key -> { value, expiresAt }

export function setWithTTL(key, value, ttlSeconds) {
  const expiresAt = Date.now() + ttlSeconds * 1000;
  store.set(key, { value, expiresAt });
}

export function getIfAlive(key) {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }
  return entry.value;
}

export function del(key) {
  store.delete(key);
}
