/**
 * Local-first library persistence for movies.
 *
 * Values are namespaced under a single localStorage key so the whole store
 * can later be swapped for a Supabase-backed implementation without any UI
 * component changing shape.
 */

export type MovieLibraryStatus = "want" | "watched";

interface MovieLibraryEntry {
  status: MovieLibraryStatus;
  favorited: boolean;
  rating?: number;
  /** Preserved history — set to true the first time the movie is watched. */
  hasBeenWatched: boolean;
  updatedAt: string;
}

type MovieLibraryState = Record<string, MovieLibraryEntry>;

const KEY = "scena.library.movies.v1";

function read(): MovieLibraryState {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as MovieLibraryState) : {};
  } catch {
    return {};
  }
}

function write(state: MovieLibraryState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(state));
}

function upsert(id: string, patch: Partial<MovieLibraryEntry>): MovieLibraryEntry {
  const state = read();
  const prev: MovieLibraryEntry = state[id] ?? {
    status: "want",
    favorited: false,
    hasBeenWatched: false,
    updatedAt: new Date().toISOString(),
  };
  const next: MovieLibraryEntry = { ...prev, ...patch, updatedAt: new Date().toISOString() };
  state[id] = next;
  write(state);
  return next;
}

export const movieLibraryStore = {
  get(id: string): MovieLibraryEntry | undefined {
    return read()[id];
  },
  setStatus(id: string, status: MovieLibraryStatus) {
    return upsert(id, {
      status,
      hasBeenWatched: status === "watched" ? true : (read()[id]?.hasBeenWatched ?? false),
    });
  },
  clearStatus(id: string) {
    const state = read();
    if (!state[id]) return;
    // Preserve history — keep favorited/rating if present, drop status.
    const { favorited, rating, hasBeenWatched } = state[id];
    if (!favorited && rating === undefined && !hasBeenWatched) {
      delete state[id];
    } else {
      state[id] = {
        status: "want",
        favorited,
        rating,
        hasBeenWatched,
        updatedAt: new Date().toISOString(),
      };
      // Represent "no active status" by removing status key semantically;
      // easier for consumers: treat status only as valid if the movie is
      // in wants/watched lists.
    }
    write(state);
  },
  setFavorite(id: string, favorited: boolean) {
    return upsert(id, { favorited });
  },
  setRating(id: string, rating: number) {
    return upsert(id, { rating });
  },
  list(status?: MovieLibraryStatus): Array<{ id: string } & MovieLibraryEntry> {
    return Object.entries(read())
      .filter(([, v]) => (status ? v.status === status : true))
      .map(([id, v]) => ({ id, ...v }));
  },
};

export type { MovieLibraryEntry };
