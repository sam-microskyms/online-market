#!/usr/bin/env python3
"""Download licensed sample photographs and make short portrait motion files.

The motion is a slow move across the photograph. It is not filmed stock.
"""

import subprocess
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "media"
TMP = Path("/tmp/sample-src")
TMP.mkdir(parents=True, exist_ok=True)
UA = {"User-Agent": "OnlineMarketAssetBot/1.0 (sample catalog; local documentation)"}

SOURCES = {
    "hoop": "Hoop Earring MET 68.136.16 EGDP019548.jpg",
    "scarf": "Colored silk scarf from India 04.jpg",
    "bangle": "Bracelet de bénitier 11-o.lau-F123.LA931.jpg",
    "copper": "Copper water bottle.jpg",
    "cushion": "China, 18th century - Cushion Cover - 1934.205.a - Cleveland Museum of Art.jpg",
    "soap": "Aleppo soap 01.jpg",
    "oil": "Rosemary Oil in a bottle and rosemary herb.jpg",
    "cable": "Five USB cables with braided jackets in different colours.jpg",
    "speaker": "Bluetooth speaker NBY-18 P8041745.jpg",
    "lamp": "A desk lamp.jpg",
    "ring": "Digitalização Tridimensional - Iluminação Ring Light.jpg",
    "screen": "Smartphone display screen.jpg",
}

# product id -> (source key, seconds or 0 for poster only, crop hint)
JOBS = {
    "nodi-hoops": ("hoop", 12, "center"),
    "nodi-scarf": ("scarf", 10, "center"),
    "nodi-cuff": ("bangle", 11, "center"),
    "basha-bottle": ("copper", 12, "center"),
    "basha-cushion": ("cushion", 9, "center"),
    "basha-jars": ("spices", 10, "center"),
    "rong-soap": ("soap", 0, "center"),
    "rong-oil": ("oil", 12, "center"),
    "rong-mist": ("oil", 8, "top"),
    "mobile-sling": ("cable", 11, "left"),
    "mobile-glass": ("screen", 9, "center"),
    "mobile-cable": ("cable", 10, "center"),
    "mobile-stand": ("lamp", 8, "center"),
    "tarit-speaker": ("speaker", 14, "left"),
    "tarit-lamp": ("lamp", 12, "center"),
    "tarit-ring": ("ring", 10, "low"),
    "meghna-pin": ("hoop", 9, "center"),
    "rong-balm": ("soap", 8, "center"),
    "quickplug-charger": ("cable", 7, "right"),
}


def download(key: str, title: str) -> Path:
    dest = TMP / f"{key}.jpg"
    if dest.exists() and dest.stat().st_size > 10000:
        return dest
    if key == "spices":
        url = "https://live.staticflickr.com/5036/5886350383_0b6c58a57c_b.jpg"
    else:
        url = "https://commons.wikimedia.org/wiki/Special:FilePath/" + urllib.parse.quote(title) + "?width=1600"
    req = urllib.request.Request(url, headers=UA)
    data = urllib.request.urlopen(req, timeout=90).read()
    dest.write_bytes(data)
    print("got", key, len(data))
    return dest


def crop_expr(hint: str) -> str:
    # 3:4 cover crop. x/y shift keeps the subject in frame.
    if hint == "left":
        xy = "0:(ih-1440)/2"
    elif hint == "right":
        xy = "iw-1080:(ih-1440)/2"
    elif hint == "top":
        xy = "(iw-1080)/2:0"
    elif hint == "low":
        xy = "(iw-1080)/2:ih-1440"
    else:
        xy = "(iw-1080)/2:(ih-1440)/2"
    return f"scale=1080:1440:force_original_aspect_ratio=increase,crop=1080:1440:{xy}"


def run(args: list[str]) -> None:
    subprocess.run(args, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    paths = {key: download(key, title) for key, title in SOURCES.items()}
    paths["spices"] = download("spices", "")
    for product_id, (key, seconds, hint) in JOBS.items():
        poster = OUT / f"{product_id}.jpg"
        run(["ffmpeg", "-y", "-i", str(paths[key]), "-vf", crop_expr(hint), "-q:v", "3", str(poster)])
        print("jpg", product_id)
        if seconds:
            frames = seconds * 12
            video = OUT / f"{product_id}.mp4"
            run([
                "ffmpeg", "-y", "-i", str(poster),
                "-vf",
                f"zoompan=z='min(1.05,1+0.00035*on)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d={frames}:s=720x960:fps=12,format=yuv420p",
                "-c:v", "libx264", "-pix_fmt", "yuv420p", "-preset", "veryfast", "-crf", "30",
                "-movflags", "+faststart", "-an", str(video),
            ])
            print("mp4", product_id, seconds)


if __name__ == "__main__":
    main()
