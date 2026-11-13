type PageHeroProps = { title: string; description: string };

export function PageHero({ title, description }: PageHeroProps) {
  return <section className="page-hero"><div className="page-container"><h1>{title}</h1><p>{description}</p></div></section>;
}
