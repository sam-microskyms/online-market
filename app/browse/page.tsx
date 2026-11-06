import { Suspense } from "react";
import { Browse } from "@/components/browse";

export const metadata = { title: "Browse" };

export default function BrowsePage() {
  return (
    <Suspense fallback={<p className="status-line">Opening the stall…</p>}>
      <Browse />
    </Suspense>
  );
}
