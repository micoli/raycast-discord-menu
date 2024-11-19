type conditionInterface = <T extends Node>(elements: NodeListOf<T>) => T[];

const select = <T extends HTMLElement>(selector: string, condition: conditionInterface): null | T => {
  const elements = document.querySelectorAll<T>(selector);
  if (elements.length === 0) {
    return null;
  }

  const filteredElems = condition<T>(elements);

  return filteredElems.length === 0 ? null : filteredElems[0];
};

export const waitForElm = <T extends HTMLElement>(
  root: HTMLElement,
  selector: string,
  condition: conditionInterface = (elements) => {
    if (elements.length === 0) {
      return [];
    }
    return Array.from(elements);
  },
  timeoutValue = 4999,
): Promise<T> => {
  console.log(selector);
  return new Promise((resolve, reject) => {
    const initialSelected = select<T>(selector, condition);
    if (initialSelected) {
      return resolve(initialSelected);
    }

    const observer = new MutationObserver((_mutations) => {
      const selected = select<T>(selector, condition);
      if (!selected) {
        return;
      }
      clearTimeout(timeout);
      observer.disconnect();
      resolve(selected);
    });

    const timeout = setTimeout(() => {
      observer.disconnect();
      reject({ type: "timeout", selector });
    }, timeoutValue);

    observer.observe(root, {
      childList: true,
      subtree: true,
    });
  });
};
