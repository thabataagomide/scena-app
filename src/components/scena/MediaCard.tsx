/**
 * MediaCard — Scena Design System
 *
 * The canonical component for displaying Movies and TV Shows.
 * Used in: Search, Library, Favorites, Lists, Profile, Recommendations,
 *          Similar Titles, Feed attachments.
 *
 * Variants:
 *   size        → "sm" | "md" | "lg"
 *   orientation → "vertical" | "horizontal"
 *
 * All variants share the same props interface — no code duplication.
 */

import { type ReactNode, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Heart, Plus, Check, Star, Play, ChevronDown } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

export type MediaKind = "series" | "movie";

export type WatchStatus =
  | "want"       // Quero Assistir
  | "watching"   // Assistindo
  | "uptodate"   // Em Dia
  | "finished"   // Finalizado
  | "paused"     // Pausado
  | "abandoned"; // Abandonado

export interface MediaCardMedia {
  id: string;
  title: string;
  year: number;
  kind: MediaKind;
  poster?: string;
  backdrop: string;
  genres?: string[];
  tmdbRating?: number;
}

export interface MediaCardProgress {
  /** Episodes watched so far (series) or undefined (movie watched = true) */
  watched: number;
  /** Total episode count for the season/series */
  total: number;
  /** 0–100 percentage shorthand — will be computed if omitted */
  percent?: number;
}

export interface MediaCardCallbacks {
  onOpen?: (id: string) => void;
  onFavorite?: (id: string, favorited: boolean) => void;
  onAddToList?: (id: string) => void;
  onStatusChange?: (id: string, status: WatchStatus) => void;
}

// ─── Status meta ──────────────────────────────────────────────────────────────

const STATUS_META: Record<
  WatchStatus,
  { label: string; color: string; dot: string }
> = {
  want:      { label: "Quero Assistir", color: "text-muted-foreground",          dot: "bg-muted-foreground/50" },
  watching:  { label: "Assistindo",     color: "text-accent",                    dot: "bg-accent" },
  uptodate:  { label: "Em Dia",         color: "text-emerald-400",               dot: "bg-emerald-400" },
  finished:  { label: "Finalizado",     color: "text-foreground/70",             dot: "bg-foreground/40" },
  paused:    { label: "Pausado",        color: "text-amber-400",                 dot: "bg-amber-400" },
  abandoned: { label: "Abandonado",     color: "text-red-400/80",               dot: "bg-red-400/60" },
};

const STATUS_OPTIONS: WatchStatus[] = [
  "want", "watching", "uptodate", "finished", "paused", "abandoned",
];

// ─── CVA variant definitions ───────────────────────────────────────────────────

const cardVariants = cva(
  // Base shared classes
  "group relative overflow-hidden border border-border bg-card transition-all duration-300",
  {
    variants: {
      orientation: {
        vertical:   "flex flex-col",
        horizontal: "flex flex-row items-stretch",
      },
      size: {
        sm: "rounded-2xl",
        md: "rounded-[22px]",
        lg: "rounded-3xl",
      },
    },
    defaultVariants: {
      orientation: "vertical",
      size: "md",
    },
  }
);

// Poster wrapper dimension map
const POSTER_CLASSES: Record<
  "vertical" | "horizontal",
  Record<"sm" | "md" | "lg", string>
> = {
  vertical: {
    sm: "aspect-[2/3] w-full",
    md: "aspect-[2/3] w-full",
    lg: "aspect-[2/3] w-full",
  },
  horizontal: {
    sm: "aspect-[2/3] w-[52px] shrink-0",
    md: "aspect-[2/3] w-[76px] shrink-0",
    lg: "aspect-[2/3] w-[96px] shrink-0",
  },
};

// Title size map
const TITLE_CLASSES: Record<"sm" | "md" | "lg", string> = {
  sm: "text-[12.5px] font-bold",
  md: "text-[14.5px] font-bold",
  lg: "text-[16px] font-extrabold",
};

// ─── Main component ───────────────────────────────────────────────────────────

export interface MediaCardProps extends VariantProps<typeof cardVariants> {
  media: MediaCardMedia;
  /** Show user's current watch status badge */
  status?: WatchStatus;
  /** Episode / movie progress — only shown when status is "watching" */
  progress?: MediaCardProgress;
  /** Pre-initialise favorite state */
  isFavorited?: boolean;
  /** User's personal 1–5 rating */
  userRating?: number;
  /** Additional wrapper classes */
  className?: string;
  /** Callbacks for interactions */
  callbacks?: MediaCardCallbacks;
  /** Suppress the interactive quick-action row */
  readonly?: boolean;
}

