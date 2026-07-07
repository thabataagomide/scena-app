// Static, hand-picked TMDB backdrop URLs (public image CDN, no auth needed).
// If a URL ever fails to load, <Backdrop /> falls back to a cinematic gradient.
export type Title = {
  id: string;
  title: string;
  year: number;
  kind: "movie" | "series";
  backdrop: string;
  poster?: string;
  overview?: string;
};

const TMDB = (p: string) => `https://image.tmdb.org/t/p/w1280${p}`;
const POSTER = (p: string) => `https://image.tmdb.org/t/p/w500${p}`;

export const TITLES: Record<string, Title> = {
  vampireDiaries: {
    id: "vampireDiaries",
    title: "The Vampire Diaries",
    year: 2009,
    kind: "series",
    backdrop: TMDB("/6VAJmoAcW4iRGl3jkeIAeryOLzT.jpg"),
    poster: POSTER("/wcTFDPhYaBHfSKJKQeoDBI3rSRi.jpg"),
  },
  arcane: {
    id: "arcane",
    title: "Arcane",
    year: 2021,
    kind: "series",
    backdrop: TMDB("/q8eejQcg1bAqImEV8jh8RtBD4uH.jpg"),
    poster: POSTER("/fqldf2t8ztc9aiWN3k6mlX3tvRT.jpg"),
  },
  interstellar: {
    id: "interstellar",
    title: "Interestelar",
    year: 2014,
    kind: "movie",
    backdrop: TMDB("/rAiYTfKGqDCRIIqo664sY9XZIvQ.jpg"),
    poster: POSTER("/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg"),
  },
  breakingBad: {
    id: "breakingBad",
    title: "Breaking Bad",
    year: 2008,
    kind: "series",
    backdrop: TMDB("/tsRy63Mu5cu8etL1X7ZLyf7UP1M.jpg"),
    poster: POSTER("/ggFHVNu6YYI5L9pCfOacjizRGt.jpg"),
  },
  strangerThings: {
    id: "strangerThings",
    title: "Stranger Things",
    year: 2016,
    kind: "series",
    backdrop: TMDB("/56v2KjBlU4XaOv9rVYEQypROD7P.jpg"),
    poster: POSTER("/49WJfeN0moxb9IPfGn8AIqMGskD.jpg"),
  },
  succession: {
    id: "succession",
    title: "Succession",
    year: 2018,
    kind: "series",
    backdrop: TMDB("/7HW47XbkNQ5fiwQFYGWdw9gs144.jpg"),
    poster: POSTER("/7HW47XbkNQ5fiwQFYGWdw9gs144.jpg"),
  },
  theBear: {
    id: "theBear",
    title: "The Bear",
    year: 2022,
    kind: "series",
    backdrop: TMDB("/wY7hVFObkjRUFqE1PhkjXpn7RvS.jpg"),
    poster: POSTER("/z96wKAaZ2fVJZLIt3EnIhHOxbP7.jpg"),
  },
  duna: {
    id: "duna",
    title: "Duna: Parte Dois",
    year: 2024,
    kind: "movie",
    backdrop: TMDB("/xOMo8BRK7PfcJv9JCnx7s5hj0PX.jpg"),
    poster: POSTER("/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg"),
  },
  severance: {
    id: "severance",
    title: "Severance",
    year: 2022,
    kind: "series",
    backdrop: TMDB("/lFwakVDzX44fGN9YOxrbwSAeQ2z.jpg"),
    poster: POSTER("/gCkuHJjA7oJIeuMdF6Pj2vc4gzR.jpg"),
  },
};

export type FeedItem = {
  id: string;
  user: { name: string; avatar: string };
  time: string;
  action: string;
  title: Title;
  season?: number;
  episode?: number;
  rating?: number;
  comment?: string;
  likes: number;
  comments: number;
};

const AV = (seed: string) =>
  `https://i.pravatar.cc/120?u=${encodeURIComponent(seed)}`;

