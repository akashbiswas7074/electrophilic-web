import * as React from 'react';

// Modified version to prevent infinite updates
export function setRef<T>(
  ref: React.MutableRefObject<T | null> | ((instance: T | null) => void) | null | undefined,
  value: T | null
): void {
  if (typeof ref === 'function') {
    ref(value);
  } else if (ref) {
    ref.current = value;
  }
}

// Custom hook version for use in React components
export function useComposeRefs<T>(...refs: (React.Ref<T> | undefined)[]) {
  // Use React.useCallback to memoize the composed ref function
  // This prevents creating a new function on every render
  return React.useCallback(
    (node: T | null) => {
      // Filter out falsy refs to avoid unnecessary iterations
      const validRefs = refs.filter(Boolean);
      validRefs.forEach((ref) => {
        setRef(ref as any, node);
      });
    },
    refs // Only recreate if refs array changes
  );
}

// Static version that doesn't use hooks (for cases where hooks can't be used)
export function composeRefs<T>(...refs: (React.Ref<T> | undefined)[]) {
  const validRefs = refs.filter(Boolean);

  // Return a stable function that doesn't change on every render
  return (node: T | null) => {
    validRefs.forEach((ref) => {
      setRef(ref as any, node);
    });
  };
}
