import Link from "next/link";

export default function NotFound() {
  return (
    <div className="page">
      <h2>That page is not in the demo</h2>
      <p className="lede">The stall, the bag, and the desks are linked from the navigation.</p>
      <Link className="btn" href="/">
        Back to the reel
      </Link>
    </div>
  );
}
