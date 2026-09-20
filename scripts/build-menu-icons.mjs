// Composes the menu bar icons on a 2x2 grid: discord logo (screen share icon while sharing), microphone, sound, member count.
// Requires rsvg-convert (brew install librsvg). The generated PNGs are committed, run this only to change the design.
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const CANVAS = 64;
const CELL = CANVAS / 2;
const PADDING = 2;
const CONTENT = CELL - PADDING * 2;
const OUTPUT_DIR = path.resolve(process.env.OUTPUT_DIR ?? "assets/menu-icons");

// [row, column] of each element in the grid
const GRID = { logo: [0, 0], microphone: [0, 1], sound: [1, 0], count: [1, 1] };

const RED = "#ff453a";
const GREEN = "#30d158";
// One neutral gray readable on both light and dark menu bars (the menu bar look depends on the wallpaper)
const BASE_COLOR = process.env.BASE_COLOR ?? "#77777c";
const OFFLINE_OPACITY = 0.35;
const MAX_DISPLAYED_COUNT = 9;

const LOGO_BASE64 = fs.readFileSync(path.resolve("assets/discord_1.png")).toString("base64");

const shapes = {
  microphone: `<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>`,
  sound: `<path d="M4 15v-3a8 8 0 0 1 16 0v3"/><rect x="3" y="14" width="4" height="6" rx="1.5"/><rect x="17" y="14" width="4" height="6" rx="1.5"/>`,
  screen: `<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>`,
};
const slash = `<path d="M3 3L21 21"/>`;

const place = (name, content) => {
  const [row, column] = GRID[name];
  return `<g transform="translate(${column * CELL + PADDING} ${row * CELL + PADDING})">${content}</g>`;
};

const glyph = (shape, { color, opacity = 1, crossed = false, filled = false }) =>
  `<g transform="scale(${CONTENT / 24})" stroke="${color}" stroke-opacity="${opacity}" fill="${filled ? color : "none"}" fill-opacity="${filled ? 0.25 : 0}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${shapes[shape]}${crossed ? slash : ""}</g>`;

const logo = (opacity) =>
  `<image width="${CONTENT}" height="${CONTENT}" opacity="${opacity}" href="data:image/png;base64,${LOGO_BASE64}"/>`;

const countLabel = (count, opacity) => {
  if (count === "none") {
    return `<path d="M8 14h12" stroke="${BASE_COLOR}" stroke-opacity="${opacity}" stroke-width="3" stroke-linecap="round"/>`;
  }
  const text = count === "many" ? `${MAX_DISPLAYED_COUNT}+` : count;
  const fontSize = text.length > 1 ? 19 : 26;
  const baseline = text.length > 1 ? 21 : 23;
  return `<text x="${CONTENT / 2}" y="${baseline}" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-size="${fontSize}" font-weight="700" text-anchor="middle" fill="${BASE_COLOR}" fill-opacity="${opacity}">${text}</text>`;
};

const render = (name, { muted = false, deafened = false, sharing = false, count = "none", offline = false }) => {
  const dim = offline ? OFFLINE_OPACITY : 1;
  const cells = [
    place("logo", sharing ? glyph("screen", { color: GREEN, filled: true }) : logo(dim)),
    place(
      "microphone",
      glyph("microphone", muted ? { color: RED, crossed: true } : { color: BASE_COLOR, opacity: dim }),
    ),
    place("sound", glyph("sound", deafened ? { color: RED, crossed: true } : { color: BASE_COLOR, opacity: dim })),
    place("count", countLabel(count, dim)),
  ];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${CANVAS}" height="${CANVAS}" viewBox="0 0 ${CANVAS} ${CANVAS}">${cells.join("")}</svg>`;
  const target = path.join(OUTPUT_DIR, `${name}.png`);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  execFileSync("rsvg-convert", ["-w", String(CANVAS), "-h", String(CANVAS), "-o", target], { input: svg });
};

const flag = (value) => (value ? "1" : "0");
const counts = ["none", ...Array.from({ length: MAX_DISPLAYED_COUNT }, (_, index) => String(index + 1)), "many"];

fs.rmSync(OUTPUT_DIR, { recursive: true, force: true });
for (let bits = 0; bits < 8; bits++) {
  const [muted, deafened, sharing] = [bits & 4, bits & 2, bits & 1].map(Boolean);
  for (const count of counts) {
    render(`${flag(muted)}${flag(deafened)}${flag(sharing)}-${count}`, { muted, deafened, sharing, count });
  }
}
render("offline", { offline: true });
console.log(`Menu icons written to ${OUTPUT_DIR}`);
