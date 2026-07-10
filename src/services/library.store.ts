import type { MediaTitle, Movie } from "./models";

export type LibraryMediaType = "movie" | "tv";
export type MovieLibraryStatus = "want" | "watched";
export type TvLibraryStatus =
  | "want"
  | "watching"
  | "uptodate"
  | "paused"
  | "dropped"
  | "completed";
type LegacyWatchStatus = "finished" | "abandoned";
export type LibraryStatus = MovieLibraryStatus | TvLibraryStatus | LegacyWatchStatus;
export type LibraryViewMode = "grid" | "list";

export interface LibraryHistoryEvent {
  type: "added" | "status" | "favorite" | "rating" | "removed";
  value?: string | number | boolean;
  at: string;
}

export interface LibraryItem {
  id: string;
  tmdbId: number | string;
  mediaType: LibraryMediaType;
  title: string;
  poster?: string;
  backdrop: string;
  releaseYear: number;
  genres: string[];
  status: LibraryStatus;
  favorite: boolean;
  rating?: number;
  communityRating?: number;
  dateAdded: string;
  lastUpdated: string;
  history: LibraryHistoryEvent[];
}

interface LibraryState {
  items: Record<string, LibraryItem>;
}

interface LibraryPreferences {
  viewMode: LibraryViewMode;
}

const LIBRARY_KEY = "scena.library.v1";
const LEGACY_MOVIE_KEY = "scena.library.movies.v1";
const PREFERENCES_KEY = "scena.library.preferences.v1";

const DEFAULT_PREFERENCES: LibraryPreferences = {
  viewMode: "grid",
};

function now() {
  return new Date().toISOString();
}

function mediaKey(mediaType: LibraryMediaType, tmdbId: number | string) {
  return `${mediaType}-${tmdbId}`;
}

function parseTmdbId(id: string): number | string {
  const match = /^(?:movie|tv)-(\d+)$/.exec(id);
  return match ? Number(match[1]) : id;
}

function readState(): LibraryState {
  if (typeof window === "undefined") return { items: {} };
  try {
    const raw = window.localStorage.getItem(LIBRARY_KEY);
    if (raw) return JSON.parse(raw) as LibraryState;
  } catch {
    return { items: {} };
  }
  return { items: {} };
}

function writeState(state: LibraryState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LIBRARY_KEY, JSON.stringify(state));
}

