import { WATCHING } from "@/lib/scena-data";
import { mediaService } from "./media.service";
import { tmdbClient } from "./tmdb/tmdb.client";
import {
  mapTmdbToSeriesDetails,
  mapTmdbTvToSeries,
  parseTmdbId,
} from "./tmdb/tmdb.mapper";
import type {
  MediaTitle,
  RecentlyReleased,
  Series,
  SeriesDetails,
  UpcomingRelease,
  WatchingItem,
} from "./models";
const AV = (s: string) => `https://i.pravatar.cc/100?u=${encodeURIComponent(s)}`;

const SERIES_DB: Record<string, SeriesDetails> = {
  severance: {
    id: "severance",
    originalTitle: "Severance",
    tagline: "Por favor, esteja ciente de que você concordou em dividir sua mente.",
    year: 2022,
    runtime: "50 min",
    genres: ["Ficção Científica", "Suspense", "Drama"],
    ageRating: "16+",
    averageRating: 4.8,
    ratingsCount: "18.4k",
    seasonsCount: 2,
    streamingPlatforms: [{ name: "Apple TV+", logoColor: "bg-black border-white/20 text-white" }],
    cast: [
      { name: "Adam Scott",          character: "Mark Scout",      avatar: AV("adam") },
      { name: "Britt Lower",         character: "Helly R.",        avatar: AV("britt") },
      { name: "Patricia Arquette",   character: "Harmony Cobel",   avatar: AV("patricia") },
      { name: "Zach Cherry",         character: "Dylan George",    avatar: AV("zach") },
      { name: "John Turturro",       character: "Irving Bailiff",  avatar: AV("john") },
      { name: "Christopher Walken",  character: "Burt Goodman",    avatar: AV("chris") },
    ],
    episodes: {
      1: [
        { episodeNum: 1, title: "Good News About Hell",               runtime: "48m", airDate: "18 Fev 2022", rating: 4.6, overview: "Mark é promovido a chefe da equipe da divisão de refinamento de macro-dados cortados." },
        { episodeNum: 2, title: "Half Loop",                          runtime: "46m", airDate: "25 Fev 2022", rating: 4.5, overview: "A equipe treina a nova recruta Helly, que logo começa a se rebelar contra as regras." },
        { episodeNum: 3, title: "In Perpetuity",                      runtime: "48m", airDate: "4 Mar 2022",  rating: 4.7, overview: "Helly tenta enviar uma mensagem para sua versão externa enquanto Irving faz descobertas." },
        { episodeNum: 4, title: "The You You Are",                    runtime: "50m", airDate: "11 Mar 2022", rating: 4.6, overview: "Mark encontra um livro de autoajuda misterioso deixado por um ex-funcionário." },
        { episodeNum: 5, title: "The Grim Barbarity of Baird Creek",  runtime: "44m", airDate: "18 Mar 2022", rating: 4.8, overview: "A equipe de refinamento explora novas salas enquanto as tensões aumentam." },
        { episodeNum: 6, title: "Hide and Seek",                      runtime: "46m", airDate: "25 Mar 2022", rating: 4.7, overview: "Mark e Helly tentam escapar do andar de corte enquanto Cobel interfere." },
        { episodeNum: 7, title: "Defiant Jazz",                       runtime: "48m", airDate: "1 Abr 2022",  rating: 4.9, overview: "O grupo orquestra um plano audacioso para se conectar com o mundo externo." },
        { episodeNum: 8, title: "What's for Dinner?",                 runtime: "47m", airDate: "8 Abr 2022",  rating: 4.8, overview: "Tensões explodem durante o Jantar dos Fundadores enquanto segredos surgem à tona." },
        { episodeNum: 9, title: "The We We Are",                      runtime: "54m", airDate: "8 Abr 2022",  rating: 5.0, overview: "O plano é executado e revelações chocantes mudam tudo sobre o que sabíamos da Lumon." },
      ],
      2: [
        { episodeNum: 1, title: "Arrive Alive",          runtime: "52m", airDate: "23 Jan 2025", rating: 4.7, overview: "Mark e Helly tentam entender as consequências das revelações de suas identidades externas." },
        { episodeNum: 2, title: "Trojan's Horse",         runtime: "54m", airDate: "30 Jan 2025", rating: 4.8, overview: "Dylan descobre segredos chocantes sobre as operações secretas da Lumon." },
        { episodeNum: 3, title: "The We We Are",          runtime: "50m", airDate: "6 Fev 2025",  rating: 4.9, overview: "A equipe elabora um plano arriscado para se libertar definitivamente." },
        { episodeNum: 4, title: "Woe's Hollow",           runtime: "48m", airDate: "13 Fev 2025", rating: 4.7, overview: "Cobel endurece sua fiscalização e Mark enfrenta uma nova rodada de testes." },
        { episodeNum: 5, title: "Sunder",                 runtime: "50m", airDate: "20 Fev 2025", rating: 4.8, overview: "A mente de Mark começa a falhar entre seus dois lados." },
        { episodeNum: 6, title: "Attila",                 runtime: "52m", airDate: "27 Fev 2025", rating: 4.9, overview: "Um novo personagem desafia o equilíbrio frágil dentro da Lumon." },
      ],
    },
    comments: [
      { user: { name: "Lucas Melo",    avatar: AV("luke") },    comment: "Essa é a melhor série de ficção científica da década. A direção de arte é perfeita.", time: "há 2 dias", likes: 45, rating: 5 },
      { user: { name: "Mariana Costa", avatar: AV("mariana") }, comment: "O final da primeira temporada me deixou sem respirar por horas. Genial!",             time: "há 5 dias", likes: 32, rating: 5 },
      { user: { name: "Rafael Duarte", avatar: AV("rafael") },  comment: "A atuação do Adam Scott é subestimada. Ele carrega dois personagens com maestria.",   time: "há 1 sem", likes: 28, rating: 4 },
    ],
  },
  theBear: {
    id: "theBear",
    originalTitle: "The Bear",
    tagline: "Cada segundo conta.",
    year: 2022,
    runtime: "30 min",
    genres: ["Drama", "Comédia"],
    ageRating: "16+",
    averageRating: 4.7,
    ratingsCount: "12.2k",
    seasonsCount: 3,
    streamingPlatforms: [{ name: "Disney+", logoColor: "bg-[#00003c] border-[#1a1a6c]/80 text-white" }],
    cast: [
      { name: "Jeremy Allen White",   character: "Carmy Berzatto", avatar: AV("jeremy") },
      { name: "Ebon Moss-Bachrach",   character: "Richard Richie", avatar: AV("ebon") },
      { name: "Ayo Edebiri",          character: "Sydney Adamu",   avatar: AV("ayo") },
      { name: "Lionel Boyce",         character: "Marcus Brooks",  avatar: AV("lionel") },
    ],
    episodes: {
      1: [
        { episodeNum: 1, title: "System", runtime: "28m", airDate: "23 Jun 2022", rating: 4.4, overview: "Carmy assume a lanchonete de sua família e tenta modernizar os processos antigos." },
        { episodeNum: 2, title: "Hands",  runtime: "30m", airDate: "23 Jun 2022", rating: 4.5, overview: "A inspeção sanitária revela falhas e Carmy confronta Richie sobre sua atitude." },
        { episodeNum: 3, title: "Right",  runtime: "27m", airDate: "30 Jun 2022", rating: 4.6, overview: "A equipe precisa fechar o dia com vendas recorde para sobreviver ao mês." },
      ],
      2: [
        { episodeNum: 1, title: "Beef",     runtime: "32m", airDate: "22 Jun 2023", rating: 4.6, overview: "O plano de abrir um restaurante de alta gastronomia começa a tomar forma." },
        { episodeNum: 2, title: "Pasta",    runtime: "30m", airDate: "22 Jun 2023", rating: 4.7, overview: "Marcus vai para Copenhague aprender com os melhores chefs do mundo." },
        { episodeNum: 3, title: "Sundae",   runtime: "35m", airDate: "29 Jun 2023", rating: 4.5, overview: "A abertura do Bear se aproxima e cada detalhe precisa ser perfeito." },
      ],
      3: [
        { episodeNum: 1, title: "Doors",     runtime: "30m", airDate: "27 Jun 2024", rating: 4.7, overview: "O restaurante abre as portas sob extrema pressão e o caos culinário domina." },
        { episodeNum: 2, title: "Next",      runtime: "32m", airDate: "27 Jun 2024", rating: 4.6, overview: "Marcus treina novas receitas enquanto Carmy redefine o menu completo." },
        { episodeNum: 3, title: "Thunder",   runtime: "28m", airDate: "4 Jul 2024",  rating: 4.8, overview: "Richie organiza o salão principal e Sydney lida com as críticas da mídia." },
      ],
    },
    comments: [
      { user: { name: "Thá",        avatar: AV("tha") },    comment: "A edição dessa série é uma obra de arte. Transmite a ansiedade da cozinha como nenhuma outra.", time: "há 1h",    likes: 88, rating: 5 },
      { user: { name: "Gabi Lima",  avatar: AV("gabi") },   comment: "O episódio 'Review' da T2 é provavelmente o melhor episódio de TV já feito.",               time: "há 3 dias", likes: 61, rating: 5 },
    ],
  },
  arcane: {
    id: "arcane",
    originalTitle: "Arcane",
    tagline: "Toda lenda tem um começo.",
    year: 2021,
    runtime: "40 min",
    genres: ["Animação", "Ação", "Fantasia"],
    ageRating: "14+",
    averageRating: 4.9,
    ratingsCount: "22.5k",
    seasonsCount: 2,
    streamingPlatforms: [{ name: "Netflix", logoColor: "bg-red-700 border-red-800/80 text-white" }],
    cast: [
      { name: "Hailee Steinfeld",  character: "Vi",        avatar: AV("hailee") },
      { name: "Ella Purnell",      character: "Jinx",      avatar: AV("ella") },
      { name: "Kevin Alejandro",   character: "Jayce",     avatar: AV("kevin") },
      { name: "Reed Shannon",      character: "Ekko",      avatar: AV("reed") },
    ],
    episodes: {
      1: [
        { episodeNum: 1, title: "Welcome to the Playground",                     runtime: "40m", airDate: "6 Nov 2021",  rating: 4.6, overview: "Duas irmãs órfãs causam confusão nas ruas de Piltover após um roubo misterioso." },
        { episodeNum: 2, title: "Some Mysteries Are Better Left Unsolved",        runtime: "39m", airDate: "6 Nov 2021",  rating: 4.7, overview: "Jayce tenta defender suas pesquisas de magia científica no conselho acadêmico." },
        { episodeNum: 3, title: "The Base Violence Necessary for Change",         runtime: "44m", airDate: "6 Nov 2021",  rating: 4.9, overview: "O trágico destino separa Vi e Powder após o ataque ao laboratório subterrâneo." },
        { episodeNum: 4, title: "Happy Progress Day",                             runtime: "38m", airDate: "13 Nov 2021", rating: 4.8, overview: "Anos depois, Vi está presa enquanto Jinx semeia o caos em Piltover." },
        { episodeNum: 5, title: "Everybody Wants to Be My Enemy",                runtime: "41m", airDate: "13 Nov 2021", rating: 4.7, overview: "Vi e Jinx se reúnem em circunstâncias devastadoras." },
        { episodeNum: 6, title: "When These Walls Come Tumbling Down",           runtime: "43m", airDate: "13 Nov 2021", rating: 4.8, overview: "O conselho de Piltover tenta contornar a ameaça crescente de Zaun." },
        { episodeNum: 7, title: "The Boy Saviour",                               runtime: "39m", airDate: "20 Nov 2021", rating: 4.6, overview: "Ekko confronta Jinx em uma batalha carregada de emoção e nostalgia." },
        { episodeNum: 8, title: "Oil and Water",                                 runtime: "40m", airDate: "20 Nov 2021", rating: 4.7, overview: "Caitlyn e Vi precisam superar suas diferenças em busca de aliados." },
        { episodeNum: 9, title: "The Monster You Created",                       runtime: "48m", airDate: "20 Nov 2021", rating: 5.0, overview: "O destino de Piltover e Zaun é selado em uma conclusão épica e devastadora." },
      ],
      2: [
        { episodeNum: 1, title: "Heavy is the Crown",  runtime: "42m", airDate: "9 Nov 2024",  rating: 4.8, overview: "Vi e Jinx tomam caminhos opostos enquanto a guerra entre as duas cidades eclode." },
        { episodeNum: 2, title: "Some Mysteries…",     runtime: "44m", airDate: "9 Nov 2024",  rating: 4.7, overview: "Jinx lidera uma milícia enquanto os conselhos decidem o futuro de Piltover." },
        { episodeNum: 3, title: "Guns and Gossip",     runtime: "43m", airDate: "16 Nov 2024", rating: 4.9, overview: "O confronto final entre irmãs se torna inevitável." },
      ],
    },
    comments: [
      { user: { name: "Pedro F.",    avatar: AV("pedro") },  comment: "Visualmente o maior feito da animação mundial. Trilha sonora impecável.", time: "há 3 dias", likes: 104, rating: 5 },
      { user: { name: "Alice R.",    avatar: AV("alice") },  comment: "Não consigo acreditar que uma série baseada em game seja tão emocionante.", time: "há 1 sem",  likes: 78,  rating: 5 },
    ],
  },
};