export const FEED: FeedItem[] = [
  {
    id: "1",
    user: { name: "Thá", avatar: AV("tha") },
    time: "há 20min",
    action: "Favoritou",
    title: TITLES.vampireDiaries,
    likes: 43,
    comments: 12,
  },
  {
    id: "2",
    user: { name: "Lucas", avatar: AV("lucas") },
    time: "há 1h",
    action: "Começou a assistir",
    title: TITLES.arcane,
    season: 1,
    episode: 1,
    likes: 21,
    comments: 8,
  },
  {
    id: "3",
    user: { name: "Mari", avatar: AV("mari") },
    time: "há 2h",
    action: "Avaliou",
    title: TITLES.interstellar,
    rating: 5,
    likes: 67,
    comments: 15,
  },
  {
    id: "4",
    user: { name: "Pedro", avatar: AV("pedro") },
    time: "há 3h",
    action: "Terminou",
    title: TITLES.breakingBad,
    season: 5,
    episode: 16,
    likes: 92,
    comments: 23,
  },
  {
    id: "5",
    user: { name: "Gabi", avatar: AV("gabi") },
    time: "há 4h",
    action: "Comentou sobre",
    title: TITLES.strangerThings,
    comment: "Essa última temporada foi simplesmente incrível!",
    likes: 19,
    comments: 6,
  },
];

export type WatchingItem = {
  id: string;
  title: Title;
  season: number;
  episode: number;
  totalEpisodes: number;
  watchedEpisodes: number;
  nextLabel: string;
};

export const WATCHING: WatchingItem[] = [
  {
    id: "w1",
    title: TITLES.severance,
    season: 2,
    episode: 5,
    totalEpisodes: 10,
    watchedEpisodes: 5,
    nextLabel: "T2 · E6 · Trojan's Horse",
  },
  {
    id: "w2",
    title: TITLES.theBear,
    season: 3,
    episode: 3,
    totalEpisodes: 10,
    watchedEpisodes: 3,
    nextLabel: "T3 · E4 · Violet",
  },
  {
    id: "w3",
    title: TITLES.arcane,
    season: 1,
    episode: 2,
    totalEpisodes: 9,
    watchedEpisodes: 2,
    nextLabel: "T1 · E3 · The Base Violence",
  },
];

export const UPCOMING = {
  today: [
    { id: "u1", title: TITLES.severance, label: "Novo episódio · T2 E6" },
    { id: "u2", title: TITLES.theBear, label: "Novo episódio · T3 E4" },
  ],
  week: [
    { id: "u3", title: TITLES.arcane, label: "Nova temporada · T2" },
    { id: "u4", title: TITLES.strangerThings, label: "Trailer da T5" },
  ],
  month: [
    { id: "u5", title: TITLES.duna, label: "Estreia nos streamings" },
    { id: "u6", title: TITLES.succession, label: "Especial de bastidores" },
  ],
};

export const LIBRARY_SECTIONS = [
  { key: "want", label: "Quero assistir", count: 24 },
  { key: "favorites", label: "Favoritos", count: 12 },
  { key: "watched", label: "Assistidos", count: 148 },
  { key: "finished", label: "Finalizadas", count: 31 },
  { key: "paused", label: "Pausadas", count: 4 },
  { key: "abandoned", label: "Abandonadas", count: 2 },
  { key: "myLists", label: "Minhas listas", count: 6 },
  { key: "savedLists", label: "Listas salvas", count: 9 },
];

export const PROFILE = {
  name: "Ana Ribeiro",
  username: "@anaribeiro",
  bio: "Cinéfila de carteirinha. Séries longas, filmes lentos, trilhas boas.",
  country: "Brasil",
  flag: "🇧🇷",
  followers: 1284,
  following: 312,
  stats: [
    { label: "Filmes", value: 412 },
    { label: "Séries", value: 87 },
    { label: "Episódios", value: 4128 },
    { label: "Horas", value: 2960 },
  ],
  favoriteSeries: [TITLES.severance, TITLES.arcane, TITLES.breakingBad],
  favoriteMovies: [TITLES.interstellar, TITLES.duna],
  recentlyWatched: [
    TITLES.theBear,
    TITLES.severance,
    TITLES.duna,
    TITLES.strangerThings,
  ],
  avatar: AV("ana"),
};

export const ALL_TITLES: Title[] = Object.values(TITLES);
