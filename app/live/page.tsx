import Link from "next/link";

export const metadata = { title: "Livestreams" };

export default function LivePage() {
  return (
    <div className="page">
      <header className="page-intro">
        <p className="eyebrow">Livestreams</p>
        <h1>Not available</h1>
        <p className="lede">
          Seller livestreams need a separate video service, and that service is not connected. There is no broadcast, no scheduled show, and no audience count on this page.
        </p>
      </header>
      <Link className="btn" href="/">
        Back to the reel
      </Link>
    </div>
  );
}
