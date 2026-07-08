import { mediaService } from "./media.service";
import type { Movie } from "./models";

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
};
