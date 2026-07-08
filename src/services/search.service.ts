import { mediaService } from "./media.service";
import { movieService } from "./movie.service";
import { userService } from "./user.service";
import { tmdbClient } from "./tmdb/tmdb.api";
import { mapTmdbSearchResultsToMedia } from "./tmdb/tmdb.mapper";
import type { List, MediaTitle, User, WatchStatus } from "./models";

export const SEARCH_FILTERS = [
  { key: "all", label: "Tudo" },
  { key: "series", label: "Series" },
  { key: "movie", label: "Filmes" },
  { key: "users", label: "Usuarios" },
  { key: "lists", label: "Listas" },
] as const;

export type SearchFilterKey = (typeof SEARCH_FILTERS)[number]["key"];

export type SearchMediaResult = MediaTitle & { status?: WatchStatus };
export type SearchUserResult = User & { following: boolean };
export type SearchListResult = List & {
  creator: Pick<User, "id" | "username" | "displayName" | "avatar">;
  cover: string;
  titleCount: number;
  likes: number;
};

export interface SearchResultGroups {
  series: SearchMediaResult[];
  movie: SearchMediaResult[];
  users: SearchUserResult[];
  lists: SearchListResult[];
}

const POPULAR_SEARCHES = ["Arcane", "Severance", "Duna", "Breaking Bad"];

const MEDIA_SEARCH_META: Record<string, { status?: WatchStatus }> = {
  vampireDiaries: { status: "watching" },
  arcane: { status: "want" },
  breakingBad: { status: "finished" },
  theBear: { status: "watching" },
  severance: { status: "watching" },
};

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function withSearchMeta(media: MediaTitle): SearchMediaResult {
  return {
    ...media,
    status: MEDIA_SEARCH_META[media.id]?.status,
  };
}

function matchesMedia(media: MediaTitle, query: string) {
  if (!query) return true;
  return [media.title, media.year.toString(), media.kind, ...(media.genres ?? [])].some((value) =>
    normalize(value).includes(query),
  );
}

function matchesUser(user: User, query: string) {
  if (!query) return true;
  return [user.username, user.displayName].some((value) => normalize(value).includes(query));
}

function matchesList(list: List, query: string) {
  if (!query) return true;
  return [list.title, list.creator?.displayName ?? "", list.creator?.username ?? ""].some((value) =>
    normalize(value).includes(query),
  );
}

function logSearch(message: string, data?: Record<string, unknown>) {
  if (import.meta.env.DEV) {
    console.info(`[SearchService] ${message}`, data ?? {});
  }
}

function warnSearch(message: string, data?: Record<string, unknown>) {
  if (import.meta.env.DEV) {
    console.warn(`[SearchService] ${message}`, data ?? {});
  }
}

export const searchService = {
  search(rawQuery: string): SearchResultGroups {
    const query = normalize(rawQuery.trim());
    const mediaMatches = mediaService.getAllMedia().filter((media) => matchesMedia(media, query));

    return {
      series: mediaMatches.filter((media) => media.kind === "series").map(withSearchMeta),
      movie: mediaMatches.filter((media) => media.kind === "movie").map(withSearchMeta),
      users: userService
        .getPublicUsers()
        .filter((user) => matchesUser(user, query))
        .map((user) => ({ ...user, following: Boolean(user.following) })),
      lists: userService
        .getPublicLists()
        .filter((list) => matchesList(list, query)) as SearchListResult[],
    };
  },

  getFilters() {
    return SEARCH_FILTERS;
  },

  getPopularSearches() {
    return POPULAR_SEARCHES;
  },

  getTrending() {
    return {
      series: mediaService.getTrendingSeries().map(withSearchMeta),
      movies: movieService.getTrendingMovies().map(withSearchMeta),
      lists: userService.getPublicLists() as SearchListResult[],
      users: userService
        .getPublicUsers()
        .map((user) => ({ ...user, following: Boolean(user.following) })),
    };
  },

  // ── Async variants (TMDb when VITE_TMDB_API_KEY is set) ────────────────────

  async searchAsync(rawQuery: string): Promise<SearchResultGroups> {
    const mock = this.search(rawQuery);
    const q = rawQuery.trim();
    const hasKey = tmdbClient.hasKey();

    logSearch("search requested", { query: q, hasApiKey: hasKey });

    if (!q) {
      logSearch("using mock fallback: empty query");
      return mock;
    }

    if (!hasKey) {
      warnSearch("using mock fallback: missing VITE_TMDB_API_KEY", { query: q });
      return mock;
    }

    try {
      logSearch("calling TMDb search endpoints", { query: q, endpoints: ["search/tv", "search/movie"] });
      const [tv, movies] = await Promise.all([tmdbClient.searchTv(q), tmdbClient.searchMovies(q)]);
      const mapped = mapTmdbSearchResultsToMedia(tv?.results, movies?.results);
      const usingTvFallback = !tv;
      const usingMovieFallback = !movies;

      if (usingTvFallback || usingMovieFallback) {
        warnSearch("using partial mock fallback for media search", {
          query: q,
          tvFallback: usingTvFallback,
          movieFallback: usingMovieFallback,
        });
      }

      logSearch("TMDb search completed", {
        query: q,
        tvResults: tv?.results?.length ?? 0,
        movieResults: movies?.results?.length ?? 0,
      });

      return {
        series: usingTvFallback ? mock.series : mapped.series.map((m) => withSearchMeta(m)),
        movie: usingMovieFallback ? mock.movie : mapped.movies.map((m) => withSearchMeta(m)),
        users: mock.users,
        lists: mock.lists,
      };
    } catch (error) {
      warnSearch("using mock fallback: TMDb search threw", {
        query: q,
        reason: error instanceof Error ? error.message : "Unknown error",
      });
      return mock;
    }
  },

  async getTrendingAsync() {
    const mock = this.getTrending();
    const hasKey = tmdbClient.hasKey();

    logSearch("trending requested", { hasApiKey: hasKey });

    if (!hasKey) {
      warnSearch("using mock fallback: missing VITE_TMDB_API_KEY for trending");
      return mock;
    }

    try {
      logSearch("calling TMDb trending endpoints", { endpoints: ["trending/tv/week", "trending/movie/week"] });
      const [tv, movies] = await Promise.all([tmdbClient.trendingTv(), tmdbClient.trendingMovies()]);
      const mapped = mapTmdbSearchResultsToMedia(
        tv?.results?.slice(0, 12),
        movies?.results?.slice(0, 12),
      );
      const usingTvFallback = !tv;
      const usingMovieFallback = !movies;

      if (usingTvFallback || usingMovieFallback) {
        warnSearch("using partial mock fallback for trending", {
          tvFallback: usingTvFallback,
          movieFallback: usingMovieFallback,
        });
      }

      logSearch("TMDb trending completed", {
        tvResults: tv?.results?.length ?? 0,
        movieResults: movies?.results?.length ?? 0,
      });

      return {
        series: usingTvFallback ? mock.series : mapped.series.map(withSearchMeta),
        movies: usingMovieFallback ? mock.movies : mapped.movies.map(withSearchMeta),
        lists: mock.lists,
        users: mock.users,
      };
    } catch (error) {
      warnSearch("using mock fallback: TMDb trending threw", {
        reason: error instanceof Error ? error.message : "Unknown error",
      });
      return mock;
    }
  },
};
