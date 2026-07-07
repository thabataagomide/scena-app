import { cn } from "@/lib/utils";

export function ScenaLogo({
  className,
  showWordmark = false,
  size = 28,
}: {
  className?: string;
  showWordmark?: boolean;
  size?: number;
}) {
  return (
    <div className={cn("inline-flex items-center gap-3", className)}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        aria-hidden="true"
      >
        {/* Outline play "S" mark, thin rounded stroke, gold */}
        <path
          d="M12 10.5c0-2.2 2.4-3.6 4.3-2.5l22 12.5a3 3 0 0 1 0 5.2l-22 12.5A2.9 2.9 0 0 1 12 35.7V27c0-1.7 1.4-3 3-3h11.5"
          stroke="#D8BE84"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {showWordmark && (
        <span className="text-[15px] font-semibold tracking-[0.34em] text-foreground/90">
          SCENA
        </span>
      )}
    </div>
  );
}
