export type MediaKind = "movie" | "series";

export type WatchStatus = "want" | "watching" | "uptodate" | "finished" | "paused" | "abandoned";

export interface MediaBase {
  id: string;
  title: string;
  year: number;
  kind: MediaKind;
  backdrop: string;
  poster?: string;
  overview?: string;
  genres?: string[];
  tmdbRating?: number;
  communityRating?: number;
}

export interface Movie extends MediaBase {
  kind: "movie";
  runtime?: string;
  releaseDate?: string;
}

export interface Series extends MediaBase {
  kind: "series";
  seasons?: Season[];
  seasonsCount?: number;
}

export type MediaTitle = Movie | Series;

export interface Episode {
  episodeNum: number;
  title: string;
  runtime: string;
  airDate: string;
  rating: number;
  overview: string;
}

export interface Season {
  seasonNumber: number;
  title?: string;
  episodes: Episode[];
}

export interface Person {
  id?: string;
  name: string;
  avatar?: string;
  character?: string;
  role?: string;
}

export interface User {
  id: string;
  username: string;
  displayName: string;
  name?: string;
  avatar: string;
  bio?: string;
  country?: string;
  flag?: string;
  followers: number;
  following: number | boolean;
  stats?: Statistics[];
  favoriteSeries?: Series[];
  favoriteMovies?: Movie[];
  recentlyWatched?: MediaTitle[];
}

export interface List {
  id: string;
  title: string;
  name?: string;
  creator?: Pick<User, "id" | "username" | "displayName" | "avatar">;
  cover?: string;
  count?: number;
  titleCount?: number;
  likes?: number;
  privacy?: "Publica" | "Privada" | "Pública";
}

export interface Comment {
  user: { name: string; avatar: string };
  comment: string;
  time: string;
  likes: number;
  rating?: number;
}

export interface Review {
  id: string;
  user: Pick<User, "id" | "username" | "displayName" | "avatar">;
  mediaId: string;
  rating: number;
  body?: string;
  createdAt: string;
  likes: number;
}

export interface Notification {
  id: string;
  type: "episode" | "social" | "list" | "system";
  title: string;
  body?: string;
  read: boolean;
  createdAt: string;
}

export interface Statistics {
  label: string;
  value: number;
}

export interface StreamingPlatform {
  name: string;
  logoColor: string;
  icon?: string;
}

export interface SeriesDetails {
  id: string;
  originalTitle?: string;
  tagline: string;
  year: number;
  runtime: string;
  genres: string[];
  ageRating: string;
  averageRating: number;
  ratingsCount: string;
  seasonsCount: number;
  streamingPlatforms: StreamingPlatform[];
  cast: Person[];
  episodes: Record<number, Episode[]>;
  comments: Comment[];
}

export interface MovieDetails {
  id: string;
  originalTitle?: string;
  tagline: string;
  year: number;
  runtime: string;
  releaseDate?: string;
  genres: string[];
  ageRating: string;
  averageRating: number;
  ratingsCount: string;
  originalLanguage?: string;
  country?: string;
  overview: string;
  streamingPlatforms: StreamingPlatform[];
  cast: Person[];
  comments: Comment[];
}

export interface FeedItem {
  id: string;
  user: { name: string; avatar: string };
  time: string;
  action: string;
  title: MediaTitle;
  season?: number;
  episode?: number;
  rating?: number;
  comment?: string;
  likes: number;
  comments: number;
}

export interface WatchingItem {
  id: string;
  title: Series;
  season: number;
  episode: number;
  totalEpisodes: number;
  watchedEpisodes: number;
  nextLabel: string;
}

export interface LibrarySection {
  key: string;
  label: string;
  count: number;
}

export interface UpcomingItem {
  id: string;
  title: MediaTitle;
  label: string;
}

export interface UpcomingGroups {
  today: UpcomingItem[];
  week: UpcomingItem[];
  month: UpcomingItem[];
}

export interface UpcomingRelease {
  id: string;
  titleId: string;
  episodeNum: string;
  episodeTitle: string;
  releaseDate: string;
  countdown: string;
  group: "today" | "tomorrow" | "week";
}

export interface RecentlyReleased {
  id: string;
  titleId: string;
  episodeLabel: string;
  episodeTitle: string;
  releasedAt: string;
}
