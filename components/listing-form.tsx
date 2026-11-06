"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { assessVideoDuration, CATEGORIES, sellerById } from "@/lib/market";
import { setSessionClip } from "@/lib/session-clips";
import { useMarket } from "@/lib/store";

const MAX_BYTES = 40 * 1024 * 1024;

export function ListingForm({ productId }: { productId: string | null }) {
  const { state } = useMarket();
  const existing = productId ? state.products.find((product) => product.id === productId) ?? null : null;
  if (productId && !existing) {
    return (
      <div className="page">
        <h2>Listing not found</h2>
        <Link className="btn" href="/seller">
          Back to the seller desk
        </Link>
      </div>
    );
  }
  const signature = existing
    ? `${existing.title}|${existing.priceBdt}|${existing.stock}|${existing.category}|${existing.claim}|${existing.description}`
    : "new";
  return <ListingFields key={`${productId ?? "new"}:${signature}`} productId={productId} />;
}

function ListingFields({ productId }: { productId: string | null }) {
  const router = useRouter();
  const { state, saveListing } = useMarket();
  const seller = sellerById(state.sellers, state.actingSellerId);
  const existing = productId ? state.products.find((product) => product.id === productId) ?? null : null;
  const [title, setTitle] = useState(existing?.title ?? "");
  const [category, setCategory] = useState<string>(existing?.category ?? "fashion");
  const [priceRaw, setPriceRaw] = useState(existing ? String(existing.priceBdt) : "");
  const [stockRaw, setStockRaw] = useState(existing ? String(existing.stock) : "1");
  const [claim, setClaim] = useState(existing?.claim ?? "");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [reading, setReading] = useState(false);
  const [fileError, setFileError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const savedRef = useRef(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const assessment = file ? assessVideoDuration(duration ?? Number.NaN) : null;

  function onFile(next: File | null) {
    setFileError("");
    setDuration(null);
    if (next && next.size > MAX_BYTES) {
      setFile(null);
      setReading(false);
      setFileError("Choose a clip under 40 MB. The file stays in this tab and is not uploaded.");
      setPreviewUrl((current) => {
        if (current && !savedRef.current) URL.revokeObjectURL(current);
        return null;
      });
      return;
    }
    setFile(next);
    setReading(Boolean(next));
    setPreviewUrl((current) => {
      if (current && !savedRef.current) URL.revokeObjectURL(current);
      return next ? URL.createObjectURL(next) : null;
    });
  }

  if (existing && existing.sellerId !== state.actingSellerId) {
    return (
      <div className="page">
        <h2>This listing belongs to another demo seller</h2>
        <p className="lede">Change the acting seller in the header, or go back to your own desk.</p>
        <Link className="btn" href="/seller">
          Seller desk
        </Link>
      </div>
    );
  }

  return (
    <div className="page">
      <header className="page-intro">
        <p className="eyebrow">{existing ? "Edit demo listing" : "New demo listing"}</p>
        <h2>{existing ? existing.title : "Add a sample product"}</h2>
        <p className="lede">
          Acting as {seller?.name ?? "no seller"}. New listings wait in the admin queue. The clip is previewed here and is not uploaded.
        </p>
      </header>
      {!existing && seller?.status === "rejected" ? (
        <p className="notice">This seller is rejected, so a new listing will not save until an admin approves them.</p>
      ) : null}
      {existing && seller && seller.status !== "active" ? (
        <p className="notice">Buyers cannot see this seller until an admin marks them active.</p>
      ) : null}
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (reading) return;
          if (file && assessment && !assessment.ok) {
            setErrors({ video: assessment.message });
            return;
          }
          const poster = capturePoster(videoRef.current);
          const result = saveListing({
            productId,
            newId: `local-${Date.now().toString(36)}`,
            poster,
            input: {
              title,
              category,
              priceRaw,
              stockRaw,
              claim,
              description,
              hasNewVideo: Boolean(file),
              durationSec: duration,
            },
          });
          if (!result.ok) {
            setErrors(result.errors);
            return;
          }
          if (file && previewUrl) {
            savedRef.current = true;
            setSessionClip(result.productId, previewUrl);
          }
          router.push("/seller");
        }}
      >
        {errors.form ? <p className="error">{errors.form}</p> : null}
        <label className="field">
          <span>Title</span>
          <input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={80} required />
          {errors.title ? <span className="error">{errors.title}</span> : null}
        </label>
        <label className="field">
          <span>Category</span>
          <select value={category} onChange={(event) => setCategory(event.target.value)}>
            {CATEGORIES.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
          {errors.category ? <span className="error">{errors.category}</span> : null}
        </label>
        <label className="field">
          <span>Price in taka</span>
          <input inputMode="numeric" value={priceRaw} onChange={(event) => setPriceRaw(event.target.value)} required />
          {errors.price ? <span className="error">{errors.price}</span> : <span className="help">Whole taka only, for example 890.</span>}
        </label>
        <label className="field">
          <span>Demo stock</span>
          <input inputMode="numeric" value={stockRaw} onChange={(event) => setStockRaw(event.target.value)} required />
          {errors.stock ? <span className="error">{errors.stock}</span> : null}
        </label>
        <label className="field">
          <span>Illustrative claim</span>
          <textarea value={claim} maxLength={180} onChange={(event) => setClaim(event.target.value)} required />
          {errors.claim ? <span className="error">{errors.claim}</span> : <span className="help">Say that the claim is illustrative. Do not invent a test result.</span>}
        </label>
        <label className="field">
          <span>Description</span>
          <textarea value={description} maxLength={500} onChange={(event) => setDescription(event.target.value)} />
          {errors.description ? <span className="error">{errors.description}</span> : null}
        </label>
        <label className="field">
          <span>Product clip</span>
          <input
            type="file"
            accept="video/mp4,video/webm,video/quicktime,video/*"
            onChange={(event) => onFile(event.target.files?.[0] ?? null)}
          />
          <span className="help">15 seconds is the recommendation. 30 seconds is the maximum. The file is not uploaded.</span>
          {fileError ? <span className="error">{fileError}</span> : null}
          {errors.video ? <span className="error">{errors.video}</span> : null}
          {assessment ? (
            <span className={assessment.tone === "good" ? "good" : assessment.tone === "long" ? "warn" : "error"} role="status">
              {reading ? "Reading duration…" : assessment.message}
            </span>
          ) : (
            <span className="help">No new clip. A poster is used if you leave this empty.</span>
          )}
        </label>
        {previewUrl ? (
          <video
            ref={videoRef}
            className="preview-video"
            src={previewUrl}
            controls
            muted
            playsInline
            preload="metadata"
            onLoadedMetadata={(event) => {
              const next = event.currentTarget.duration;
              setDuration(Number.isFinite(next) ? next : null);
              setReading(false);
            }}
            onError={() => {
              setReading(false);
              setDuration(null);
              setFileError("Could not preview that file.");
            }}
          />
        ) : null}
        <div className="row-actions">
          <button
            type="submit"
            className="btn"
            disabled={reading || (!existing && seller?.status === "rejected") || Boolean(assessment && !assessment.ok)}
          >
            {existing ? "Save changes" : "Submit to demo review"}
          </button>
          <Link className="btn secondary" href="/seller">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}

function capturePoster(video: HTMLVideoElement | null): string | null {
  if (!video || video.videoWidth === 0) return null;
  const canvas = document.createElement("canvas");
  const width = 360;
  const height = Math.max(1, Math.round((video.videoHeight / video.videoWidth) * width));
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) return null;
  context.drawImage(video, 0, 0, width, height);
  try {
    return canvas.toDataURL("image/jpeg", 0.72);
  } catch {
    return null;
  }
}
