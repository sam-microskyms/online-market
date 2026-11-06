"use client";

import { useParams } from "next/navigation";
import { ListingForm } from "@/components/listing-form";

export function EditListing() {
  const params = useParams<{ id: string }>();
  const id = typeof params?.id === "string" ? params.id : "";
  return <ListingForm productId={id} />;
}