function getSeriesDetailsFromMock(id: string, baseTitle?: MediaTitle): SeriesDetails {
  if (SERIES_DB[id]) return SERIES_DB[id];
  const title = baseTitle ?? mediaService.getMediaById(id);

  return {
    id,
    tagline: "Uma série original aclamada pelo público e crítica.",
    year: title?.year ?? 2023,
    runtime: "45 min",
    genres: ["Drama", "Mistério"],
    ageRating: "16+",
    averageRating: 4.6,
    ratingsCount: "2.4k",
    seasonsCount: 2,
    streamingPlatforms: [
      { name: "Netflix",      logoColor: "bg-red-700 border-red-800/80 text-white" },
      { name: "Prime Video",  logoColor: "bg-blue-800 border-blue-900/80 text-white" },
    ],
    cast: [
      { name: "Ator Principal",    character: "Protagonista", avatar: AV("cast1") },
      { name: "Ator Coadjuvante",  character: "Parceiro",     avatar: AV("cast2") },
    ],
    episodes: {
      1: [
        { episodeNum: 1, title: "Piloto",          runtime: "45m", airDate: "01 Out 2023", rating: 4.4, overview: "Introdução dos personagens centrais e conflito inicial." },
        { episodeNum: 2, title: "O Desdobramento", runtime: "43m", airDate: "08 Out 2023", rating: 4.5, overview: "A trama se complica com novas pistas reveladas." },
        { episodeNum: 3, title: "Revelações",      runtime: "46m", airDate: "15 Out 2023", rating: 4.6, overview: "O passado dos personagens começa a se revelar de forma surpreendente." },
      ],
      2: [
        { episodeNum: 1, title: "Nova Temporada",  runtime: "46m", airDate: "12 Set 2024", rating: 4.6, overview: "Novas intrigas começam após as consequências do final da temporada." },
        { episodeNum: 2, title: "O Retorno",       runtime: "44m", airDate: "19 Set 2024", rating: 4.5, overview: "Os personagens encaram as consequências de suas escolhas." },
      ],
    },
    comments: [
      { user: { name: "Cinéfilo Scena", avatar: AV("cin") }, comment: "Muito boa produção, vale a pena maratonar no final de semana.", time: "há 1 semana", likes: 12, rating: 4 },
    ],
  };
}

