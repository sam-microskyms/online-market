import { Suspense } from "react";
import { OrderView } from "@/components/order-view";

export const metadata = { title: "Order" };

export default function OrderPage() {
  return (
    <Suspense fallback={<p className="status-line">Opening the demo order…</p>}>
      <OrderView />
    </Suspense>
  );
}
