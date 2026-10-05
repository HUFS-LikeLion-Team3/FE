import { clsx, type ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

// Custom text sizes must not be merged away by text color classes.
const mergeClasses = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [{ text: ['control', 'meta', 'ui', 'label', 'hero', 'page', 'section', 'news-title', 'news-body', 'number'] }],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return mergeClasses(clsx(inputs))
}
