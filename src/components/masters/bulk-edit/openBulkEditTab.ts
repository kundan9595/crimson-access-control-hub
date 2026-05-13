import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

/** Opens a bulk-edit page in a new browser tab. */
export const openBulkEditTab = (path: string) => {
  const url = path.startsWith('/') ? path : `/${path}`;
  window.open(url, '_blank', 'noopener,noreferrer');
};

/**
 * Returns a stable handler that closes the current bulk-edit tab.
 * If the tab was opened by another window (`window.opener` is set), it closes itself.
 * Otherwise it falls back to in-app navigation back / to a fallback path.
 */
export const useBulkEditCloser = (fallbackPath = '/masters') => {
  const navigate = useNavigate();
  return useCallback(() => {
    if (typeof window !== 'undefined' && window.opener && !window.opener.closed) {
      try {
        window.opener.focus?.();
      } catch {
      }
      window.close();
      // window.close() may be blocked if the tab wasn't opened via window.open.
      // Fall back to in-app navigation in that case.
      setTimeout(() => {
        if (!window.closed) {
          navigate(fallbackPath);
        }
      }, 100);
      return;
    }
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(fallbackPath);
    }
  }, [navigate, fallbackPath]);
};
