import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Resvg } from "@resvg/resvg-js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, "public", "media");
const regular = "/usr/share/fonts/truetype/noto/NotoSans-Regular.ttf";
const bold = "/usr/share/fonts/truetype/noto/NotoSans-Bold.ttf";

const items = [
  item("nodi-hoops", "Fashion accessories", "Nakshi hoops", "a drawn pair", "Nodi Atelier", "hoops", ["#F8E6CF", "#E7A98A"], "#9C3F1E", "#243E73", 12),
  item("nodi-scarf", "Fashion accessories", "Indigo scarf", "flowing bands", "Nodi Atelier", "scarf", ["#E7EEF8", "#B9C7E6"], "#243E73", "#E6A317", 10),
  item("nodi-cuff", "Fashion accessories", "River brass cuff", "line motif", "Nodi Atelier", "cuff", ["#F6E2C8", "#E2B07A"], "#9C3F1E", "#114F4C", 11),
  item("basha-bottle", "Home and kitchen", "Copper bottle", "cloth loop", "Basha and Bati", "bottle", ["#F8D7C4", "#D9845A"], "#9C3F1E", "#E6A317", 12),
  item("basha-cushion", "Home and kitchen", "Kantha cushion", "diamond stitch", "Basha and Bati", "cushion", ["#F8E7B8", "#E2C56A"], "#9C3F1E", "#FFF8F1", 9),
  item("basha-jars", "Home and kitchen", "Clay spice jars", "four pots", "Basha and Bati", "jars", ["#F3D2BF", "#C98462"], "#8A4B2F", "#114F4C", 10),
  item("rong-soap", "Beauty and care", "Neem soap bar", "leaf stamp", "Rong Ghor", "soap", ["#E5F3EE", "#F7D6D0"], "#114F4C", "#2F6B45", 0),
  item("rong-oil", "Beauty and care", "Mustard hair oil", "small bottle", "Rong Ghor", "oil", ["#F8E7C4", "#E3C56A"], "#8A5A10", "#2F6B45", 12),
  item("rong-mist", "Beauty and care", "Rosewater mist", "spray drawing", "Rong Ghor", "mist", ["#F8E0E6", "#E7B7C4"], "#8D3B4E", "#F2C1CC", 8),
  item("mobile-sling", "Phone accessories", "Woven phone sling", "teal strap", "Mobile Haat BD", "sling", ["#D9EFEB", "#F4E7D4"], "#114F4C", "#E6A317", 11),
  item("mobile-glass", "Phone accessories", "Screen glass", "shine only", "Mobile Haat BD", "glass", ["#E4F2F4", "#C5DDE4"], "#1C1612", "#7FB7C9", 9),
  item("mobile-cable", "Phone accessories", "Braided cable", "one metre", "Mobile Haat BD", "cable", ["#F7E6D4", "#E7C3A1"], "#9C3F1E", "#114F4C", 10),
  item("mobile-stand", "Phone accessories", "Bamboo phone stand", "cradle", "Mobile Haat BD", "stand", ["#F3E6CF", "#D8C09A"], "#8A5A10", "#2F6B45", 8),
  item("tarit-speaker", "Electronics", "Mini speaker", "circle grille", "Tarit Electronics", "speaker", ["#E4E7F4", "#C5C8DE"], "#243E73", "#E6A317", 14),
  item("tarit-lamp", "Electronics", "Warm desk lamp", "shade and base", "Tarit Electronics", "lamp", ["#F8E6C8", "#F0C48A"], "#9C3F1E", "#E6A317", 12),
  item("tarit-ring", "Electronics", "Clip ring light", "round frame", "Tarit Electronics", "ring", ["#E7EEF8", "#F8E7C8"], "#243E73", "#1C1612", 10),
  item("meghna-pin", "Fashion accessories", "Lapel pin", "jamdani diamond", "Meghna Stitch", "pin", ["#F8E4EE", "#E4C4D4"], "#8D3B4E", "#243E73", 9),
  item("rong-balm", "Beauty and care", "Coconut lip balm", "small tin", "Rong Ghor", "balm", ["#F8F0E4", "#E7D3B8"], "#8A5A10", "#FFF8F1", 8),
  item("quickplug-charger", "Phone accessories", "Sample charger", "block drawing", "QuickPlug Corner", "charger", ["#E7E4F2", "#D5D0E4"], "#243E73", "#9C3F1E", 7),
];

