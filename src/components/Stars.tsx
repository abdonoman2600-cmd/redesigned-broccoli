import { StarIcon } from "./Icons";

export default function Stars({
  rating,
  size = 16,
  className = "",
}: {
  rating: number;
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-0.5 ${className}`}
      role="img"
      aria-label={`التقييم ${rating} من ٥`}
    >
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = Math.max(0, Math.min(1, rating - (i - 1)));
        return (
          <span key={i} className="relative inline-block" style={{ width: size, height: size }}>
            <StarIcon width={size} height={size} className="absolute inset-0 text-stone-warm" />
            <span
              className="absolute inset-0 overflow-hidden"
              style={{ width: `${fill * 100}%`, right: 0, left: "auto" }}
            >
              <StarIcon width={size} height={size} className="text-brass" />
            </span>
          </span>
        );
      })}
    </span>
  );
}
