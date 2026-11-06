import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, statSync } from "node:fs";
import test from "node:test";
import { seedState } from "../lib/catalog.ts";

test("seed posters and clips exist, are short, and are not empty", () => {
  const { products } = seedState();
  assert.ok(products.length >= 15);
  for (const product of products) {
    const poster = `public${product.poster}`;
    assert.equal(existsSync(poster), true, poster);
    assert.ok(statSync(poster).size > 1000, poster);
    if (product.video) {
      const video = `public${product.video}`;
      assert.equal(existsSync(video), true, video);
      const raw = execFileSync(
        "ffprobe",
        ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", video],
        { encoding: "utf8" },
      );
      const duration = Number(raw.trim());
      assert.ok(duration > 1 && duration <= 15.25, `${product.id} is ${duration}s`);
      assert.ok(product.durationSec != null && Math.abs(duration - product.durationSec) < 0.45, product.id);
    } else {
      assert.equal(product.durationSec, null);
    }
  }
  assert.equal(existsSync("public/media/silent-demo.vtt"), true);
});
