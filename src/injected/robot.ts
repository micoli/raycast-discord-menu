export const waitFor = <T>(find: () => T | null | undefined, description: string, timeoutMs = 5000): Promise<T> => {
  return new Promise((resolve, reject) => {
    const initial = find();
    if (initial) {
      return resolve(initial);
    }

    const observer = new MutationObserver(() => {
      const found = find();
      if (!found) {
        return;
      }
      clearTimeout(timeout);
      observer.disconnect();
      resolve(found);
    });

    const timeout = setTimeout(() => {
      observer.disconnect();
      reject(new Error(`Timeout waiting for ${description}`));
    }, timeoutMs);

    observer.observe(document.body, { childList: true, subtree: true });
  });
};
