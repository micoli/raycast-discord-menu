import { waitForElm } from "./robot";
import { discordSelectorLabels } from "./aria-labels";

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