export function MediaCard({
  media,
  status,
  progress,
  isFavorited: initFavorited = false,
  userRating,
  className,
  callbacks,
  readonly = false,
  size = "md",
  orientation = "vertical",
}: MediaCardProps) {
  const [favorited, setFavorited] = useState(initFavorited);
  const [currentStatus, setCurrentStatus] = useState<WatchStatus | undefined>(status);
  const [showStatusPicker, setShowStatusPicker] = useState(false);

  // Resolve the safe variant keys (cva defaults already applied, but TS wants them non-null here)
  const resolvedSize        = (size        ?? "md")       as "sm" | "md" | "lg";
  const resolvedOrientation = (orientation ?? "vertical") as "vertical" | "horizontal";

  // Progress calc
  const progressPercent = progress
    ? progress.percent ?? Math.round((progress.watched / progress.total) * 100)
    : 0;

  const handleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const next = !favorited;
    setFavorited(next);
    callbacks?.onFavorite?.(media.id, next);
    toast.success(next ? `Favoritado: ${media.title}` : `Removido dos favoritos`);
  };

  const handleAddToList = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    callbacks?.onAddToList?.(media.id);
    toast.success(`"${media.title}" adicionado à sua lista!`);
  };

  const handleStatusSelect = (s: WatchStatus) => {
    setCurrentStatus(s);
    setShowStatusPicker(false);
    callbacks?.onStatusChange?.(media.id, s);
    toast.success(`Status: ${STATUS_META[s].label}`);
  };

  const posterSrc = media.poster ?? media.backdrop;
  const posterClass = POSTER_CLASSES[resolvedOrientation][resolvedSize];
  const titleClass  = TITLE_CLASSES[resolvedSize];
  const statusMeta  = currentStatus ? STATUS_META[currentStatus] : null;
  const showProgress =
    currentStatus === "watching" && progress && resolvedOrientation === "horizontal";
  const showProgressVertical =
    currentStatus === "watching" && progress && resolvedOrientation === "vertical";

  const cardContent = (
    <div
      className={cn(
        cardVariants({ orientation: resolvedOrientation, size: resolvedSize }),
        "hover:-translate-y-0.5 active:scale-[0.98]",
        className
      )}
    >
      {/* ── Poster ── */}
      <div className={cn("relative overflow-hidden shrink-0", posterClass)}>
        <img
          src={posterSrc}
          alt={media.title}
          referrerPolicy="no-referrer"
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
        />

        {/* Cinematic dark bottom gradient for vertical cards */}
        {resolvedOrientation === "vertical" && (
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400" />
        )}

        {/* Status badge — top left */}
        {statusMeta && resolvedSize !== "sm" && (
          <div className="absolute top-2 left-2 flex items-center gap-1 rounded-full bg-black/65 backdrop-blur-md border border-white/10 px-2 py-0.5">
            <span className={cn("h-1.5 w-1.5 rounded-full", statusMeta.dot)} />
            <span className="text-[8.5px] font-bold uppercase tracking-wider text-white/90">
              {statusMeta.label}
            </span>
          </div>
        )}

        {/* Favorite indicator — top right */}
        {favorited && (
          <div className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 backdrop-blur-sm">
            <Heart className="h-3 w-3 fill-red-500 text-red-500" strokeWidth={0} />
          </div>
        )}

        {/* Kind pill — bottom left — vertical only */}
        {resolvedOrientation === "vertical" && resolvedSize !== "sm" && (
          <div className="absolute bottom-2 left-2 rounded-md bg-black/65 backdrop-blur-sm px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-widest text-white/80">
            {media.kind === "series" ? "Série" : "Filme"} · {media.year}
          </div>
        )}

        {/* Quick play hover overlay — vertical only */}
        {resolvedOrientation === "vertical" && !readonly && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/35 backdrop-blur-[1px]">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-lg transition-transform duration-300 group-hover:scale-105">
              <Play className="h-4 w-4 fill-current ml-0.5" strokeWidth={0} />
            </div>
          </div>
        )}

        {/* Vertical progress bar overlay — bottom */}
        {showProgressVertical && (
          <div className="absolute bottom-0 inset-x-0 px-2.5 pb-2.5">
            <div className="h-1 w-full overflow-hidden rounded-full bg-white/20">
              <div
                className="h-full rounded-full bg-accent transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Content body ── */}
      <div
        className={cn(
          "flex flex-col justify-between",
          resolvedOrientation === "vertical" ? "p-3" : "flex-1 min-w-0 py-2.5 pr-3 pl-3"
        )}
      >
        <div className="min-w-0">
          {/* Kind + year — horizontal only (vertical has poster overlay) */}
          {resolvedOrientation === "horizontal" && (
            <div className="mb-1 text-[9.5px] font-semibold uppercase tracking-wider text-muted-foreground">
              {media.kind === "series" ? "Série" : "Filme"} · {media.year}
            </div>
          )}

          {/* Title */}
          <h3 className={cn("truncate text-foreground leading-tight", titleClass)}>
            {media.title}
          </h3>

          {/* Genres — shown on md and lg only */}
          {resolvedSize !== "sm" && media.genres && media.genres.length > 0 && (
            <div className="mt-1 truncate text-[10px] text-muted-foreground">
              {media.genres.slice(0, 3).join(" · ")}
            </div>
          )}

          {/* Ratings row */}
          {resolvedSize !== "sm" && (
            <div className="mt-2 flex items-center gap-2">
              {/* TMDb rating */}
              {media.tmdbRating !== undefined && (
                <div className="flex items-center gap-0.5 text-[10px] font-bold text-accent">
                  <Star className="h-3 w-3 fill-current" strokeWidth={0} />
                  <span>{media.tmdbRating.toFixed(1)}</span>
                </div>
              )}
              {/* User rating */}
              {userRating !== undefined && (
                <div className="flex items-center gap-0.5 text-[10px] font-semibold text-foreground/70">
                  <Star className="h-3 w-3 text-foreground/40" strokeWidth={1.4} />
                  <span>{userRating}.0</span>
                  <span className="text-muted-foreground/50">sua nota</span>
                </div>
              )}
            </div>
          )}

          {/* Progress — horizontal variant */}
          {showProgress && (
            <div className="mt-2.5">
              <div className="flex items-center justify-between text-[9.5px] text-muted-foreground mb-1">
                <span>{progress!.watched}/{progress!.total} eps</span>
                <span className="font-semibold text-foreground/80">{progressPercent}%</span>
              </div>
              <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-accent transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* ── Quick Actions (shown on md/lg, suppressed when readonly or sm) ── */}
        {!readonly && resolvedSize !== "sm" && (
          <div className="mt-3 flex items-center justify-between gap-2 relative">
            {/* Favorite */}
            <button
              onClick={handleFavorite}
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full border border-border transition-all duration-200 active:scale-90 cursor-pointer hover:bg-white/5",
                favorited
                  ? "text-red-500 border-red-500/30 bg-red-500/10"
                  : "text-muted-foreground"
              )}
              aria-label={favorited ? "Remover dos favoritos" : "Favoritar"}
            >
              <Heart
                className={cn("h-3 w-3", favorited && "fill-current")}
                strokeWidth={favorited ? 0 : 1.8}
              />
            </button>

            {/* Add to list */}
            <button
              onClick={handleAddToList}
              className="flex h-7 w-7 items-center justify-center rounded-full border border-border text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all duration-200 active:scale-90 cursor-pointer"
              aria-label="Adicionar à lista"
            >
              <Plus className="h-3 w-3" strokeWidth={2} />
            </button>

            {/* Quick status picker */}
            <div className="relative flex-1">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowStatusPicker((v) => !v);
                }}
                className={cn(
                  "flex w-full items-center justify-center gap-1 rounded-lg border border-border bg-secondary/60 px-2 py-1.5 text-[9.5px] font-bold uppercase tracking-wider transition-all duration-200 active:scale-95 cursor-pointer hover:bg-secondary",
                  statusMeta ? statusMeta.color : "text-muted-foreground"
                )}
                aria-label="Alterar status"
              >
                {statusMeta ? (
                  <>
                    <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", statusMeta.dot)} />
                    <span className="truncate">{statusMeta.label}</span>
                  </>
                ) : (
                  <>
                    <span>+ Status</span>
                  </>
                )}
                <ChevronDown className="h-2.5 w-2.5 shrink-0 text-muted-foreground/60" />
              </button>

              {/* Dropdown menu */}
              {showStatusPicker && (
                <StatusDropdown
                  current={currentStatus}
                  onSelect={handleStatusSelect}
                  onDismiss={() => setShowStatusPicker(false)}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // Wrap in a router Link to the details page unless readonly or callbacks.onOpen provided
  if (callbacks?.onOpen) {
    return (
      <div
        onClick={() => callbacks.onOpen!(media.id)}
        className="cursor-pointer block"
      >
        {cardContent}
      </div>
    );
  }

  if (media.kind === "series") {
    return (
      <Link to="/series/$id" params={{ id: media.id }} className="block">
        {cardContent}
      </Link>
    );
  }

  return (
    <Link to="/movies/$id" params={{ id: media.id }} className="block">
      {cardContent}
    </Link>
  );
}

// ─── Status Dropdown ──────────────────────────────────────────────────────────

function StatusDropdown({
  current,
  onSelect,
  onDismiss,
}: {
  current?: WatchStatus;
  onSelect: (s: WatchStatus) => void;
  onDismiss: () => void;
}) {
  return (
    <>
      {/* Invisible overlay to catch outside clicks */}
      <div
        className="fixed inset-0 z-40"
        onClick={(e) => { e.stopPropagation(); onDismiss(); }}
      />
      <div className="absolute bottom-full left-0 right-0 z-50 mb-1 overflow-hidden rounded-xl border border-border bg-card/95 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.7)] animate-fade-in">
        {STATUS_OPTIONS.map((s) => {
          const meta = STATUS_META[s];
          const isActive = current === s;
          return (
            <button
              key={s}
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onSelect(s); }}
              className={cn(
                "flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-[12px] font-semibold transition-colors duration-150 cursor-pointer hover:bg-white/5",
                isActive ? "bg-white/5" : ""
              )}
            >
              <span className={cn("h-2 w-2 rounded-full shrink-0", meta.dot)} />
              <span className={isActive ? meta.color : "text-foreground/80"}>{meta.label}</span>
              {isActive && <Check className="ml-auto h-3 w-3 text-accent" strokeWidth={3} />}
            </button>
          );
        })}
      </div>
    </>
  );
}

