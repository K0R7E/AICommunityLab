type Props = {
  categories: string[];
  className?: string;
};

export function PostCategoryBadges({ categories, className }: Props) {
  if (!categories.length) return null;
  const base =
    "rounded-md bg-zinc-800/80 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-zinc-300";
  return (
    <span className={`inline-flex flex-wrap items-center gap-2 ${className ?? ""}`}>
      {categories.map((c) => (
        <span key={c} className={base}>
          {c}
        </span>
      ))}
    </span>
  );
}
