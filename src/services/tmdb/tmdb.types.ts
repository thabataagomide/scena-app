// Minimal TMDb response typings for the endpoints Scena consumes.
// Fields we don't use are intentionally omitted.

export interface TmdbSearchTv {
  id: number;
  name: string;
  original_name?: string;
  overview?: string;
  first_air_date?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  vote_average?: number;
  genre_ids?: number[];
}

export interface TmdbSearchMovie {
  id: number;
  title: string;
  original_title?: string;
  overview?: string;
  release_date?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  vote_average?: number;
  genre_ids?: number[];
}

export interface TmdbPaged<T> {
  page: number;
  results: T[];
  total_pages?: number;
  total_results?: number;
}

export interface TmdbGenre {
  id: number;
  name: string;
}

export interface TmdbSeason {
  season_number: number;
  name?: string;
  episode_count?: number;
  air_date?: string | null;
  overview?: string;
  poster_path?: string | null;
}

export interface TmdbEpisode {
  episode_number: number;
  season_number: number;
  name: string;
  overview?: string;
  air_date?: string | null;
  runtime?: number | null;
  vote_average?: number;
  still_path?: string | null;
}

export interface TmdbTvDetails {
  id: number;
  name: string;
  original_name?: string;
  overview?: string;
  tagline?: string;
  first_air_date?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  vote_average?: number;
  vote_count?: number;
  episode_run_time?: number[];
  genres?: TmdbGenre[];
  number_of_seasons?: number;
  seasons?: TmdbSeason[];
  content_ratings?: {
    results: Array<{ iso_3166_1: string; rating: string }>;
  };
}

export interface TmdbCastMember {
  id: number;
  name: string;
  character?: string;
  profile_path?: string | null;
  order?: number;
}

export interface TmdbCredits {
  cast: TmdbCastMember[];
}

export interface TmdbSeasonDetails {
  season_number: number;
  name?: string;
  episodes: TmdbEpisode[];
}

export interface TmdbWatchProviderEntry {
  provider_id: number;
  provider_name: string;
  logo_path?: string | null;
}

export interface TmdbWatchProviders {
  results: Record<
    string,
    {
      link?: string;
      flatrate?: TmdbWatchProviderEntry[];
      free?: TmdbWatchProviderEntry[];
      ads?: TmdbWatchProviderEntry[];
    }
  >;
}
