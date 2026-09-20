import { readDiscordState } from "./discord-dom";

const CHECK_THROTTLE_MS = 300;
const MIN_NOTIFY_INTERVAL_MS = 1000;

export const startStateWatcher = (notifyUrl: string) => {
  let lastState = JSON.stringify(readDiscordState());
  let lastNotifiedAt = 0;
  let pendingCheck: ReturnType<typeof setTimeout> | undefined;

  const check = () => {
    pendingCheck = undefined;
    const current = JSON.stringify(readDiscordState());
    if (current === lastState) {
      return;
    }
    const sinceLastNotification = Date.now() - lastNotifiedAt;
    if (sinceLastNotification < MIN_NOTIFY_INTERVAL_MS) {
      pendingCheck = setTimeout(check, MIN_NOTIFY_INTERVAL_MS - sinceLastNotification);
      return;
    }
    lastState = current;
    lastNotifiedAt = Date.now();
    window.open(notifyUrl);
  };

  // Discord mutates the DOM constantly, so checks are throttled instead of debounced
  const observer = new MutationObserver(() => {
    pendingCheck ??= setTimeout(check, CHECK_THROTTLE_MS);
  });
  observer.observe(document.body, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ["aria-checked", "aria-pressed"],
  });

  return () => {
    observer.disconnect();
    clearTimeout(pendingCheck);
  };
};
