"use client";

import { useActionState, useState } from "react";
import { createListing } from "@/app/actions/commerce";
import { assessVideoDuration } from "@/lib/market";
import type { ActionResult } from "@/lib/commerce/types";
import { CATEGORIES } from "@/lib/market";

const initial: ActionResult | null = null;

export function ListingEditor() {
  const [state, action, pending] = useActionState(createListing, initial);
  const [duration, setDuration] = useState<number | null>(null);
  const [hasVideo, setHasVideo] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const assessment = hasVideo ? assessVideoDuration(duration ?? Number.NaN) : null;

  return (
    <form action={action} className="stack">
      <label className="field">
        <span>Title</span>
        <input name="title" required maxLength={80} />
      </label>
      <label className="field">
        <span>Category</span>
        <select name="category" defaultValue="fashion">
          {CATEGORIES.map((category) => (
            <option key={category.id} value={category.id}>
              {category.label}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>Price in taka</span>
        <input name="price" inputMode="numeric" required />
      </label>
      <label className="field">
        <span>Stock</span>
        <input name="stock" inputMode="numeric" required defaultValue="1" />
      </label>
      <label className="field">
        <span>Description</span>
        <textarea name="description" required minLength={10} maxLength={800} />
      </label>
      <label className="field">
        <span>Product clip</span>
        <input
          type="file"
          accept="video/mp4,video/webm"
          onChange={(event) => {
            const file = event.target.files?.[0];
            setHasVideo(Boolean(file));
            setDuration(null);
            setPreviewUrl(file ? URL.createObjectURL(file) : null);
          }}
        />
        <span className="help">Optional. 15 seconds is recommended and 30 seconds is the maximum. The file is not stored until product storage is configured, so this form saves the listing text only.</span>
        {assessment ? <span className={assessment.ok ? "good" : "error"}>{assessment.message}</span> : null}
      </label>
      {previewUrl ? <video className="preview-video" src={previewUrl} controls muted playsInline onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)} /> : null}
      <input type="hidden" name="hasVideo" value={hasVideo && assessment?.ok ? "true" : "false"} />
      <input type="hidden" name="durationSec" value={duration ?? ""} />
      {hasVideo && assessment && !assessment.ok ? <p className="error">Remove the clip or choose a shorter file before saving.</p> : null}
      {state ? <p className={state.ok ? "good" : "error"}>{state.message}</p> : null}
      <button className="btn" type="submit" disabled={pending || Boolean(assessment && !assessment.ok)}>
        Save pending listing
      </button>
    </form>
  );
}
