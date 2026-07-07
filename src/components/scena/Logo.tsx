import { cn } from "@/lib/utils";
import logoAsset from "@/assets/scena-logo.png.asset.json";

export function ScenaLogo({
  className,
  showWordmark = false,
  size = 30,
}: {
  className?: string;
  showWordmark?: boolean;
  size?: number;
}) {
  return (
    <div className={cn("inline-flex items-center gap-3", className)}>
      <img
        src={logoAsset.url}
        alt="Scena"
        width={size}
        height={size}
        className="select-none"
        style={{ height: size, width: size, objectFit: "contain" }}
        draggable={false}
      />
      {showWordmark && (
        <span className="text-[13px] font-semibold tracking-[0.36em] text-foreground/90">
          SCENA
        </span>
      )}
    </div>
  );
}
