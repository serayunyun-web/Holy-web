import Image from "next/image";
import Link from "next/link";
import { PlaceholderArtwork } from "@/components/placeholder-artwork";

type ProductCardProps = {
  slug?: string;
  title: string;
  description: string;
  tone?: "teal" | "brown";
  href?: string;
  id?: string;
  isPlaceholder?: boolean;
  cardImage?: string | null;
};

export function ProductCard({ slug, title, description, tone, href, id, isPlaceholder = false, cardImage }: ProductCardProps) {
  const destination = href ?? (slug ? `/services/${slug}` : undefined);
  const artwork = cardImage ? <div className="placeholder-art product-card-image"><Image alt={`${title}產品照片`} fill sizes="(max-width: 700px) 100vw, (max-width: 1040px) 50vw, 33vw" src={cardImage} /></div> : <PlaceholderArtwork label={`${title}成品`} tone={tone} />;
  const card = <article className="product-card" id={id}>{artwork}<div className="product-card-body">{isPlaceholder && <span className="placeholder-badge">暫存內容</span>}<h3>{title}</h3><p>{description}</p></div></article>;

  return destination ? <Link aria-label={`查看${title}介紹`} className="product-card-link" href={destination}>{card}</Link> : card;
}
