import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ChevronRight, Grid2X2, Heart, List, Plus, Search } from "lucide-react";
import { AppShell, SectionTitle } from "@/components/scena/AppShell";
import {
  MediaCardHorizontalMd,
  MediaCardVerticalMd,
  type WatchStatus,
} from "@/components/scena/MediaCard";
import {
  libraryStore,
  mediaTitleFromLibraryItem,
  type LibraryItem,
  type LibraryMediaType,
  type LibraryStatus,
  type LibraryViewMode,
} from "@/services/library.store";
import { movieService } from "@/services/movie.service";
import { userService } from "@/services/user.service";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/biblioteca")({
  head: () => ({
    meta: [
      { title: "Biblioteca · Scena" },
      { name: "description", content: "Sua coleção pessoal de filmes e séries." },
    ],
  }),
  component: BibliotecaPage,
});

type TopFilter = "all" | "movie" | "tv" | "favorites";
type SortMode = "added" | "updated" | "alpha" | "year" | "rating";

const TOP_FILTERS: { key: TopFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "movie", label: "Movies" },
  { key: "tv", label: "TV Shows" },
  { key: "favorites", label: "Favorites" },
];

const MOVIE_STATUS_FILTERS: { key: "all" | LibraryStatus; label: string }[] = [
  { key: "all", label: "All" },
  { key: "want", label: "Want to Watch" },
  { key: "watched", label: "Watched" },
];

const TV_STATUS_FILTERS: { key: "all" | LibraryStatus; label: string }[] = [
  { key: "all", label: "All" },
  { key: "want", label: "Want to Watch" },
  { key: "watching", label: "Watching" },
  { key: "uptodate", label: "Up to Date" },
  { key: "paused", label: "Paused" },
  { key: "dropped", label: "Dropped" },
  { key: "completed", label: "Completed" },
];

const SORT_OPTIONS: { key: SortMode; label: string }[] = [
  { key: "added", label: "Recently Added" },
  { key: "updated", label: "Recently Updated" },
  { key: "alpha", label: "Alphabetical" },
  { key: "year", label: "Release Year" },
  { key: "rating", label: "Community Rating" },
];

