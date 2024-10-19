var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
const select = (selector, condition) => {
  const elements = document.querySelectorAll(selector);
  if (elements.length === 0) {
    return null;
  }
  const filteredElems = condition(elements);
  return filteredElems.length === 0 ? null : filteredElems[0];
};
const waitForElm = (root, selector, condition = (elements) => {
  if (elements.length === 0) {
    return [];
  }
  return Array.from(elements);
}, timeoutValue = 2200) => {
  console.log(selector);
  return new Promise((resolve, reject) => {
    const initialSelected = select(selector, condition);
    if (initialSelected) {
      return resolve(initialSelected);
    }
    const observer = new MutationObserver((_mutations) => {
      const selected = select(selector, condition);
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
      subtree: true
    });
  });
};
const discordSelectorLabels = {
  stopStreaming: "Arrêter de streamer",
  shareYourScreen: "Partage ton écran",
  mute: "Rendre muet",
  noSpeaker: "Mettre en sourdine"
};
const sleep = async (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};
class DiscordExecutor {
  constructor(dispatch) {
    __publicField(this, "dispatch");
    this.dispatch = dispatch;
  }
  run(message) {
    switch (message == null ? void 0 : message.type) {
      case "startScreenShare":
        return this.startScreenShare(message == null ? void 0 : message.screenIndex);
      case "stopScreenShare":
        return this.stopScreenShare();
      case "toggleMicrophone":
        return this.toggleMicrophone();
      case "setMicrophoneOn":
        return this.setMicrophoneOn();
      case "setMicrophoneOff":
        return this.setMicrophoneOff();
      case "toggleSpeaker":
        return this.toggleSpeaker();
      case "setSpeakerOn":
        return this.setSpeakerOn();
      case "setSpeakerOff":
        return this.setSpeakerOff();
      default:
        console.log(message);
    }
  }
  async startScreenShare(screenIndex) {
    const shareButton = await waitForElm(document.body, `[aria-label="${discordSelectorLabels.shareYourScreen}"]`);
    shareButton.click();
    const screenTabButton = await waitForElm(document.body, 'form div[role="button"][class^=tabItem]:nth-child(2)');
    screenTabButton.click();
    await sleep(500);
    const screenDiv = await waitForElm(document.body, `form div[class^="tile_"]:nth-of-type(${screenIndex}) div[class^="sourceThumbnail_"]:nth-child(1)`);
    screenDiv.click();
    const submitButton = await waitForElm(document.body, "form button[type=submit]:enabled");
    submitButton.click();
  }
  async stopScreenShare() {
    const stopShareButton = await waitForElm(document.body, `[aria-label="${discordSelectorLabels.stopStreaming}"]`);
    stopShareButton.click();
  }
  async toggleMicrophone() {
    const microphoneButton = await waitForElm(document.body, `[aria-label="${discordSelectorLabels.mute}"]`);
    microphoneButton.click();
  }
  async setMicrophoneOn() {
    const microphoneButton = await waitForElm(document.body, `[aria-label="${discordSelectorLabels.mute}"][aria-checked=true]`);
    microphoneButton.click();
  }
  async setMicrophoneOff() {
    const microphoneButton = await waitForElm(document.body, `[aria-label="${discordSelectorLabels.mute}"][aria-checked=false]`);
    microphoneButton.click();
  }
  async toggleSpeaker() {
    const speakerButton = await waitForElm(document.body, `[aria-label="${discordSelectorLabels.noSpeaker}"]`);
    speakerButton.click();
  }
  async setSpeakerOn() {
    const speakerButton = await waitForElm(document.body, `[aria-label="${discordSelectorLabels.noSpeaker}"][aria-checked=true]`);
    speakerButton.click();
  }
  async setSpeakerOff() {
    const speakerButton = await waitForElm(document.body, `[aria-label="${discordSelectorLabels.noSpeaker}"][aria-checked=false]`);
    speakerButton.click();
  }
}
(() => {
  const dispatch = (message, log = true) => {
    try {
      if (log) {
        console.log("dispatch", JSON.stringify(message));
      }
    } catch (error) {
      console.log("dispatch error", error);
    }
  };
  document.discordExecutor = new DiscordExecutor(dispatch);
})();
