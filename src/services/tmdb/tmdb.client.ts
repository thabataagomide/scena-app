// Thin TMDb HTTP client. Reads the API key from Vite env at call time so that
// missing configuration is a soft failure (services fall back to mock data).
//
// Only used inside src/services/tmdb/**. Routes and UI never import this.

import type {
  TmdbCredits,
  TmdbPaged,
  TmdbSearchMovie,
  TmdbSearchTv,
  TmdbSeasonDetails,
  TmdbTvDetails,
  TmdbWatchProviders,
} from "./tmdb.types";

const TMDB_BASE = "https://api.themoviedb.org/3";
export const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/";

export function tmdbApiKey(): string | undefined {
  const key = (import.meta.env.VITE_TMDB_API_KEY as string | undefined)?.trim();
  return key ? key : undefined;
}

export function hasTmdbKey(): boolean {
  return Boolean(tmdbApiKey());
}

export function tmdbPoster(path?: string | null, size: "w200" | "w500" = "w500") {
  return path ? `${TMDB_IMAGE_BASE}${size}${path}` : undefined;
}

export function tmdbBackdrop(path?: string | null, size: "w780" | "original" = "w780") {
  return path ? `${TMDB_IMAGE_BASE}${size}${path}` : undefined;
}

export function tmdbProfile(path?: string | null) {
  return path ? `${TMDB_IMAGE_BASE}w185${path}` : undefined;
}

async function tmdbRequest<T>(
  path: string,
  params: Record<string, string | number | undefined> = {},
): Promise<T | undefined> {
  const key = tmdbApiKey();
  if (!key) return undefined;

  const url = new URL(`${TMDB_BASE}${path}`);
  url.searchParams.set("api_key", key);
  url.searchParams.set("language", "pt-BR");
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") url.searchParams.set(k, String(v));
  }

  try {
    const res = await fetch(url.toString());
    if (!res.ok) return undefined;
    return (await res.json()) as T;
  } catch {
    return undefined;
  }
}

export const tmdbClient = {
  hasKey: hasTmdbKey,

  searchTv(query: string) {
    return tmdbRequest<TmdbPaged<TmdbSearchTv>>("/search/tv", {
      query,
      include_adult: "false",
      page: 1,
    });
  },

  searchMovies(query: string) {
    return tmdbRequest<TmdbPaged<TmdbSearchMovie>>("/search/movie", {
      query,
      include_adult: "false",
      page: 1,
    });
  },

  trendingTv() {
    return tmdbRequest<TmdbPaged<TmdbSearchTv>>("/trending/tv/week");
  },

  trendingMovies() {
    return tmdbRequest<TmdbPaged<TmdbSearchMovie>>("/trending/movie/week");
  },

  tvDetails(id: number | string) {
    return tmdbRequest<TmdbTvDetails>(`/tv/${id}`, { append_to_response: "content_ratings" });
  },

  tvSeason(id: number | string, seasonNumber: number) {
    return tmdbRequest<TmdbSeasonDetails>(`/tv/${id}/season/${seasonNumber}`);
  },

  tvCredits(id: number | string) {
    return tmdbRequest<TmdbCredits>(`/tv/${id}/credits`);
  },

  tvRecommendations(id: number | string) {
    return tmdbRequest<TmdbPaged<TmdbSearchTv>>(`/tv/${id}/recommendations`);
  },

  tvWatchProviders(id: number | string) {
    return tmdbRequest<TmdbWatchProviders>(`/tv/${id}/watch/providers`);
  },
};
