import { PROFILE } from "@/lib/scena-data";
import { mediaService } from "./media.service";
import type { List, MediaTitle, Movie, Series, User } from "./models";

const avatarUrl = (seed: string) => `https://i.pravatar.cc/120?u=${encodeURIComponent(seed)}`;

const PUBLIC_USERS: User[] = [
  {
    id: "ana",
    username: "@anaribeiro",
    displayName: "Ana Ribeiro",
    avatar: avatarUrl("ana"),
    followers: 1284,
    following: true,
  },
  {
    id: "mari",
    username: "@marifilmes",
    displayName: "Mari Almeida",
    avatar: avatarUrl("mari"),
    followers: 842,
    following: false,
  },
  {
    id: "lucas",
    username: "@lucaswatch",
    displayName: "Lucas Martins",
    avatar: avatarUrl("lucas"),
    followers: 621,
    following: false,
  },
  {
    id: "gabi",
    username: "@gabidiario",
    displayName: "Gabi Costa",
    avatar: avatarUrl("gabi"),
    followers: 509,
    following: true,
  },
];

const PUBLIC_LISTS: List[] = [
  {
    id: "comfort-shows",
    title: "Series para ver de madrugada",
    creator: PUBLIC_USERS[1],
    cover: mediaService.getMediaById("theBear")?.backdrop,
    titleCount: 18,
    likes: 326,
  },
  {
    id: "space-mood",
    title: "Ficcao cientifica elegante",
    creator: PUBLIC_USERS[2],
    cover: mediaService.getMediaById("interstellar")?.backdrop,
    titleCount: 24,
    likes: 512,
  },
  {
    id: "antiheroes",
    title: "Anti-herois inesqueciveis",
    creator: PUBLIC_USERS[0],
    cover: mediaService.getMediaById("breakingBad")?.backdrop,
    titleCount: 15,
    likes: 441,
  },
  {
    id: "prestige-tv",
    title: "TV de prestigio sem pressa",
    creator: PUBLIC_USERS[3],
    cover: mediaService.getMediaById("succession")?.backdrop,
    titleCount: 31,
    likes: 278,
  },
];

const MY_LISTS: List[] = [
  { id: "sci-fi", title: "Sci-fi para maratonar", name: "Sci-fi para maratonar", count: 18, privacy: "Pública" },
  { id: "comfort", title: "Comfort watches", name: "Comfort watches", count: 24, privacy: "Privada" },
  { id: "a24", title: "A24 essenciais", name: "A24 essenciais", count: 11, privacy: "Pública" },
];

function resolveMediaList(items: typeof PROFILE.recentlyWatched): MediaTitle[] {
  return items
    .map((item) => mediaService.getMediaById(item.id))
    .filter(Boolean) as MediaTitle[];
}

export const userService = {
  getCurrentUser(): User {
    return {
      ...PROFILE,
      id: "current-user",
      displayName: PROFILE.name,
      favoriteSeries: resolveMediaList(PROFILE.favoriteSeries) as Series[],
      favoriteMovies: resolveMediaList(PROFILE.favoriteMovies) as Movie[],
      recentlyWatched: resolveMediaList(PROFILE.recentlyWatched),
    };
  },

  getProfile(): User {
    return this.getCurrentUser();
  },

  getPublicUsers(): User[] {
    return PUBLIC_USERS;
  },

  getPublicLists(): List[] {
    return PUBLIC_LISTS;
  },

  getLibrarySections() {
    return mediaService.getLibrarySections();
  },

  getMyLists(): List[] {
    return MY_LISTS;
  },
};
