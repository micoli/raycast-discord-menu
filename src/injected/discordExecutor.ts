type conditionInterface = <T extends Node>(elements: NodeListOf<T>) => T[];
declare global {
    interface Document {
        discordExecutor: DiscordExecutor;
    }
}

const select = <T extends HTMLElement>(selector: string, condition: conditionInterface):null|T => {
    const elements = document.querySelectorAll<T>(selector);
    if (elements.length === 0) {
        return null;
    }

    const filteredElems = condition<T>(elements);

    return filteredElems.length === 0 ? null : filteredElems[0];
}

export const waitForElm = <T extends HTMLElement>(root: HTMLElement, selector: string, condition: conditionInterface = (elements) => {
    if (elements.length === 0) {
        return [];
    }
    return Array.from(elements);
}, timeoutValue = 2200): Promise<T> => {
    console.log(selector);
    return new Promise((resolve, reject) => {
        const initialSelected = select<T>(selector, condition);
        if (initialSelected) {
            return resolve(initialSelected);
        }

        const observer = new MutationObserver(_mutations => {
            const selected = select<T>(selector, condition);
            if (!selected) {
                return;
            }
            clearTimeout(timeout);
            observer.disconnect();
            resolve(selected);
        });

        const timeout = setTimeout(() => {
            observer.disconnect()
            reject({type: 'timeout', selector});
        }, timeoutValue)

        observer.observe(root, {
            childList: true,
            subtree: true
        });
    });
}

const discordSelectorLabels = {
    stopStreaming: 'Arrêter de streamer',
    shareYourScreen: 'Partage ton écran',
    mute: 'Rendre muet',
    noSpeaker: 'Mettre en sourdine',
}

const sleep = async (ms: number) => {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export class DiscordExecutor {
    dispatch: (_message: any, _log?: boolean) => {};

    constructor(dispatch: any) {
        this.dispatch = dispatch;
    }

    run(message: any) {
        switch (message?.type) {
            case 'startScreenShare':
                return this.startScreenShare(message?.screenIndex);
            case 'stopScreenShare':
                return this.stopScreenShare();
            case 'toggleMicrophone':
                return this.toggleMicrophone();
            case 'setMicrophoneOn':
                return this.setMicrophoneOn();
            case 'setMicrophoneOff':
                return this.setMicrophoneOff();
            case 'toggleSpeaker':
                return this.toggleSpeaker();
            case 'setSpeakerOn':
                return this.setSpeakerOn();
            case 'setSpeakerOff':
                return this.setSpeakerOff();
            default:
                console.log(message);
        }

    }

    async startScreenShare(screenIndex: number) {
        const shareButton = await waitForElm<HTMLButtonElement>(document.body, `[aria-label="${discordSelectorLabels.shareYourScreen}"]`);
        shareButton.click();

        const screenTabButton = await waitForElm<HTMLButtonElement>(document.body, 'form div[role="button"][class^=tabItem]:nth-child(2)');
        screenTabButton.click();

        await sleep(500)
        const screenDiv = await waitForElm<HTMLButtonElement>(document.body, `form div[class^="tile_"]:nth-of-type(${screenIndex}) div[class^="sourceThumbnail_"]:nth-child(1)`);
        screenDiv.click();

        const submitButton = await waitForElm<HTMLButtonElement>(document.body, 'form button[type=submit]:enabled');
        submitButton.click();
    }

    async stopScreenShare() {
        const stopShareButton = await waitForElm<HTMLButtonElement>(document.body, `[aria-label="${discordSelectorLabels.stopStreaming}"]`);
        stopShareButton.click();
    }

    async toggleMicrophone() {
        const microphoneButton = await waitForElm<HTMLButtonElement>(document.body, `[aria-label="${discordSelectorLabels.mute}"]`);
        microphoneButton.click();
    }

    async setMicrophoneOn() {
        const microphoneButton = await waitForElm<HTMLButtonElement>(document.body, `[aria-label="${discordSelectorLabels.mute}"][aria-checked=true]`);
        microphoneButton.click();
    }

    async setMicrophoneOff() {
        const microphoneButton = await waitForElm<HTMLButtonElement>(document.body, `[aria-label="${discordSelectorLabels.mute}"][aria-checked=false]`);
        microphoneButton.click();
    }

    async toggleSpeaker() {
        const speakerButton = await waitForElm<HTMLButtonElement>(document.body, `[aria-label="${discordSelectorLabels.noSpeaker}"]`);
        speakerButton.click();
    }

    async setSpeakerOn() {
        const speakerButton = await waitForElm<HTMLButtonElement>(document.body, `[aria-label="${discordSelectorLabels.noSpeaker}"][aria-checked=true]`);
        speakerButton.click();
    }

    async setSpeakerOff() {
        const speakerButton = await waitForElm<HTMLButtonElement>(document.body, `[aria-label="${discordSelectorLabels.noSpeaker}"][aria-checked=false]`);
        speakerButton.click();
    }
}


(() => {
    const dispatch = (message: string, log = true) => {
        try {
            if (log) {
                console.log('dispatch', JSON.stringify(message))
            }
        } catch (error) {
            console.log('dispatch error', error);
        }
    }
    document.discordExecutor = new DiscordExecutor(dispatch);
})();
