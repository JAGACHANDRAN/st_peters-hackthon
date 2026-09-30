import en from './en.json';

export function t(path, fallback = '') {
  const keys = path.split('.');
  let current = en;
  for (const k of keys) {
    if (current && typeof current === 'object' && k in current) {
      current = current[k];
    } else {
      return fallback || path;
    }
  }
  return typeof current === 'string' ? current : fallback;
}

export default en;
