# Demo media

The pictures and clips in `public/media` are original illustrations made for this prototype. They are not photographs of the named products, and they are not stock footage.

## What they are

`scripts/make-media.mjs` draws an SVG for each sample listing, rasterizes it to PNG with `@resvg/resvg-js`, and, where a clip exists, encodes a silent MP4 with ffmpeg. The motion is a slow zoom or pan of that same illustration. Every frame is labelled "DEMO ILLUSTRATION" and "Not a photograph of a product".

`rong-soap` is poster only, so the beauty stall has a graceful fallback with no video element.

Seed clips are 7 to 14 seconds. None is longer than the 15 second recommendation. `tests/media.test.ts` checks the files with ffprobe.

`public/media/silent-demo.vtt` is a description track: the clips have no speech.

## Licenses

- Illustrations, PNG files, and MP4 files: original work created for this repository. No third-party stock photo or stock video is included.
- Poster text is set in Noto Sans, which is licensed under the SIL Open Font License 1.1. The font files are not redistributed. Only the rasterized glyphs appear in the images.
- Interface fonts loaded by Next.js at build time, then self-hosted: Fraunces, Outfit, and Noto Sans Bengali. All three are SIL Open Font License 1.1.
- Application code dependencies: Next.js, React, and React DOM are MIT licensed.

Regenerating the media needs ffmpeg, the Noto Sans files used by the script, and `npm install` so `@resvg/resvg-js` is present. The committed files are what the app serves. You do not need to regenerate them to run the demo.
