// The catalogue category keys, kept in a tiny module so the edge proxy can
// validate `/?category=` redirects without importing the category copy or
// touching the filesystem.
export const CATEGORY_KEYS = [
  'bold',
  'italic',
  'cursive',
  'gothic',
  'outline',
  'clean',
  'wide',
  'bubble',
  'small',
  'lines',
  'flip',
  'glitch',
  'decorated',
  'symbols',
  'emoji',
  'kaomoji',
  'gaming',
  'social',
];
