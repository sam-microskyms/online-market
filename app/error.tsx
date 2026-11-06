"use client";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="page">
      <h2>The demo hit a snag</h2>
      <p className="lede">Nothing was ordered or charged. You can try the view again.</p>
      <button type="button" className="btn" onClick={() => reset()}>
        Try again
      </button>
    </div>
  );
}
