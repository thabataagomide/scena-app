import { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Cinematic backdrop:
 * - image fills a rounded card
 * - dark overlay + smooth left-side fade so text stays readable
 * - falls back to a subtle gradient if the image fails to load
 */
export function Backdrop({
  src,
  alt,
  className,
  side = "left",
  intensity = "strong",
}: {
  src: string;
  alt: string;
  className?: string;
  side?: "left" | "bottom";
  intensity?: "soft" | "strong";
}) {
  const [failed, setFailed] = useState(false);

  const fadeLeft =
    intensity === "strong"
      ? "linear-gradient(90deg, rgba(15,15,15,0.96) 0%, rgba(15,15,15,0.86) 34%, rgba(15,15,15,0.55) 62%, rgba(15,15,15,0.30) 100%)"
      : "linear-gradient(90deg, rgba(15,15,15,0.78) 0%, rgba(15,15,15,0.32) 62%, rgba(15,15,15,0.10) 100%)";

  const fadeBottom =
    "linear-gradient(180deg, rgba(9,9,9,0.10) 0%, rgba(9,9,9,0.55) 55%, rgba(9,9,9,0.95) 100%)";

  const fade = side === "left" ? fadeLeft : fadeBottom;

  return (
    <div className={cn("absolute inset-0 overflow-hidden", className)} aria-hidden>
      {!failed ? (
        <img
          src={src}
          alt={alt}
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
          className="h-full w-full object-cover opacity-90"
          loading="lazy"
        />
      ) : (
        <div
          className="h-full w-full"
          style={{
            background:
              "radial-gradient(120% 80% at 80% 20%, #2a2a2a 0%, #141414 45%, #0b0b0b 100%)",
          }}
        />
      )}
      <div className="absolute inset-0" style={{ background: fade }} />
      <div className="absolute inset-0 bg-black/10" />
    </div>
  );
}
