import Link from "next/link";
import { BookOpen, ArrowUpRight } from "lucide-react";
import { photos } from "@/lib/constants";
import { Avatar, Badge } from "./ui";
import { FavoriteButton } from "./client-ui";
export type CardListing = {
  id: string;
  title: string;
  course: string;
  faculty: string;
  kind: string;
  status: string;
  images: unknown;
  user: { name: string };
  favorites?: { userId: string }[];
};
export function ListingCard({
  listing,
  editable = false,
}: {
  listing: CardListing;
  editable?: boolean;
}) {
  const image = photos(listing.images)[0];
  return (
    <article className="listing-card">
      <div className="listing-photo">
        <Link href={`/materiales/${listing.id}`} tabIndex={-1} aria-hidden="true">
          {image ? <img src={image} alt={listing.title} loading="lazy" /> : <BookOpen size={48} />}
        </Link>
        <span className={`kind-tag ${listing.kind === "DONATION" ? "gift" : ""}`}>
          {listing.kind === "DONATION" ? "REGALO" : "TRUEQUE"}
        </span>
        <FavoriteButton id={listing.id} saved={!!listing.favorites?.length} />
      </div>
      <div className="listing-content">
        <p className="eyebrow">{listing.faculty}</p>
        <h3>
          <Link href={`/materiales/${listing.id}`}>{listing.title}</Link>
        </h3>
        <p className="course">
          <BookOpen size={15} />
          {listing.course ||
            (listing.kind === "DONATION" && "Donación a la comunidad") ||
            "Material para intercambiar"}
        </p>
        <div className="listing-owner">
          <Avatar name={listing.user.name} />
          <span>{listing.user.name}</span>
          {listing.status !== "AVAILABLE" && <Badge status={listing.status} />}
        </div>
        <div className="listing-footer">
          <Link href={`/materiales/${listing.id}`} className="btn soft">
            Ver detalle
            <ArrowUpRight size={16} />
          </Link>
          {editable && ["AVAILABLE", "ARCHIVED"].includes(listing.status) && (
            <Link href={`/publicar?id=${listing.id}`} className="text-link">
              Editar
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
