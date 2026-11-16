import { extendTailwindMerge } from 'tailwind-merge';

/**
 * Joins class names and resolves Tailwind conflicts: the last class wins.
 * It must know our own tokens (styles/theme.css), or it mistakes `text-label` for a colour
 * and drops it whenever a real colour class follows.
 */
export const cx = extendTailwindMerge({
  extend: {
    theme: {
      text: ['caption', 'label', 'body', 'subtitle', 'title', 'heading', 'display', 'hero', 'stat'],
      radius: ['control', 'card'],
      shadow: ['popover', 'card', 'pill', 'soft'],
    },
  },
});
