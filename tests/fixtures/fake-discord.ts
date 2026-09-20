// A small DOM reproducing the structure of the discord app that the extension relies on, reacting to clicks like discord.

type FakeMember = string | { name: string; status?: string; avatarUrl?: string };

export type FakeChannel = { name: string; label?: string; members: FakeMember[] };

export type FakeDiscordOptions = {
  connected?: boolean;
  muted?: boolean;
  deafened?: boolean;
  sharing?: boolean;
  userName?: string;
  channels?: FakeChannel[];
  screens?: number;
  // The tooltip texts of the camera, share and activity buttons
  tooltips?: [string, string, string];
};

const PICKER_DELAY_MS = 5;

const element = (html: string) => {
  const template = document.createElement("template");
  template.innerHTML = html.trim();
  return template.content.firstElementChild as HTMLElement;
};

const escape = (value: string) => value.replace(/"/g, "&quot;");

export class FakeDiscord {
  connected: boolean;
  muted: boolean;
  deafened: boolean;
  sharing: boolean;
  escapePressed = 0;
  sharedScreen?: number;

  private readonly options: FakeDiscordOptions;
  private muteButton!: HTMLElement;
  private deafenButton!: HTMLElement;
  private shareButton?: HTMLElement;

  constructor(options: FakeDiscordOptions = {}) {
    this.options = options;
    this.connected = options.connected ?? true;
    this.muted = options.muted ?? false;
    this.deafened = options.deafened ?? false;
    this.sharing = options.sharing ?? false;
    this.mount();
    document.addEventListener("keydown", this.onKeyDown);
  }

  dispose() {
    document.removeEventListener("keydown", this.onKeyDown);
    document.body.innerHTML = "";
  }

  private readonly onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      this.escapePressed++;
      this.dialog()?.remove();
    }
  };

  dialog() {
    return document.querySelector<HTMLElement>('[role="dialog"]');
  }

  private mount() {
    document.body.innerHTML = "";
    document.body.append(this.channelList(), this.userPanel());
  }

  private channelList() {
    const channels = this.options.channels ?? [{ name: "General", members: [this.options.userName ?? "micoli"] }];
    const items = channels.map(({ name, label, members }, index) => {
      const voiceUsers = members.map((member) => {
        const { name: memberName, status, avatarUrl } = typeof member === "string" ? { name: member } : member;
        const ariaLabel = status ? `${memberName}, ${status}` : memberName;
        const avatar = avatarUrl ? ` style="background-image: url(&quot;${avatarUrl}&quot;);"` : "";
        return `<div class="draggable__55bab"><div class="voiceUser__07f91 clickable__07f91">
          <div class="focusTarget__54e4b" aria-label="${escape(ariaLabel)}" role="button"></div>
          <div class="content__07f91"><div class="userAvatar__55bab avatar__07f91"${avatar}></div>
          <div class="usernameFont__07f91 username__07f91">${memberName}</div></div></div></div>`;
      });
      return `<li class="containerDefault_c69b6d">
        <a data-list-item-id="channels___${index}" aria-label="${escape(label ?? `${name} (salon vocal)`)}"></a>
        <div class="list_c3cd7d" role="group">${voiceUsers.join("")}</div></li>`;
    });
    return element(`<ul aria-label="Salons">${items.join("")}</ul>`);
  }

  private userPanel() {
    const [camera, share, activity] = this.options.tooltips ?? [
      "Allumer la caméra",
      "Partage ton écran",
      "Commencer une activité",
    ];
    const panel = element(`<section class="panels__5e434">
      <div class="nameTag__37e49"><div class="panelTitleContainer__37e49">
        <div class="text-md/medium_cf4812 title_b6c092">${this.options.userName ?? "micoli"} </div></div></div>
      <button role="switch" aria-label="Rendre muet" aria-checked="${this.muted}"></button>
      <button role="switch" aria-label="Mettre en sourdine" aria-checked="${this.deafened}"></button>
    </section>`);
    this.muteButton = panel.querySelector('[aria-label="Rendre muet"]') as HTMLElement;
    this.deafenButton = panel.querySelector('[aria-label="Mettre en sourdine"]') as HTMLElement;
    this.muteButton.addEventListener("click", () => this.setMuted(!this.muted));
    this.deafenButton.addEventListener("click", () => this.setDeafened(!this.deafened));

    if (this.connected) {
      const actions = element(`<div class="actionButtons_e131a9">
        <button aria-describedby="tooltip-camera" aria-pressed="false"></button>
        <button aria-describedby="tooltip-share" aria-pressed="${this.sharing}"></button>
        <button aria-describedby="tooltip-activity"></button></div>`);
      this.shareButton = actions.children[1] as HTMLElement;
      this.shareButton.addEventListener("click", () => this.openPicker());
      panel.append(actions);
      document.body.append(
        element(`<div id="tooltip-camera">${camera}</div>`),
        element(`<div id="tooltip-share">${share}</div>`),
        element(`<div id="tooltip-activity">${activity}</div>`),
      );
      if (this.sharing) {
        panel.append(this.stopButton());
      }
    }
    return panel;
  }

  private setMuted(muted: boolean) {
    this.muted = muted;
    this.muteButton.setAttribute("aria-checked", String(muted));
  }

  // Discord mutes the microphone too while deafened
  private setDeafened(deafened: boolean) {
    this.deafened = deafened;
    this.deafenButton.setAttribute("aria-checked", String(deafened));
    this.setMuted(deafened);
  }

  private stopButton() {
    const button = element(`<button aria-label="Arrêter de streamer"></button>`);
    button.addEventListener("click", () => {
      this.sharing = false;
      this.shareButton?.setAttribute("aria-pressed", "false");
      button.remove();
    });
    return button;
  }

  private openPicker() {
    if (this.sharing) {
      return;
    }
    const dialog = element(`<div role="dialog">
      <div role="tab" aria-selected="true">Applications</div>
      <div role="tab" aria-selected="false">Écran entier</div>
      <div role="tab" aria-selected="false">Appareils</div></div>`);
    const tabs = Array.from(dialog.querySelectorAll('[role="tab"]'));
    tabs.forEach((tab) =>
      tab.addEventListener("click", () => {
        tabs.forEach((other) => other.setAttribute("aria-selected", String(other === tab)));
        if (tab === tabs[1]) {
          setTimeout(() => this.addScreens(dialog), PICKER_DELAY_MS);
        }
      }),
    );
    setTimeout(() => document.body.append(dialog), PICKER_DELAY_MS);
  }

  private addScreens(dialog: HTMLElement) {
    for (let index = 1; index <= (this.options.screens ?? 1); index++) {
      const tile = element(`<div class="source__2f580" role="button">Écran ${index}</div>`);
      tile.addEventListener("click", () => {
        this.sharing = true;
        this.sharedScreen = index;
        this.shareButton?.setAttribute("aria-pressed", "true");
        this.shareButton?.parentElement?.after(this.stopButton());
        dialog.remove();
      });
      dialog.append(tile);
    }
  }
}