await mkdir(outDir, { recursive: true });

for (const entry of items) {
  const png = render(entry);
  await writeFile(path.join(outDir, `${entry.id}.png`), png);
  console.log(`png ${entry.id}`);
}

const videos = items.filter((entry) => entry.seconds > 0);
let cursor = 0;
async function worker() {
  while (cursor < videos.length) {
    const entry = videos[cursor];
    cursor += 1;
    await encode(entry);
    console.log(`mp4 ${entry.id} ${entry.seconds}s`);
  }
}
await Promise.all([worker(), worker(), worker()]);
console.log("media ready");

function item(id, category, title, subtitle, seller, glyph, colors, accent, second, seconds) {
  return { id, category, title, subtitle, seller, glyph, colors, accent, second, seconds };
}

function render(entry) {
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="720" height="1280" viewBox="0 0 720 1280">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${entry.colors[0]}"/>
      <stop offset="1" stop-color="${entry.colors[1]}"/>
    </linearGradient>
    <pattern id="weave" width="28" height="28" patternUnits="userSpaceOnUse">
      <path d="M14 0 L28 14 L14 28 L0 14 Z" fill="none" stroke="#1C1612" stroke-opacity="0.16" stroke-width="1"/>
    </pattern>
  </defs>
  <rect width="720" height="1280" fill="url(#bg)"/>
  <rect width="720" height="1280" fill="url(#weave)"/>
  <text x="360" y="118" text-anchor="middle" fill="#1C1612" font-family="Noto Sans" font-size="22" font-weight="700" letter-spacing="3">ONLINE MARKET DEMO</text>
  <text x="360" y="164" text-anchor="middle" fill="#1C1612" font-family="Noto Sans" font-size="28">${escapeXml(entry.category)}</text>
  <circle cx="360" cy="470" r="214" fill="#FFF8F1"/>
  <circle cx="360" cy="470" r="214" fill="none" stroke="#1C1612" stroke-width="4"/>
  <circle cx="360" cy="470" r="230" fill="none" stroke="#1C1612" stroke-width="1.5" stroke-dasharray="2 10"/>
  <g transform="translate(360 470)">${glyph(entry.glyph, entry.accent, entry.second)}</g>
  <rect x="48" y="760" width="624" height="430" rx="36" fill="#FFF8F1"/>
  <text x="360" y="840" text-anchor="middle" fill="${entry.accent}" font-family="Noto Sans" font-size="22" font-weight="700" letter-spacing="2">DEMO ILLUSTRATION</text>
  <text x="360" y="920" text-anchor="middle" fill="#1C1612" font-family="Noto Sans" font-size="52" font-weight="700">${escapeXml(entry.title)}</text>
  <text x="360" y="990" text-anchor="middle" fill="#5C5148" font-family="Noto Sans" font-size="32">${escapeXml(entry.subtitle)}</text>
  <text x="360" y="1070" text-anchor="middle" fill="#1C1612" font-family="Noto Sans" font-size="26">${escapeXml(entry.seller)}</text>
  <text x="360" y="1130" text-anchor="middle" fill="#5C5148" font-family="Noto Sans" font-size="24">Not a photograph of a product</text>
</svg>`;
  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: 720 },
    font: { fontFiles: [regular, bold], loadSystemFonts: false, defaultFontFamily: "Noto Sans" },
  });
  return resvg.render().asPng();
}

function encode(entry) {
  const frames = entry.seconds * 12;
  const motion = motionFor(entry.id, frames);
  const png = path.join(outDir, `${entry.id}.png`);
  const mp4 = path.join(outDir, `${entry.id}.mp4`);
  return run("ffmpeg", [
    "-y",
    "-i",
    png,
    "-vf",
    `zoompan=${motion}:d=${frames}:s=480x854:fps=12,format=yuv420p`,
    "-c:v",
    "libx264",
    "-pix_fmt",
    "yuv420p",
    "-preset",
    "veryfast",
    "-crf",
    "32",
    "-movflags",
    "+faststart",
    "-an",
    mp4,
  ]);
}

function motionFor(id, frames) {
  const kind = [...id].reduce((sum, char) => sum + char.charCodeAt(0), 0) % 3;
  if (kind === 0) return "z='min(1.08,1+0.0007*on)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)'";
  if (kind === 1) return `z='1.08':x='(iw-iw/zoom)*on/${frames}':y='ih/2-(ih/zoom/2)'`;
  return `z='1.06':x='iw/2-(iw/zoom/2)':y='(ih-ih/zoom)*on/${frames}'`;
}

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ["ignore", "ignore", "pipe"] });
    let err = "";
    child.stderr.on("data", (chunk) => {
      err += chunk.toString();
    });
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} exited ${code}\n${err.slice(-800)}`));
    });
  });
}

