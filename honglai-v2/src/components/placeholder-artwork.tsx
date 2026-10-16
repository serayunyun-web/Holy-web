type PlaceholderArtworkProps = { label: string; tone?: "teal" | "brown"; className?: string };

export function PlaceholderArtwork({ label, tone = "teal", className = "" }: PlaceholderArtworkProps) {
  return (
    <div className={`placeholder-art ${tone} ${className}`.trim()} role="img" aria-label={label}>
      <i className="placeholder-object object-back" aria-hidden="true" />
      <i className="placeholder-object object-front" aria-hidden="true" />
      <span>示意佔位圖｜{label}</span>
    </div>
  );
}