// ─── Main Page Component ──────────────────────────────────────────────────────

const EPISODE_TITLES: Record<string, Record<number, string>> = {
  severance: {
    1: "Good News About Hell",
    2: "Half Loop",
    3: "In Perpetuity",
    4: "The You You Are",
    5: "The Grim Barbarity of Baird Creek",
    6: "Hide and Seek",
    7: "Defiant Jazz",
    8: "What's for Dinner?",
    9: "The We We Are",
    10: "Trojan's Horse",
  },
  theBear: {
    1: "System",
    2: "Hands",
    3: "Brigade",
    4: "Dogs",
    5: "Sheridan",
    6: "Ceres",
    7: "Review",
    8: "Braciole",
    9: "Next",
    10: "Violet",
  },
  arcane: {
    1: "Welcome to the Playground",
    2: "Some Mysteries Are Better Left Unsolved",
    3: "The Base Violence Necessary for Change",
    4: "Happy Progress Day!",
    5: "Everybody Wants to Be My Enemy",
    6: "When These Walls Come Tumbling Down",
    7: "The Boy Saviour",
    8: "Oil and Water",
    9: "The Monster You Created",
  },
};

const UPCOMING_RELEASES: UpcomingRelease[] = [
  {
    id: "up1",
    titleId: "severance",
    episodeNum: "E6",
    episodeTitle: "Trojan's Horse",
    releaseDate: "Hoje, 21:00",
    countdown: "lanca em 2 horas",
    group: "today",
  },
  {
    id: "up2",
    titleId: "theBear",
    episodeNum: "E4",
    episodeTitle: "Violet",
    releaseDate: "Amanha, 19:00",
    countdown: "lanca em 24 horas",
    group: "tomorrow",
  },
  {
    id: "up3",
    titleId: "arcane",
    episodeNum: "T2 · E1",
    episodeTitle: "Nova Temporada",
    releaseDate: "Sexta-feira, 04:00",
    countdown: "lanca em 3 dias",
    group: "week",
  },
  {
    id: "up4",
    titleId: "strangerThings",
    episodeNum: "T5 · E1",
    episodeTitle: "O Comeco do Fim",
    releaseDate: "Em 4 dias",
    countdown: "lanca em 4 dias",
    group: "week",
  },
];