function escapeXml(value) {
  return value.replace(/[&<>]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[char]);
}

function glyph(name, accent, second) {
  const stroke = `fill="none" stroke="${accent}" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"`;
  switch (name) {
    case "hoops":
      return `<circle cx="-52" cy="16" r="48" ${stroke}/><circle cx="52" cy="16" r="48" ${stroke}/><path d="M-52 -32 v-36 M52 -32 v-36" ${stroke}/><circle cx="-52" cy="16" r="10" fill="${second}"/><circle cx="52" cy="16" r="10" fill="${second}"/>`;
    case "scarf":
      return `<path d="M-130 -30 C-40 -110 30 10 140 -70" fill="none" stroke="${accent}" stroke-width="34" stroke-linecap="round"/><path d="M-120 36 C-20 -10 40 90 130 16" fill="none" stroke="${second}" stroke-width="20" stroke-linecap="round"/>`;
    case "cuff":
      return `<ellipse cx="0" cy="0" rx="112" ry="52" ${stroke}/><path d="M-78 0 Q-39 -34 0 0 T78 0" fill="none" stroke="${second}" stroke-width="8" stroke-linecap="round"/>`;
    case "bottle":
      return `<rect x="-48" y="-8" width="96" height="132" rx="30" fill="${accent}"/><rect x="-16" y="-78" width="32" height="74" rx="8" fill="${second}"/><rect x="-30" y="-98" width="60" height="24" rx="7" fill="#1C1612"/><path d="M-18 78 h36" fill="none" stroke="#FFF8F1" stroke-width="8" stroke-linecap="round"/>`;
    case "cushion":
      return `<rect x="-108" y="-82" width="216" height="164" rx="24" fill="${accent}"/><path d="M0 -82 V82 M-108 0 H108" stroke="${second}" stroke-width="5"/><circle r="16" fill="${second}"/>`;
    case "jars":
      return [-90, -30, 30, 90]
        .map((x, index) => `<rect x="${x - 24}" y="${index % 2 === 0 ? -20 : 0}" width="48" height="86" rx="16" fill="${index % 2 ? second : accent}"/><rect x="${x - 16}" y="${index % 2 === 0 ? -38 : -18}" width="32" height="16" rx="4" fill="#1C1612"/>`)
        .join("");
    case "soap":
      return `<rect x="-100" y="-58" width="200" height="116" rx="24" fill="#FFF8F1" stroke="${accent}" stroke-width="8"/><path d="M-16 -8 C0 -48 28 -40 34 -4" fill="none" stroke="${second}" stroke-width="8" stroke-linecap="round"/><path d="M34 -4 C48 8 20 28 4 16" fill="${second}"/>`;
    case "oil":
      return `<rect x="-42" y="-10" width="84" height="120" rx="28" fill="${accent}"/><rect x="-14" y="-70" width="28" height="64" rx="8" fill="${second}"/><circle cy="-92" r="16" fill="${second}"/><path d="M0 -128 C18 -104 18 -86 0 -74 C-18 -86 -18 -104 0 -128" fill="${accent}"/>`;
    case "mist":
      return `<rect x="-46" y="-20" width="92" height="130" rx="28" fill="${accent}"/><rect x="-18" y="-70" width="36" height="52" rx="10" fill="${second}"/><circle cx="-70" cy="-80" r="8" fill="${accent}"/><circle cx="74" cy="-96" r="6" fill="${accent}"/><circle cx="86" cy="-60" r="10" fill="${second}"/>`;
    case "sling":
      return `<rect x="-46" y="-70" width="92" height="150" rx="16" fill="#1C1612"/><rect x="-34" y="-52" width="68" height="100" rx="8" fill="${second}"/><path d="M-80 120 C-120 -20 -20 -150 70 -120" fill="none" stroke="${accent}" stroke-width="16" stroke-linecap="round"/>`;
    case "glass":
      return `<rect x="-70" y="-120" width="140" height="230" rx="22" fill="none" stroke="${accent}" stroke-width="12"/><path d="M-40 -70 L50 40" stroke="${second}" stroke-width="14" stroke-linecap="round"/><rect x="-24" y="86" width="48" height="8" rx="3" fill="${accent}"/>`;
    case "cable":
      return `<path d="M-20 -110 C70 -110 70 -40 -10 -40 C-90 -40 -90 30 -10 30 C70 30 70 100 -20 100" fill="none" stroke="${accent}" stroke-width="16" stroke-linecap="round"/><rect x="-36" y="-132" width="32" height="28" rx="6" fill="${second}"/><rect x="-8" y="96" width="32" height="28" rx="6" fill="${second}"/>`;
    case "stand":
      return `<path d="M-90 90 L0 -80 L90 90 Z" fill="none" stroke="${accent}" stroke-width="12" stroke-linejoin="round"/><path d="M-48 40 H48" stroke="${second}" stroke-width="12" stroke-linecap="round"/><rect x="-28" y="-18" width="56" height="36" rx="6" fill="${accent}"/>`;
    case "speaker":
      return `<rect x="-90" y="-90" width="180" height="180" rx="36" fill="${accent}"/><circle r="48" fill="none" stroke="#FFF8F1" stroke-width="10"/><circle r="16" fill="${second}"/><rect x="-70" y="108" width="36" height="12" rx="4" fill="#1C1612"/><rect x="34" y="108" width="36" height="12" rx="4" fill="#1C1612"/>`;
    case "lamp":
      return `<path d="M-70 -20 H70 L48 -90 H-48 Z" fill="${accent}"/><rect x="-8" y="-20" width="16" height="90" fill="#1C1612"/><rect x="-54" y="70" width="108" height="16" rx="6" fill="${second}"/><circle cy="-120" r="10" fill="${second}"/>`;
    case "ring":
      return `<circle r="78" fill="none" stroke="${accent}" stroke-width="16"/><circle r="48" fill="none" stroke="${second}" stroke-width="8"/><path d="M-28 96 H28 L18 132 H-18 Z" fill="${accent}"/>`;
    case "pin":
      return `<circle r="72" fill="${accent}"/><path d="M0 -40 L28 0 L0 40 L-28 0 Z" fill="${second}"/><path d="M0 72 V130" stroke="#1C1612" stroke-width="8" stroke-linecap="round"/>`;
    case "balm":
      return `<ellipse cx="0" cy="20" rx="90" ry="36" fill="${accent}"/><rect x="-90" y="-24" width="180" height="48" fill="${accent}"/><ellipse cx="0" cy="-24" rx="90" ry="36" fill="${second}"/><ellipse cx="0" cy="-24" rx="50" ry="18" fill="#FFF8F1"/>`;
    case "charger":
      return `<rect x="-70" y="-70" width="140" height="150" rx="18" fill="${accent}"/><rect x="-22" y="-110" width="16" height="40" rx="3" fill="#1C1612"/><rect x="8" y="-110" width="16" height="40" rx="3" fill="#1C1612"/><circle cy="20" r="22" fill="${second}"/>`;
    default:
      return `<circle r="50" fill="${accent}"/>`;
  }
}
