import { ListingForm } from "@/components/listing-form";

export const metadata = { title: "New listing" };

export default function NewListingPage() {
  return <ListingForm productId={null} />;
}