const RECENTLY_RELEASED: RecentlyReleased[] = [
  {
    id: "rr1",
    titleId: "succession",
    episodeLabel: "T4 · E10",
    episodeTitle: "Com Olhos Abertos",
    releasedAt: "Ontem",
  },
  {
    id: "rr2",
    titleId: "theBear",
    episodeLabel: "T3 · E2",
    episodeTitle: "Next",
    releasedAt: "Ha 2 dias",
  },
  {
    id: "rr3",
    titleId: "strangerThings",
    episodeLabel: "T4 · E9",
    episodeTitle: "O Plano de Onze",
    releasedAt: "Ha 3 dias",
  },
];

function asSeries(media: MediaTitle | undefined): Series | undefined {
  return media?.kind === "series" ? (media as Series) : undefined;
}

function hydrateWatchingItem(item: (typeof WATCHING)[number]): WatchingItem | undefined {
  const title = asSeries(mediaService.getMediaById(item.title.id));
  if (!title) return undefined;

  return {
    ...item,
    title,
  };
}

export const seriesService = {
  getSeries(id: string): Series | undefined {
    return asSeries(mediaService.getMediaById(id));
  },

  getAllSeries(): Series[] {
    return mediaService.getSeries() as Series[];
  },

  getSeriesDetails(id: string): SeriesDetails {
    return getSeriesDetailsFromMock(id, this.getSeries(id));
  },

  getWatching(): WatchingItem[] {
    return WATCHING.map(hydrateWatchingItem).filter(Boolean) as WatchingItem[];
  },

  getWatchingBySeriesId(id: string): WatchingItem | undefined {
    return this.getWatching().find((item) => item.title.id === id);
  },

  isWatching(id: string): boolean {
    return Boolean(this.getWatchingBySeriesId(id));
  },

  getSimilarSeries(id: string): Series[] {
    return this.getAllSeries().filter((series) => series.id !== id);
  },

  getEpisodeTitle(seriesId: string, episodeNumber: number): string | undefined {
    return EPISODE_TITLES[seriesId]?.[episodeNumber];
  },

  getUpcomingReleases(): UpcomingRelease[] {
    return UPCOMING_RELEASES;
  },

  getRecentlyReleased(): RecentlyReleased[] {
    return RECENTLY_RELEASED;
  },

  // ── Async TMDb-backed variants ─────────────────────────────────────────────

  async getSeriesAsync(id: string): Promise<Series | undefined> {
    const parsed = parseTmdbId(id);
    if (!parsed || parsed.kind !== "tv" || !tmdbClient.hasKey()) {
      return this.getSeries(id);
    }
    const details = await tmdbClient.tvDetails(parsed.tmdbId);
    return details ? mapTmdbTvToSeries(details) : this.getSeries(id);
  },

  async getSeriesDetailsAsync(id: string): Promise<SeriesDetails> {
    const parsed = parseTmdbId(id);
    if (!parsed || parsed.kind !== "tv" || !tmdbClient.hasKey()) {
      return this.getSeriesDetails(id);
    }
    const details = await tmdbClient.tvDetails(parsed.tmdbId);
    if (!details) return this.getSeriesDetails(id);

    const validSeasons = (details.seasons ?? []).filter((s) => s.season_number > 0);
    const [seasons, credits, providers] = await Promise.all([
      Promise.all(
        validSeasons.map((s) => tmdbClient.tvSeason(parsed.tmdbId, s.season_number)),
      ).then((arr) => arr.filter(Boolean) as NonNullable<Awaited<ReturnType<typeof tmdbClient.tvSeason>>>[]),
      tmdbClient.tvCredits(parsed.tmdbId),
      tmdbClient.tvWatchProviders(parsed.tmdbId),
    ]);

    return mapTmdbToSeriesDetails({ details, seasons, credits, providers });
  },

  async getSimilarSeriesAsync(id: string): Promise<Series[]> {
    const parsed = parseTmdbId(id);
    if (!parsed || parsed.kind !== "tv" || !tmdbClient.hasKey()) {
      return this.getSimilarSeries(id);
    }
    const recs = await tmdbClient.tvRecommendations(parsed.tmdbId);
    if (!recs?.results?.length) return this.getSimilarSeries(id);
    return recs.results.slice(0, 12).map(mapTmdbTvToSeries);
  },
};
