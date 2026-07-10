// Adapters that convert TMDb payloads into Scena's domain models. Keeping the
// mapping in one place means UI components stay ignorant of the origin (mock
// vs TMDb) of any given record.

import type {
  Episode,
  MediaTitle,
  Movie,
  MovieDetails,
  Person,
  Series,
  SeriesDetails,
  StreamingPlatform,
} from "../models";
import { tmdbBackdrop, tmdbPoster, tmdbProfile, TMDB_IMAGE_BASE } from "./tmdb.api";
import type {
  TmdbCastMember,
  TmdbCredits,
  TmdbEpisode,
  TmdbSearchMovie,
  TmdbSearchTv,
  TmdbSeasonDetails,
  TmdbTvDetails,
  TmdbWatchProviderEntry,
  TmdbWatchProviders,
} from "./tmdb.types";

const FALLBACK_BACKDROP = "https://image.tmdb.org/t/p/w780/56v2KjBlU4XaOv9rVYEQypROD7P.jpg";

function yearFromDate(date?: string | null): number {
  if (!date) return new Date().getFullYear();
  const y = Number(date.slice(0, 4));
  return Number.isFinite(y) ? y : new Date().getFullYear();
}

export function mapTmdbTvToSeries(t: TmdbSearchTv | TmdbTvDetails): Series {
  const name = "name" in t ? t.name : "";
  const first = "first_air_date" in t ? t.first_air_date : (t as TmdbSearchTv).first_air_date;
  return {
    id: `tv-${t.id}`,
    title: name,
    year: yearFromDate(first),
    kind: "series",
    backdrop: tmdbBackdrop(t.backdrop_path) ?? FALLBACK_BACKDROP,
    poster: tmdbPoster(t.poster_path),
    overview: t.overview ?? undefined,
    tmdbRating: typeof t.vote_average === "number" ? Number(t.vote_average.toFixed(1)) : undefined,
    genres: "genres" in t && t.genres ? t.genres.map((g) => g.name) : undefined,
    seasonsCount: "number_of_seasons" in t ? t.number_of_seasons : undefined,
  };
}

export function mapTmdbMovieToMovie(m: TmdbSearchMovie): Movie {
  return {
    id: `movie-${m.id}`,
    title: m.title,
    year: yearFromDate(m.release_date),
    kind: "movie",
    backdrop: tmdbBackdrop(m.backdrop_path) ?? FALLBACK_BACKDROP,
    poster: tmdbPoster(m.poster_path),
    overview: m.overview ?? undefined,
    tmdbRating: typeof m.vote_average === "number" ? Number(m.vote_average.toFixed(1)) : undefined,
    releaseDate: m.release_date ?? undefined,
  };
}

export function mapTmdbSearchResultsToMedia(
  tv: TmdbSearchTv[] | undefined,
  movies: TmdbSearchMovie[] | undefined,
): { series: MediaTitle[]; movies: MediaTitle[] } {
  return {
    series: (tv ?? []).map(mapTmdbTvToSeries),
    movies: (movies ?? []).map(mapTmdbMovieToMovie),
  };
}

function mapTmdbCast(cast: TmdbCastMember[] | undefined): Person[] {
  return (cast ?? []).slice(0, 12).map((c) => ({
    id: String(c.id),
    name: c.name,
    character: c.character,
    avatar:
      tmdbProfile(c.profile_path) ??
      `https://i.pravatar.cc/120?u=${encodeURIComponent(String(c.id))}`,
  }));
}

function mapTmdbEpisodes(episodes: TmdbEpisode[] | undefined): Episode[] {
  return (episodes ?? []).map((e) => ({
    episodeNum: e.episode_number,
    title: e.name,
    runtime: e.runtime ? `${e.runtime}m` : "—",
    airDate: e.air_date ?? "",
    rating: typeof e.vote_average === "number" ? Number(e.vote_average.toFixed(1)) : 0,
    overview: e.overview ?? "",
  }));
}

function mapWatchProviders(providers: TmdbWatchProviders | undefined): StreamingPlatform[] {
  if (!providers) return [];
  // Prefer BR, fall back to US then any locale with flatrate providers.
  const preferredKeys = ["BR", "US"];
  let entries: TmdbWatchProviderEntry[] | undefined;
  for (const key of preferredKeys) {
    const region = providers.results?.[key];
    if (region?.flatrate?.length) {
      entries = region.flatrate;
      break;
    }
  }
  if (!entries) {
    const anyRegion = Object.values(providers.results ?? {}).find((r) => r?.flatrate?.length);
    entries = anyRegion?.flatrate;
  }
  if (!entries) return [];
  return entries.slice(0, 6).map((p) => ({
    name: p.provider_name,
    logoColor: "bg-card border-border text-foreground",
    icon: p.logo_path ? `${TMDB_IMAGE_BASE}w92${p.logo_path}` : undefined,
  }));
}

function ageRatingFromContentRatings(details: TmdbTvDetails): string {
  const results = details.content_ratings?.results ?? [];
  const br = results.find((r) => r.iso_3166_1 === "BR");
  const us = results.find((r) => r.iso_3166_1 === "US");
  return (br?.rating || us?.rating || "—").toString();
}

function averageRuntime(runtimes?: number[]): string {
  if (!runtimes || runtimes.length === 0) return "—";
  const avg = Math.round(runtimes.reduce((a, b) => a + b, 0) / runtimes.length);
  return `${avg} min`;
}

export interface TmdbSeriesDetailsInput {
  details: TmdbTvDetails;
  seasons: TmdbSeasonDetails[];
  credits?: TmdbCredits;
  providers?: TmdbWatchProviders;
}

export function mapTmdbToSeriesDetails({
  details,
  seasons,
  credits,
  providers,
}: TmdbSeriesDetailsInput): SeriesDetails {
  const episodesBySeason: Record<number, Episode[]> = {};
  for (const s of seasons) {
    if (s.season_number > 0) {
      episodesBySeason[s.season_number] = mapTmdbEpisodes(s.episodes);
    }
  }

  const rating =
    typeof details.vote_average === "number" ? Number(details.vote_average.toFixed(1)) : 0;
  const communityRating = Number((rating / 2).toFixed(1)); // TMDb 0–10 → Scena 0–5

  return {
    id: `tv-${details.id}`,
    originalTitle: details.original_name,
    tagline: details.tagline || "",
    year: yearFromDate(details.first_air_date),
    runtime: averageRuntime(details.episode_run_time),
    genres: (details.genres ?? []).map((g) => g.name),
    ageRating: ageRatingFromContentRatings(details),
    averageRating: communityRating,
    ratingsCount:
      typeof details.vote_count === "number"
        ? new Intl.NumberFormat("pt-BR", { notation: "compact" }).format(details.vote_count)
        : "0",
    seasonsCount:
      details.number_of_seasons ??
      (details.seasons ?? []).filter((s) => s.season_number > 0).length,
    streamingPlatforms: mapWatchProviders(providers),
    cast: mapTmdbCast(credits?.cast),
    episodes: episodesBySeason,
    comments: [],
  };
}

// Extract the numeric TMDb id from an id like "tv-123" or "movie-456". Returns
// undefined for legacy mock ids (kept for backward compatibility).
export function parseTmdbId(id: string): { kind: "tv" | "movie"; tmdbId: number } | undefined {
  const m = /^(tv|movie)-(\d+)$/.exec(id);
  if (!m) return undefined;
  return { kind: m[1] as "tv" | "movie", tmdbId: Number(m[2]) };
}