// ─── Convenience pre-configured exports ──────────────────────────────────────
// Use these shortcuts for the most common usage contexts:

/** Standard poster grid card (search, library, recommendations) */
export function MediaCardVerticalSm(props: Omit<MediaCardProps, "size" | "orientation">) {
  return <MediaCard {...props} size="sm" orientation="vertical" />;
}

/** Standard grid card with actions (favorites, lists, profile) */
export function MediaCardVerticalMd(props: Omit<MediaCardProps, "size" | "orientation">) {
  return <MediaCard {...props} size="md" orientation="vertical" />;
}

/** Large featured card (hero placement, similar titles) */
export function MediaCardVerticalLg(props: Omit<MediaCardProps, "size" | "orientation">) {
  return <MediaCard {...props} size="lg" orientation="vertical" />;
}

/** Compact row entry (search results, continue watching, feed) */
export function MediaCardHorizontalSm(props: Omit<MediaCardProps, "size" | "orientation">) {
  return <MediaCard {...props} size="sm" orientation="horizontal" />;
}

/** Standard row with progress and actions (watch page, lists) */
export function MediaCardHorizontalMd(props: Omit<MediaCardProps, "size" | "orientation">) {
  return <MediaCard {...props} size="md" orientation="horizontal" />;
}

/** Expanded row entry with full metadata (search detail view) */
export function MediaCardHorizontalLg(props: Omit<MediaCardProps, "size" | "orientation">) {
  return <MediaCard {...props} size="lg" orientation="horizontal" />;
}

// ─── Usage helper ─────────────────────────────────────────────────────────────
// Converts a scena-data Title object into MediaCardMedia shape
export function titleToMedia(
  t: { id: string; title: string; year: number; kind: "movie" | "series"; backdrop: string; poster?: string }
): MediaCardMedia {
  return {
    id:       t.id,
    title:    t.title,
    year:     t.year,
    kind:     t.kind,
    poster:   t.poster,
    backdrop: t.backdrop,
  };
}