function readPreferences(): LibraryPreferences {
  if (typeof window === "undefined") return DEFAULT_PREFERENCES;
  try {
    const raw = window.localStorage.getItem(PREFERENCES_KEY);
    return raw ? { ...DEFAULT_PREFERENCES, ...(JSON.parse(raw) as Partial<LibraryPreferences>) } : DEFAULT_PREFERENCES;
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

function writePreferences(preferences: LibraryPreferences) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
}

function itemFromMedia(
  media: MediaTitle,
  status: LibraryStatus,
  existing?: LibraryItem,
): LibraryItem {
  const mediaType: LibraryMediaType = media.kind === "movie" ? "movie" : "tv";
  const tmdbId = parseTmdbId(media.id);
  const timestamp = now();

  return {
    id: mediaKey(mediaType, tmdbId),
    tmdbId,
    mediaType,
    title: media.title,
    poster: media.poster,
    backdrop: media.backdrop,
    releaseYear: media.year,
    genres: media.genres ?? [],
    status,
    favorite: existing?.favorite ?? false,
    rating: existing?.rating,
    communityRating: media.communityRating ?? media.tmdbRating,
    dateAdded: existing?.dateAdded ?? timestamp,
    lastUpdated: timestamp,
    history: existing?.history ?? [],
  };
}

function appendHistory(item: LibraryItem, event: Omit<LibraryHistoryEvent, "at">): LibraryItem {
  return {
    ...item,
    history: [...item.history, { ...event, at: item.lastUpdated }],
  };
}

function normalizeMovieStatus(status: LibraryStatus): MovieLibraryStatus {
  return status === "watched" ? "watched" : "want";
}

function normalizeTvStatus(status: LibraryStatus): TvLibraryStatus {
  if (status === "watched") return "completed";
  if (status === "finished") return "completed";
  if (status === "abandoned") return "dropped";
  if (["want", "watching", "uptodate", "paused", "dropped", "completed"].includes(status)) {
    return status as TvLibraryStatus;
  }
  return "want";
}

function mediaTitleFromItem(item: LibraryItem): MediaTitle {
  return {
    id: String(item.tmdbId),
    title: item.title,
    year: item.releaseYear,
    kind: item.mediaType === "movie" ? "movie" : "series",
    backdrop: item.backdrop,
    poster: item.poster,
    genres: item.genres,
    tmdbRating: item.communityRating,
  } as MediaTitle;
}

function legacyMovieStore() {
  return {
    get(id: string) {
      return libraryStore.getById(id);
    },
    setStatus(id: string, status: MovieLibraryStatus, media?: Movie) {
      if (media) return libraryStore.setStatus(media, status);
      return undefined;
    },
    clearStatus(id: string) {
      return libraryStore.removeById(id);
    },
    setFavorite(id: string, favorited: boolean, media?: Movie) {
      if (media) return libraryStore.setFavorite(media, favorited);
      const item = libraryStore.getById(id);
      return item ? libraryStore.setFavorite(item, favorited) : undefined;
    },
    setRating(id: string, rating: number, media?: Movie) {
      if (media) return libraryStore.setRating(media, rating);
      const item = libraryStore.getById(id);
      return item ? libraryStore.setRating(item, rating) : undefined;
    },
    list(status?: MovieLibraryStatus) {
      return libraryStore.list({ mediaType: "movie", status });
    },
  };
}

export const libraryStore = {
  keyFor(media: Pick<MediaTitle, "id" | "kind"> | Pick<LibraryItem, "id" | "mediaType" | "tmdbId">) {
    if ("mediaType" in media) return media.id;
    return mediaKey(media.kind === "movie" ? "movie" : "tv", parseTmdbId(media.id));
  },

  getById(id: string): LibraryItem | undefined {
    const items = readState().items;
    return (
      items[id] ??
      items[mediaKey("movie", parseTmdbId(id))] ??
      items[mediaKey("tv", parseTmdbId(id))]
    );
  },

  get(media: Pick<MediaTitle, "id" | "kind">): LibraryItem | undefined {
    return this.getById(this.keyFor(media));
  },

  upsert(media: MediaTitle, status: LibraryStatus): LibraryItem {
    const state = readState();
    const key = this.keyFor(media);
    const existing = state.items[key];
    const normalizedStatus = media.kind === "movie" ? normalizeMovieStatus(status) : normalizeTvStatus(status);
    let next = itemFromMedia(media, normalizedStatus, existing);
    next = appendHistory(next, { type: existing ? "status" : "added", value: normalizedStatus });
    state.items[key] = next;
    writeState(state);
    return next;
  },

  setStatus(media: MediaTitle | LibraryItem, status: LibraryStatus): LibraryItem {
    const mediaTitle =
      "kind" in media
        ? media
        : mediaTitleFromItem(media);
    return this.upsert(mediaTitle, status);
  },

  setFavorite(media: MediaTitle | LibraryItem, favorite: boolean): LibraryItem {
    const state = readState();
    const key = "kind" in media ? this.keyFor(media) : media.id;
    const existing = state.items[key];
    const base = existing ?? this.upsert("kind" in media ? media : mediaTitleFromItem(media), "want");
    const timestamp = now();
    const next = appendHistory(
      {
        ...base,
        favorite,
        lastUpdated: timestamp,
      },
      { type: "favorite", value: favorite },
    );
    state.items[key] = next;
    writeState(state);
    return next;
  },

  setRating(media: MediaTitle | LibraryItem, rating: number): LibraryItem {
    const state = readState();
    const key = "kind" in media ? this.keyFor(media) : media.id;
    const existing = state.items[key];
    const base = existing ?? this.upsert("kind" in media ? media : mediaTitleFromItem(media), "want");
    const timestamp = now();
    const next = appendHistory(
      {
        ...base,
        rating,
        lastUpdated: timestamp,
      },
      { type: "rating", value: rating },
    );
    state.items[key] = next;
    writeState(state);
    return next;
  },

  remove(media: Pick<MediaTitle, "id" | "kind"> | LibraryItem) {
    const state = readState();
    const key = "mediaType" in media ? media.id : this.keyFor(media);
    const existing = state.items[key];
    if (!existing) return;
    delete state.items[key];
    writeState(state);
  },

  removeById(id: string) {
    const state = readState();
    delete state.items[id];
    writeState(state);
  },

  list(filters: { mediaType?: LibraryMediaType; status?: LibraryStatus; favorite?: boolean } = {}) {
    return Object.values(readState().items)
      .filter((item) => (filters.mediaType ? item.mediaType === filters.mediaType : true))
      .filter((item) => (filters.status ? item.status === filters.status : true))
      .filter((item) => (filters.favorite ? item.favorite : true));
  },

  getPreferences() {
    return readPreferences();
  },

  setViewMode(viewMode: LibraryViewMode) {
    const next = { ...readPreferences(), viewMode };
    writePreferences(next);
    return next;
  },

  migrateLegacyMovies(mediaResolver?: (id: string) => Movie | undefined) {
    if (typeof window === "undefined") return;
    const state = readState();
    if (Object.keys(state.items).length > 0) return;
    const raw = window.localStorage.getItem(LEGACY_MOVIE_KEY);
    if (!raw || !mediaResolver) return;
    try {
      const legacy = JSON.parse(raw) as Record<
        string,
        { status: MovieLibraryStatus; favorited: boolean; rating?: number; updatedAt: string }
      >;
      for (const [id, entry] of Object.entries(legacy)) {
        const movie = mediaResolver(id);
        if (!movie) continue;
        const item = itemFromMedia(movie, entry.status);
        state.items[item.id] = {
          ...item,
          favorite: entry.favorited,
          rating: entry.rating,
          lastUpdated: entry.updatedAt,
        };
      }
      writeState(state);
    } catch {
      return;
    }
  },
};

export const movieLibraryStore = legacyMovieStore();

export function mediaTitleFromLibraryItem(item: LibraryItem): MediaTitle {
  return mediaTitleFromItem(item);
}

export type MovieLibraryEntry = LibraryItem;
