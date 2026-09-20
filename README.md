# Raycast Discord commands and menu bar

[![CI](https://github.com/micoli/raycast-discord-menu/actions/workflows/ci.yml/badge.svg)](https://github.com/micoli/raycast-discord-menu/actions/workflows/ci.yml)

Control the Discord desktop app from Raycast: share one of your screens, mute / deafen, see who is in your voice
channel, launch or stop Discord. A menu bar item shows the live state of your voice session in its icon.

Tested on macOS.

![Menu bar menu](assets/img_1.png)
![Raycast commands](assets/img_2.png)

## Features

- **Menu bar item** with a dynamic icon and a menu whose items are enabled or disabled according to the Discord state.
- **Commands** to stream a screen, mute, deafen, list the voice members and start or stop Discord.
- **Near real time**: a state change made in Discord (or from Raycast) reaches the menu bar in about 0.6 seconds.

### Menu bar icon

The icon is a 2x2 grid:

|                                                          |                                                                               |
| -------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Discord logo, replaced by a green screen while you share | Microphone, red and crossed when muted                                        |
| Headset, red and crossed when deafened                   | Number of people in your voice channel (`-` when not connected, `9+` above 9) |

The icon is grayed out when Discord cannot be reached.

### Menu bar menu

| Item                                                                                     | Enabled when                                         |
| ---------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| Stream screen 1 / 2                                                                      | you are connected to a voice channel and not sharing |
| Stop Stream                                                                              | you are sharing                                      |
| Mute / Unmute                                                                            | you are not muted / you are muted                    |
| Deafen / Undeafen                                                                        | you are not deafened / you are deafened              |
| Toggle Microphone / Toggle Speaker                                                       | always                                               |
| Launch Discord (_Relaunch Discord with debugger_ when Discord runs without the debugger) | Discord is not reachable through the debugger        |
| Stop Discord                                                                             | Discord is running                                   |

The menu also lists the members of your current voice channel, with an _Open live members list_ item.

### Commands

| Command                             | Description                                                                      |
| ----------------------------------- | -------------------------------------------------------------------------------- |
| Stream Screen 1 / 2                 | Start sharing the first / second screen (does nothing if you already share)      |
| Stop Stream                         | Stop sharing (does nothing if you do not share)                                  |
| Mute Microphone / Unmute Microphone | Set the microphone state (does nothing if already in that state)                 |
| Deafen / Undeafen                   | Set the headset state. Discord also mutes the microphone while deafened          |
| Toggle Microphone / Toggle Speaker  | Switch the state                                                                 |
| Voice Members                       | Who is in your voice channel, refreshed every 2 seconds while the window is open |
| Launch Discord                      | Start Discord with the debugger, or relaunch it if it runs without               |
| Stop Discord                        | Quit Discord                                                                     |
| Commands Menu                       | The menu bar item                                                                |

## Requirements

- macOS, Raycast and the Discord desktop app installed in `/Applications/Discord.app`.
- Node.js and npm to build the extension.
- The Discord interface language must be **French**: the buttons are found through their French labels
  (`src/injected/aria-labels.ts`).
- The macOS `Screen & System Audio Recording` permission for Discord, otherwise the screen picker of Discord is empty.
  Restart Discord after granting it.

## Installation

```
cd ~/src
git clone https://github.com/micoli/raycast-discord-menu
cd raycast-discord-menu
npm install && npm run dev
```

Keep `npm run dev` running: the menu bar item of a development extension disappears when it stops.

## Usage

Raycast talks to Discord through the remote debugging port of the app (`5656`), so Discord must be started with it.
Use the **Launch Discord** command or menu item, which also relaunches Discord when it already runs without the
debugger. You can also start it yourself:

```
open -a Discord --args --remote-debugging-port=5656 --remote-allow-origins=*
```

There is nothing to install in Discord by hand: the commands inject and update their script on their own, also after
Discord reloads.

## How it works

```
Raycast commands / menu bar ──▶ devtools protocol (WebSocket, port 5656) ──▶ script injected in Discord
                                                                             (document.discordExecutor)
Detached watcher process ◀── devtools binding ◀── the script reports state changes
        └── open -g raycast://extensions/…/ddiscord-menu?launchType=background ──▶ menu bar refresh
```

- **Commands** (`src/util.ts`) open a short devtools session, make sure the script is injected (its version is compared
  with the bundle), and send it a message. The script clicks the Discord buttons and reads the state from the DOM
  (`src/injected/`).
- **State** (`getState`): connected, muted, deafened, sharing and the voice channel members. The menu reads it once per
  run and caches the last value in the Raycast cache, so it renders instantly.
- **Refresh**: an observer in the page detects DOM changes and calls a devtools binding. A small detached process
  (`assets/discord-watcher.js`, started on demand by the extension with the Node bundled in Raycast) receives the call
  and opens the menu deeplink with `open -g`. Opening it from the page instead would bring Raycast to the front, steal
  the focus and close the menu on the first click. The `interval` of the menu bar command (1 minute) is only a fallback.

## Development

| Script                              | Description                                                                                                                            |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run dev`                       | Build the injected script and the watcher, then start `ray develop`                                                                    |
| `npm run build`                     | Same, then `ray build`                                                                                                                 |
| `npm run build-inject`              | Build `assets/discordExecutor.js` (vite) and `assets/discord-watcher.js` (esbuild)                                                     |
| `npm run build-icons`               | Regenerate the menu bar icons in `assets/menu-icons` (needs `rsvg-convert`, `brew install librsvg`, `STROKE_WIDTH` sets the thickness) |
| `npm run lint` / `npm run fix-lint` | Lint the extension                                                                                                                     |
| `npm run typecheck`                 | Type check the sources and the tests                                                                                                   |
| `npm test` / `npm run test:watch`   | Run the tests once / on every change                                                                                                   |

The compiled bundles and the icons are committed, rebuild them after changing `src/injected/`, `src/watcher/` or
`scripts/build-menu-icons.mjs`.

Things worth knowing:

- `ray develop` copies `assets/` only when it starts: restart `npm run dev` after changing an asset.
- When Discord changes its DOM, look at `src/injected/discord-dom.ts` (selectors) and `src/injected/aria-labels.ts`
  (labels). The class names are hashed, so the selectors rely on stable prefixes, ARIA attributes and tooltips.
- Raycast never unmounts menu bar commands: a polling loop in the menu would live forever. The menu reads the state once
  and the watcher pushes the changes.

## Tests and CI

`npm test` runs [Vitest](https://vitest.dev) without Raycast nor Discord:

- **The injected script** runs in jsdom against a fake Discord (`tests/fixtures/fake-discord.ts`) that reproduces the
  DOM the extension relies on and reacts to clicks like Discord: state reading, mute, deafen, screen share, member
  list, the state watcher. When Discord changes its DOM, update the fake and the tests tell what to fix in the script.
- **The devtools client** (`src/util.ts`) talks to a fake devtools server: injection, versioning, errors.
- **The watcher process** is the built `assets/discord-watcher.js`, started for real against a fake Discord and a fake
  `open` command.
- The menu icon names match the PNG files of `assets/menu-icons`.

The GitHub Actions workflow (`.github/workflows/ci.yml`) runs on macOS, the only platform of the Raycast CLI: types,
lint, tests, a check that the committed bundles match their sources (run `npm run build-inject` when it fails) and
`ray build`.

## Troubleshooting

- **"Discord not reachable"** (HUD or grayed icon): Discord runs without the debugger or is not running, use
  **Launch Discord**.
- **The screen list is empty**: grant the screen recording permission to Discord and restart it.
- **The menu icon does not follow the state**: the watcher log is `watcher.log` in the extension support folder
  (`~/Library/Application Support/com.raycast.macos/extensions/raycast-discord-menu/`). Without the watcher, the menu is
  refreshed every minute.

## Disclaimer

This extension drives the Discord client through its debugging port and its DOM, which are not a supported API: a
Discord update can break it, and modifying the client may go against its terms of service. Use it at your own risk.
