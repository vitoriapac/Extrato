import { h } from 'preact';
import { render as renderToString } from 'preact-render-to-string';
import { HelpTab, type HelpTabProps } from './HelpTab.js';
import { HELP_CATEGORIES, HELP_GLOSSARY, HELP_FAQ } from './help-content.js';

export function renderHelpCenter({
  categories = HELP_CATEGORIES,
  glossary = HELP_GLOSSARY,
  faq = HELP_FAQ,
}: HelpTabProps = {}): string {
  return renderToString(h(HelpTab, { categories, glossary, faq }));
}
