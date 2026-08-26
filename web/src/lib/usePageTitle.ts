import { useEffect } from 'react';

/**
 * Sets the document title for as long as a page is mounted.
 *
 * A single-page app does not change the title on navigation by itself, which
 * matters more than it sounds: the title is what a browser tab, a bookmark and
 * the back-button history all show.
 */
export function usePageTitle(title: string) {
  useEffect(() => {
    const previous = document.title;
    document.title = title;
    return () => {
      document.title = previous;
    };
  }, [title]);
}
