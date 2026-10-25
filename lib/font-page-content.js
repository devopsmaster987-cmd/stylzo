// Lookup and rendering helpers for the editable font-page content.
//
// The content itself lives in data/font-page-content.js so it can be edited
// without touching the route. This module only turns the example inputs into
// real converter output, using the same engine the generator uses.

import { renderStyleExample } from './style-content.js';
import { fontPageContent } from '../data/font-page-content.js';

const EXAMPLE_LABELS = ['Name', 'Caption', 'Short phrase'];

export { fontPageContent };

export function customFontContent(slug) {
  return fontPageContent[String(slug || '')] || null;
}

export function renderCustomFontExamples(style, inputs = []) {
  return inputs.map((input, index) => {
    const text = String(input || '');
    return {
      label: EXAMPLE_LABELS[index] || `Example ${index + 1}`,
      plain: text,
      output: renderStyleExample(style, text),
    };
  });
}
