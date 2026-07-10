import { mediaService } from "./media.service";
import { tmdbClient } from "./tmdb/tmdb.api";
import {
  mapTmdbMovieToMovie,
  mapTmdbToMovieDetails,
  parseTmdbId,
} from "./tmdb/tmdb.mapper";
import type { Movie, MovieDetails } from "./models";

const AV = (s: string) => `https://i.pravatar.cc/100?u=${encodeURIComponent(s)}`;

function fallbackDetails(id: string, base?: Movie): MovieDetails {
  return {
    id,
    originalTitle: base?.title,
    tagline: "Uma experiência cinematográfica marcante.",
    year: base?.year ?? new Date().getFullYear(),
    runtime: base?.runtime ?? "—",
    releaseDate: base?.releaseDate,
    genres: base?.genres ?? ["Drama"],
    ageRating: "—",
    averageRating: base?.communityRating ?? 4.2,
    ratingsCount: "1.2k",
    originalLanguage: "EN",
    country: "Estados Unidos",
    overview:
      base?.overview ??
      "Ainda não temos uma sinopse detalhada disponível para este título.",
    streamingPlatforms: [
      { name: "Netflix", logoColor: "bg-red-700 border-red-800/80 text-white" },
    ],
    cast: [
      { name: "Ator Principal", character: "Protagonista", avatar: AV(`${id}-1`) },
      { name: "Ator Coadjuvante", character: "Parceiro", avatar: AV(`${id}-2`) },
    ],
    comments: [],
  };
}

export const movieService = {
  getMovies(): Movie[] {
    return mediaService.getMovies() as Movie[];
  },

  getMovie(id: string): Movie | undefined {
    const media = mediaService.getMediaById(id);
    return media?.kind === "movie" ? (media as Movie) : undefined;
  },

  getTrendingMovies(): Movie[] {
    return mediaService.getTrendingMovies() as Movie[];
  },

  getMovieDetails(id: string): MovieDetails {
    return fallbackDetails(id, this.getMovie(id));
  },

  getSimilarMovies(id: string): Movie[] {
    return this.getMovies().filter((m) => m.id !== id);
  },

  // ── Async TMDb-backed variants ─────────────────────────────────────────────

  async getMovieAsync(id: string): Promise<Movie | undefined> {
    const parsed = parseTmdbId(id);
    if (!parsed || parsed.kind !== "movie" || !tmdbClient.hasKey()) {
      return this.getMovie(id);
    }
    try {
      const details = await tmdbClient.movieDetails(parsed.tmdbId);
      if (!details) return this.getMovie(id);
      return mapTmdbMovieToMovie({
        id: details.id,
        title: details.title,
        original_title: details.original_title,
        overview: details.overview,
        release_date: details.release_date,
        poster_path: details.poster_path,
        backdrop_path: details.backdrop_path,
        vote_average: details.vote_average,
      });
    } catch {
      return this.getMovie(id);
    }
  },

  async getMovieDetailsAsync(id: string): Promise<MovieDetails> {
    const mockBase = this.getMovie(id);
    const mock = fallbackDetails(id, mockBase);
    const parsed = parseTmdbId(id);
    if (!parsed || parsed.kind !== "movie" || !tmdbClient.hasKey()) {
      return mock;
    }
    try {
      const [details, credits, providers] = await Promise.all([
        tmdbClient.movieDetails(parsed.tmdbId),
        tmdbClient.movieCredits(parsed.tmdbId),
        tmdbClient.movieWatchProviders(parsed.tmdbId),
      ]);
      if (!details) return mock;
      return mapTmdbToMovieDetails({ details, credits, providers });
    } catch {
      return mock;
    }
  },

  async getSimilarMoviesAsync(id: string): Promise<Movie[]> {
    const mock = this.getSimilarMovies(id);
    const parsed = parseTmdbId(id);
    if (!parsed || parsed.kind !== "movie" || !tmdbClient.hasKey()) {
      return mock;
    }
    try {
      const recs = await tmdbClient.movieRecommendations(parsed.tmdbId);
      if (!recs?.results?.length) return mock;
      return recs.results.slice(0, 12).map(mapTmdbMovieToMovie);
    } catch {
      return mock;
    }
  },
};