function BibliotecaPage() {
  const myLists = userService.getMyLists();
  const [version, setVersion] = useState(0);
  const [topFilter, setTopFilter] = useState<TopFilter>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | LibraryStatus>("all");
  const [query, setQuery] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("added");
  const [viewMode, setViewMode] = useState<LibraryViewMode>(() => libraryStore.getPreferences().viewMode);

  useEffect(() => {
    libraryStore.migrateLegacyMovies(movieService.getMovie);
    setVersion((n) => n + 1);
  }, []);

  const allItems = useMemo(() => libraryStore.list(), [version]);
  const counts = useMemo(
    () => ({
      movies: allItems.filter((item) => item.mediaType === "movie").length,
      tv: allItems.filter((item) => item.mediaType === "tv").length,
      favorites: allItems.filter((item) => item.favorite).length,
    }),
    [allItems],
  );

  const mediaType: LibraryMediaType | undefined =
    topFilter === "movie" ? "movie" : topFilter === "tv" ? "tv" : undefined;
  const activeStatus = mediaType && statusFilter !== "all" ? statusFilter : undefined;

  const items = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return libraryStore
      .list({
        mediaType,
        status: activeStatus,
        favorite: topFilter === "favorites" ? true : undefined,
      })
      .filter((item) => {
        if (!normalizedQuery) return true;
        return [item.title, String(item.releaseYear), ...item.genres]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);
      })
      .sort((a, b) => sortItems(a, b, sortMode));
  }, [activeStatus, mediaType, query, sortMode, topFilter, version]);

  const statusFilters =
    topFilter === "movie" ? MOVIE_STATUS_FILTERS : topFilter === "tv" ? TV_STATUS_FILTERS : [];

  const updateViewMode = (next: LibraryViewMode) => {
    setViewMode(next);
    libraryStore.setViewMode(next);
  };

  const handleTopFilter = (next: TopFilter) => {
    setTopFilter(next);
    setStatusFilter("all");
  };

  return (
    <AppShell>
      <SectionTitle eyebrow="Privada" title="Sua biblioteca" />

      <div className="mb-5 grid grid-cols-4 gap-2">
        {TOP_FILTERS.map((filter) => (
          <button
            key={filter.key}
            onClick={() => handleTopFilter(filter.key)}
            className={cn(
              "rounded-2xl border px-2 py-3 text-[11px] font-bold transition-all active:scale-[0.98]",
              topFilter === filter.key
                ? "border-accent/40 bg-accent/12 text-accent"
                : "border-border bg-card/50 text-muted-foreground hover:text-foreground",
            )}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <div className="mb-4 grid grid-cols-[1fr_auto] gap-2">
        <label className="flex items-center gap-2 rounded-2xl border border-border bg-card/50 px-3 py-2.5">
          <Search className="h-4 w-4 text-muted-foreground" strokeWidth={1.7} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar na biblioteca"
            className="min-w-0 flex-1 bg-transparent text-[13px] text-foreground outline-none placeholder:text-muted-foreground"
          />
        </label>
        <div className="flex rounded-2xl border border-border bg-card/50 p-1">
          <button
            onClick={() => updateViewMode("grid")}
            className={cn("flex h-8 w-8 items-center justify-center rounded-xl", viewMode === "grid" && "bg-accent text-accent-foreground")}
            aria-label="Grid"
          >
            <Grid2X2 className="h-4 w-4" />
          </button>
          <button
            onClick={() => updateViewMode("list")}
            className={cn("flex h-8 w-8 items-center justify-center rounded-xl", viewMode === "list" && "bg-accent text-accent-foreground")}
            aria-label="List"
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mb-5 flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <select
          value={sortMode}
          onChange={(event) => setSortMode(event.target.value as SortMode)}
          className="rounded-2xl border border-border bg-card/70 px-3 py-2.5 text-[12px] font-semibold text-foreground outline-none"
          aria-label="Ordenar biblioteca"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.key} value={option.key}>
              {option.label}
            </option>
          ))}
        </select>
        {statusFilters.map((filter) => (
          <button
            key={filter.key}
            onClick={() => setStatusFilter(filter.key)}
            className={cn(
              "shrink-0 rounded-2xl border px-3 py-2.5 text-[12px] font-semibold transition-all active:scale-[0.98]",
              statusFilter === filter.key
                ? "border-accent/40 bg-accent/12 text-accent"
                : "border-border bg-card/50 text-muted-foreground hover:text-foreground",
            )}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <div className="mb-5 grid grid-cols-3 gap-2">
        <Stat label="Movies" value={counts.movies} />
        <Stat label="TV Shows" value={counts.tv} />
        <Stat label="Favorites" value={counts.favorites} />
      </div>

      {items.length > 0 ? (
        <div className={viewMode === "grid" ? "grid grid-cols-2 gap-3" : "space-y-3"}>
          {items.map((item) => (
            <LibraryCard key={item.id} item={item} viewMode={viewMode} onUpdate={() => setVersion((n) => n + 1)} />
          ))}
        </div>
      ) : (
        <LibraryEmptyState topFilter={topFilter} query={query} />
      )}

      <div className="mt-10">
        <SectionTitle
          eyebrow="Coleções"
          title="Minhas listas"
          action={
            <button className="flex items-center gap-1 text-[12px] font-medium text-accent">
              <Plus className="h-4 w-4" strokeWidth={1.8} /> Nova
            </button>
          }
        />
        <div className="space-y-3">
          {myLists.map((list) => (
            <div
              key={list.id}
              className="flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-4"
            >
              <div>
                <div className="text-[14.5px] font-semibold text-foreground">
                  {list.name ?? list.title}
                </div>
                <div className="mt-0.5 text-[12px] text-muted-foreground">
                  {list.count} títulos · {list.privacy}
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" strokeWidth={1.6} />
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

function LibraryCard({
  item,
  viewMode,
  onUpdate,
}: {
  item: LibraryItem;
  viewMode: LibraryViewMode;
  onUpdate: () => void;
}) {
  const mediaTitle = mediaTitleFromLibraryItem(item);
  const media = {
    id: mediaTitle.id,
    title: mediaTitle.title,
    year: mediaTitle.year,
    kind: mediaTitle.kind,
    backdrop: mediaTitle.backdrop,
    poster: mediaTitle.poster,
    genres: mediaTitle.genres,
    tmdbRating: mediaTitle.tmdbRating,
  };
  const props = {
    media,
    status: watchStatusFromLibraryItem(item),
    isFavorited: item.favorite,
    userRating: item.rating,
    readonly: true,
  };

  return viewMode === "grid" ? (
    <MediaCardVerticalMd {...props} />
  ) : (
    <MediaCardHorizontalMd {...props} />
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-border bg-card/50 px-3 py-3 text-center">
      <div className="text-[18px] font-black text-foreground">{value}</div>
      <div className="mt-0.5 text-[9.5px] font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
    </div>
  );
}

function LibraryEmptyState({ topFilter, query }: { topFilter: TopFilter; query: string }) {
  const hasQuery = query.trim().length > 0;
  const message = hasQuery
    ? "Nenhum resultado encontrado na sua biblioteca."
    : topFilter === "movie"
      ? "Nenhum filme salvo ainda."
      : topFilter === "tv"
        ? "Nenhuma série salva ainda."
        : topFilter === "favorites"
          ? "Nenhum favorito salvo ainda."
          : "Sua biblioteca ainda está vazia.";

  return (
    <div className="rounded-3xl border border-dashed border-border bg-card/30 px-5 py-10 text-center">
      <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-full border border-border text-accent">
        {topFilter === "favorites" ? <Heart className="h-5 w-5" /> : <Search className="h-5 w-5" />}
      </div>
      <h2 className="text-[15px] font-bold text-foreground">{message}</h2>
      <p className="mx-auto mt-2 max-w-[260px] text-[12.5px] leading-relaxed text-muted-foreground">
        Busque por filmes e séries e adicione seus títulos favoritos à Biblioteca.
      </p>
    </div>
  );
}

function watchStatusFromLibraryItem(item: LibraryItem): WatchStatus {
  if (item.status === "completed" || item.status === "watched") return "finished";
  if (item.status === "dropped") return "abandoned";
  if (item.status === "watching" || item.status === "uptodate" || item.status === "paused") {
    return item.status;
  }
  return "want";
}

function sortItems(a: LibraryItem, b: LibraryItem, sortMode: SortMode) {
  if (sortMode === "updated") return Date.parse(b.lastUpdated) - Date.parse(a.lastUpdated);
  if (sortMode === "alpha") return a.title.localeCompare(b.title);
  if (sortMode === "year") return b.releaseYear - a.releaseYear;
  if (sortMode === "rating") return (b.communityRating ?? 0) - (a.communityRating ?? 0);
  return Date.parse(b.dateAdded) - Date.parse(a.dateAdded);
}
