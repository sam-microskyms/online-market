#!/usr/bin/env python3
"""Compose portrait sample posters from licensed photographs."""

import subprocess
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "media"
TMP = Path("/tmp/catalogue-src")
TMP.mkdir(parents=True, exist_ok=True)
UA = {"User-Agent": "OnlineMarketAssetBot/1.0 (sample catalog documentation)"}

SOURCES = {
    "sunglasses": "Mezmay, Sports sunglasses, Reflective mirrored sunglasses, Russia.jpg",
    "clips": "Haarspangen.jpg",
    "kettle": "Electric water boiler 2014.JPG",
    "bottle": "Stainless Steel Water Bottle.jpg",
    "lipstick": "Lipstick (product).jpg",
    "dropper": "Rosemary Oil in a bottle and rosemary herb.jpg",
    "usbc": "Two USB-C connectors being held.jpg",
    "lamp": "A desk lamp.jpg",
}

# id, source, seconds (0 = photograph only)
JOBS = [
    ("nodi-hoops", "sunglasses", 12),
    ("nodi-scarf", "clips", 10),
    ("basha-bottle", "kettle", 12),
    ("basha-jars", "bottle", 10),
    ("rong-soap", "lipstick", 0),
    ("rong-mist", "dropper", 8),
    ("mobile-cable", "usbc", 10),
    ("tarit-ring", "lamp", 10),
]


def download(key: str, title: str) -> Path:
    dest = TMP / f"{key}.jpg"
    if dest.exists() and dest.stat().st_size > 20000:
        return dest
    url = "https://commons.wikimedia.org/wiki/Special:FilePath/" + urllib.parse.quote(title) + "?width=1600"
    data = urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=90).read()
    dest.write_bytes(data)
    print("got", key, len(data))
    return dest


def run(args: list[str]) -> None:
    subprocess.run(args, check=True)


def main() -> None:
    paths = {key: download(key, title) for key, title in SOURCES.items()}
    contain = "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:color=0xECECEA"
    frames = {
        "sunglasses": "crop=ih*9/16:ih:iw*0.12:0,scale=1080:1920",
        "kettle": "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920",
    }
    for product_id, key, seconds in JOBS:
        poster = OUT / f"{product_id}.jpg"
        run(["ffmpeg", "-y", "-i", str(paths[key]), "-vf", frames.get(key, contain), "-q:v", "3", str(poster)])
        print("jpg", product_id)
        video = OUT / f"{product_id}.mp4"
        if seconds:
            frames = seconds * 12
            run([
                "ffmpeg", "-y", "-i", str(poster),
                "-vf",
                f"zoompan=z='min(1.04,1+0.00025*on)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d={frames}:s=720x1280:fps=12,format=yuv420p",
                "-c:v", "libx264", "-pix_fmt", "yuv420p", "-preset", "veryfast", "-crf", "30",
                "-movflags", "+faststart", "-an", str(video),
            ])
            print("mp4", product_id, seconds)
        elif video.exists():
            video.unlink()


if __name__ == "__main__":
    main()
