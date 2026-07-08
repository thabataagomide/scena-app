import {
  ALL_TITLES,
  FEED,
  LIBRARY_SECTIONS,
  TITLES,
  UPCOMING,
} from "@/lib/scena-data";
import type {
  FeedItem,
  LibrarySection,
  MediaKind,
  MediaTitle,
  UpcomingGroups,
} from "./models";

const MEDIA_META: Record<string, { genres: string[]; tmdbRating: number; communityRating?: number }> = {
  vampireDiaries: {
    genres: ["Drama", "Fantasia", "Romance"],
    tmdbRating: 8.3,
    communityRating: 4.3,
  },
  arcane: {
    genres: ["Animacao", "Acao", "Drama"],
    tmdbRating: 8.8,
    communityRating: 4.8,
  },
  interstellar: {
    genres: ["Ficcao", "Drama", "Aventura"],
    tmdbRating: 8.7,
    communityRating: 4.7,
  },
  breakingBad: {
    genres: ["Crime", "Drama", "Suspense"],
    tmdbRating: 8.9,
    communityRating: 4.9,
  },
  strangerThings: {
    genres: ["Ficcao", "Terror", "Drama"],
    tmdbRating: 8.6,
    communityRating: 4.5,
  },
  succession: {
    genres: ["Drama", "Comedia", "Familia"],
    tmdbRating: 8.3,
    communityRating: 4.4,
  },
  theBear: {
    genres: ["Drama", "Comedia"],
    tmdbRating: 8.2,
    communityRating: 4.6,
  },
  duna: {
    genres: ["Ficcao", "Aventura", "Drama"],
    tmdbRating: 8.5,
    communityRating: 4.5,
  },
  severance: {
    genres: ["Drama", "Misterio", "Ficcao"],
    tmdbRating: 8.7,
    communityRating: 4.8,
  },
};

function enrichMedia<T extends MediaTitle>(media: T): T {
  const meta = MEDIA_META[media.id];
  return {
    ...media,
    genres: media.genres ?? meta?.genres,
    tmdbRating: media.tmdbRating ?? meta?.tmdbRating,
    communityRating: media.communityRating ?? meta?.communityRating,
  };
}

function enrichFeedItem(item: (typeof FEED)[number]): FeedItem {
  return {
    ...item,
    title: enrichMedia(item.title as MediaTitle),
  };
}

function enrichUpcomingGroup(items: (typeof UPCOMING.today)): UpcomingGroups["today"] {
  return items.map((item) => ({
    ...item,
    title: enrichMedia(item.title as MediaTitle),
  }));
}

export const mediaService = {
  getAllMedia(): MediaTitle[] {
    return ALL_TITLES.map((title) => enrichMedia(title as MediaTitle));
  },

  getMediaById(id: string): MediaTitle | undefined {
    const media = TITLES[id as keyof typeof TITLES];
    return media ? enrichMedia(media as MediaTitle) : undefined;
  },

  getMediaRecord(): Record<string, MediaTitle> {
    return Object.fromEntries(this.getAllMedia().map((media) => [media.id, media]));
  },

  getMediaByKind(kind: MediaKind): MediaTitle[] {
    return this.getAllMedia().filter((media) => media.kind === kind);
  },

  getSeries() {
    return this.getMediaByKind("series");
  },

  getMovies() {
    return this.getMediaByKind("movie");
  },

  getTrendingSeries() {
    return ["severance", "arcane", "theBear", "breakingBad"]
      .map((id) => this.getMediaById(id))
      .filter(Boolean) as MediaTitle[];
  },

  getTrendingMovies() {
    return ["duna", "interstellar"]
      .map((id) => this.getMediaById(id))
      .filter(Boolean) as MediaTitle[];
  },

  getFeed(): FeedItem[] {
    return FEED.map(enrichFeedItem);
  },

  getUpcoming(): UpcomingGroups {
    return {
      today: enrichUpcomingGroup(UPCOMING.today),
      week: enrichUpcomingGroup(UPCOMING.week),
      month: enrichUpcomingGroup(UPCOMING.month),
    };
  },

  getLibrarySections(): LibrarySection[] {
    return LIBRARY_SECTIONS;
  },
};
