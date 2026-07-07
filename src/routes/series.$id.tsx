import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  Check,
  Calendar,
  Heart,
  Plus,
  Share2,
  Star,
  MessageCircle,
  Play,
  Flame,
  ChevronDown,
  ArrowLeft,
  Tv,
} from "lucide-react";
import { AppShell } from "@/components/scena/AppShell";
import { TITLES, ALL_TITLES, PROFILE, WATCHING, type Title } from "@/lib/scena-data";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/series/$id")({
  head: ({ params }) => {
    const titleInfo = TITLES[params.id];
    return {
      meta: [
        { title: titleInfo ? `${titleInfo.title} · Scena` : "Detalhes da Série · Scena" },
        { name: "description", content: "Veja episódios, progresso, elenco e avaliações." },
      ],
    };
  },
  component: SeriesDetailsPage,
});

interface CastMember {
  name: string;
  character: string;
  avatar: string;
}

interface EpisodeData {
  episodeNum: number;
  title: string;
  runtime: string;
  airDate: string;
  rating: number;
  overview: string;
}

interface CommentData {
  user: { name: string; avatar: string };
  comment: string;
  time: string;
  likes: number;
  rating?: number;
}

interface SeriesDetails {
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
  streamingPlatforms: { name: string; logoColor: string }[];
  cast: CastMember[];
  episodes: Record<number, EpisodeData[]>;
  comments: CommentData[];
}

const AV = (seed: string) => `https://i.pravatar.cc/100?u=${encodeURIComponent(seed)}`;

// Detailed mock database for main series
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
    streamingPlatforms: [
      { name: "Apple TV", logoColor: "bg-black text-white" }
    ],
    cast: [
      { name: "Adam Scott", character: "Mark Scout", avatar: AV("adam") },
      { name: "Britt Lower", character: "Helly R.", avatar: AV("britt") },
      { name: "Patricia Arquette", character: "Harmony Cobel", avatar: AV("patricia") },
      { name: "Zach Cherry", character: "Dylan George", avatar: AV("zach") },
      { name: "John Turturro", character: "Irving Bailiff", avatar: AV("john") },
      { name: "Christopher Walken", character: "Burt Goodman", avatar: AV("chris") },
    ],
    episodes: {
      1: [
        { episodeNum: 1, title: "Good News About Hell", runtime: "48m", airDate: "18 Fev 2022", rating: 4.6, overview: "Mark é promovido a chefe da equipe da divisão de refinamento de macro-dados cortados." },
        { episodeNum: 2, title: "Half Loop", runtime: "46m", airDate: "18 Fev 2022", rating: 4.5, overview: "A equipe treina a nova recruta Helly, que logo começa a se rebelar contra as regras." },
        { episodeNum: 3, title: "In Perpetuity", runtime: "48m", airDate: "25 Fev 2022", rating: 4.7, overview: "Helly tenta enviar uma mensagem para sua versão externa enquanto Irving faz descobertas." },
        { episodeNum: 4, title: "The You You Are", runtime: "50m", airDate: "4 Mar 2022", rating: 4.6, overview: "Mark encontra um livro de autoajuda misterioso deixado por um ex-funcionário." },
        { episodeNum: 5, title: "The Grim Barbarity of Baird Creek", runtime: "44m", airDate: "11 Mar 2022", rating: 4.8, overview: "A equipe de refinamento explora novas salas enquanto as tensões aumentam." },
      ],
      2: [
        { episodeNum: 1, title: "Arrive Alive", runtime: "52m", airDate: "23 Out 2025", rating: 4.7, overview: "Mark e Helly tentam entender as consequências das revelações de suas identidades externas." },
        { episodeNum: 2, title: "Trojan's Horse", runtime: "54m", airDate: "30 Out 2025", rating: 4.8, overview: "Dylan descobre segredos chocantes sobre as operações secretas da Lumon." },
        { episodeNum: 3, title: "The We We Are", runtime: "50m", airDate: "6 Nov 2025", rating: 4.9, overview: "A equipe elabora um plano arriscado para se libertar definitivamente." },
        { episodeNum: 4, title: "What's for Dinner?", runtime: "48m", airDate: "13 Nov 2025", rating: 4.7, overview: "Cobel endurece sua fiscalização e Mark enfrenta uma nova rodada de testes." },
        { episodeNum: 5, title: "Sunder", runtime: "50m", airDate: "20 Nov 2025", rating: 4.8, overview: "A mente de Mark começa a falhar entre seus dois lados." },
      ]
    },
    comments: [
      { user: { name: "Lucas Melo", avatar: AV("luke") }, comment: "Essa é a melhor série de ficção científica da década. A direção de arte é perfeita.", time: "há 2 dias", likes: 45, rating: 5 },
      { user: { name: "Mariana Costa", avatar: AV("mariana") }, comment: "O final da primeira temporada me deixou sem respirar por horas. Genial!", time: "há 5 dias", likes: 32, rating: 5 },
    ]
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
    streamingPlatforms: [
      { name: "Disney+", logoColor: "bg-[#00003c] text-white" }
    ],
    cast: [
      { name: "Jeremy Allen White", character: "Carmen 'Carmy' Berzatto", avatar: AV("jeremy") },
      { name: "Ebon Moss-Bachrach", character: "Richard 'Richie' Jerimovich", avatar: AV("ebon") },
      { name: "Ayo Edebiri", character: "Sydney Adamu", avatar: AV("ayo") },
      { name: "Lionel Boyce", character: "Marcus Brooks", avatar: AV("lionel") },
    ],
    episodes: {
      1: [
        { episodeNum: 1, title: "System", runtime: "28m", airDate: "23 Jun 2022", rating: 4.4, overview: "Carmy assume a lanchonete de sua família e tenta modernizar os processos antigos." },
        { episodeNum: 2, title: "Hands", runtime: "30m", airDate: "23 Jun 2022", rating: 4.5, overview: "A inspeção sanitária revela falhas e Carmy confronta Richie sobre sua atitude." },
      ],
      2: [
        { episodeNum: 1, title: "Beef", runtime: "32m", airDate: "22 Jun 2023", rating: 4.6, overview: "O plano de abrir um restaurante de alta gastronomia começa a tomar forma." },
      ],
      3: [
        { episodeNum: 1, title: "Doors", runtime: "30m", airDate: "27 Jun 2024", rating: 4.7, overview: "O restaurante abre as portas sob extrema pressão e o caos culinário domina." },
        { episodeNum: 2, title: "Next", runtime: "32m", airDate: "27 Jun 2024", rating: 4.6, overview: "Marcus treina novas receitas enquanto Carmy redefine o menu completo." },
        { episodeNum: 3, title: "Doors (Part 2)", runtime: "28m", airDate: "4 Jul 2024", rating: 4.8, overview: "Richie organiza o salão principal e Sydney lida com as críticas." },
      ]
    },
    comments: [
      { user: { name: "Thá", avatar: AV("tha") }, comment: "A edição dessa série é uma obra de arte. Transmite a ansiedade da cozinha como nenhuma outra.", time: "há 1h", likes: 88, rating: 5 },
    ]
  },
  arcane: {
    id: "arcane",
    originalTitle: "Arcane",
    tagline: "Toda lenda tem um começo.",
    year: 2021,
    runtime: "40 min",
    genres: ["Animação", "Ação", "Fantasia", "Ficção Científica"],
    ageRating: "14+",
    averageRating: 4.9,
    ratingsCount: "22.5k",
    seasonsCount: 2,
    streamingPlatforms: [
      { name: "Netflix", logoColor: "bg-red-600 text-white" }
    ],
    cast: [
      { name: "Hailee Steinfeld", character: "Vi", avatar: AV("hailee") },
      { name: "Ella Purnell", character: "Jinx", avatar: AV("ella") },
      { name: "Kevin Alejandro", character: "Jayce Talis", avatar: AV("kevin") },
      { name: "Reed Shannon", character: "Ekko", avatar: AV("reed") },
    ],
    episodes: {
      1: [
        { episodeNum: 1, title: "Welcome to the Playground", runtime: "40m", airDate: "6 Nov 2021", rating: 4.6, overview: "Duas irmãs órfãs causam confusão nas ruas de Piltover após um roubo misterioso." },
        { episodeNum: 2, title: "Some Mysteries Are Better Left Unsolved", runtime: "39m", airDate: "6 Nov 2021", rating: 4.7, overview: "Jayce tenta defender suas pesquisas de magia científica no conselho acadêmico." },
        { episodeNum: 3, title: "The Base Violence Necessary for Change", runtime: "44m", airDate: "6 Nov 2021", rating: 4.9, overview: "O trágico destino separa Vi e Powder após o ataque ao laboratório subterrâneo." },
      ],
      2: [
        { episodeNum: 1, title: "Nova Temporada (E1)", runtime: "42m", airDate: "9 Nov 2024", rating: 4.8, overview: "Vi e Jinx tomam caminhos opostos enquanto a guerra entre as duas cidades eclode." },
      ]
    },
    comments: [
      { user: { name: "Pedro F.", avatar: AV("pedro") }, comment: "Visualmente o maior feito da animação mundial. Trilha sonora impecável.", time: "há 3 dias", likes: 104, rating: 5 },
    ]
  }
};

// Helper generator to provide fallback details for any series in scena-data
function getSeriesDetails(id: string, baseTitle?: Title): SeriesDetails {
  if (SERIES_DB[id]) return SERIES_DB[id];

  const title = baseTitle || TITLES[id] || {
    id,
    title: id.charAt(0).toUpperCase() + id.slice(1),
    year: 2023,
    kind: "series" as const,
    backdrop: "https://image.tmdb.org/t/p/w1280/56v2KjBlU4XaOv9rVYEQypROD7P.jpg",
  };

  // Generate standard fallback values
  return {
    id: title.id,
    tagline: "Uma série original aclamada pelo público e crítica.",
    year: title.year,
    runtime: "45 min",
    genres: ["Drama", "Mistério"],
    ageRating: "16+",
    averageRating: 4.6,
    ratingsCount: "2.4k",
    seasonsCount: 2,
    streamingPlatforms: [
      { name: "Netflix", logoColor: "bg-red-600 text-white" },
      { name: "Prime Video", logoColor: "bg-blue-500 text-white" }
    ],
    cast: [
      { name: "Ator Principal", character: "Protagonista", avatar: AV("cast1") },
      { name: "Ator Coadjuvante", character: "Parceiro", avatar: AV("cast2") },
    ],
    episodes: {
      1: [
        { episodeNum: 1, title: "Piloto", runtime: "45m", airDate: "01 Out 2023", rating: 4.4, overview: "Introdução dos personagens centrais e conflito inicial." },
        { episodeNum: 2, title: "O Desdobramento", runtime: "43m", airDate: "08 Out 2023", rating: 4.5, overview: "A trama se complica com novas pistas reveladas." },
      ],
      2: [
        { episodeNum: 1, title: "Estreia da Temporada", runtime: "46m", airDate: "12 Set 2024", rating: 4.6, overview: "Novas intrigas começam após as consequências do final da temporada." },
      ]
    },
    comments: [
      { user: { name: "Cinéfilo Scena", avatar: AV("cin") }, comment: "Muito boa produção, vale a pena maratonar no final de semana.", time: "há 1 semana", likes: 12, rating: 4 }
    ]
  };
}

function SeriesDetailsPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();

  const titleBase = TITLES[id];
  const details = useMemo(() => getSeriesDetails(id, titleBase), [id, titleBase]);

  // UI Interactive States
  const [status, setStatus] = useState<string>(() => {
    const isActivelyWatching = WATCHING.some((w) => w.title.id === id);
    return isActivelyWatching ? "Watching" : "Want to Watch";
  });

  const [isFavorited, setIsFavorited] = useState(false);
  const [userRating, setUserRating] = useState<number>(0);
  const [selectedSeason, setSelectedSeason] = useState<number>(1);
  const [commentsList, setCommentsList] = useState<CommentData[]>(() => details.comments);
  const [newCommentText, setNewCommentText] = useState("");
  const [sortOrder, setSortOrder] = useState<"likes" | "new">("likes");

  // Dynamic Progress States (linked to toggles)
  const initialWatched = useMemo(() => {
    const watchingItem = WATCHING.find((w) => w.title.id === id);
    if (watchingItem) return watchingItem.watchedEpisodes;
    return status === "Finished" ? 10 : 0;
  }, [id, status]);

  const [watchedCount, setWatchedCount] = useState(initialWatched);

  const totalEpisodesCount = useMemo(() => {
    let sum = 0;
    Object.values(details.episodes).forEach((eps) => {
      sum += eps.length;
    });
    return sum || 10;
  }, [details]);

  // Track episode watch status locally
  const [watchedEpisodes, setWatchedEpisodes] = useState<Record<string, boolean>>(() => {
    const initialMap: Record<string, boolean> = {};
    const watchingItem = WATCHING.find((w) => w.title.id === id);
    let count = 0;
    
    // Auto-mark first count episodes as watched
    const limit = watchingItem ? watchingItem.watchedEpisodes : (status === "Finished" ? totalEpisodesCount : 0);
    
    Object.entries(details.episodes).forEach(([sNum, eps]) => {
      eps.forEach((ep) => {
        count++;
        if (count <= limit) {
          initialMap[`${sNum}-${ep.episodeNum}`] = true;
        }
      });
    });
    return initialMap;
  });

  // Recalculate watched count and updates statuses accordingly
  const progressPercent = Math.round((watchedCount / totalEpisodesCount) * 100);

  const toggleEpisodeWatched = (seasonNum: number, episodeNum: number, episodeTitle: string) => {
    const key = `${seasonNum}-${episodeNum}`;
    const wasWatched = !!watchedEpisodes[key];
    const newMap = { ...watchedEpisodes, [key]: !wasWatched };
    setWatchedEpisodes(newMap);

    // Compute new count
    let newCount = 0;
    Object.keys(newMap).forEach((k) => {
      if (newMap[k]) newCount++;
    });
    setWatchedCount(newCount);

    if (!wasWatched) {
      toast.success(`Marcou como visto!`, {
        description: `Temporada ${seasonNum} · Episódio ${episodeNum}: "${episodeTitle}"`,
      });

      // Update state triggers
      if (newCount === totalEpisodesCount) {
        setStatus("Finished");
        toast.success(`Parabéns! Você completou a série! 🎉`, {
          description: `Todos os ${totalEpisodesCount} episódios de ${details.tagline} foram assistidos.`,
        });
      } else if (status !== "Watching") {
        setStatus("Watching");
      }
    } else {
      toast.info(`Removeu marcação de visto`, {
        description: `Temporada ${seasonNum} · Episódio ${episodeNum}: "${episodeTitle}"`,
      });
      if (newCount === 0) {
        setStatus("Want to Watch");
      } else if (newCount < totalEpisodesCount && status === "Finished") {
        setStatus("Watching");
      }
    }
  };

  // Change overall status
  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus);
    
    let count = 0;
    const newMap: Record<string, boolean> = {};

    if (newStatus === "Finished") {
      count = totalEpisodesCount;
      Object.entries(details.episodes).forEach(([sNum, eps]) => {
        eps.forEach((ep) => {
          newMap[`${sNum}-${ep.episodeNum}`] = true;
        });
      });
      setWatchedCount(count);
      setWatchedEpisodes(newMap);
      toast.success("Série marcada como concluída! 🎉");
    } else if (newStatus === "Want to Watch" || newStatus === "Abandoned") {
      setWatchedCount(0);
      setWatchedEpisodes({});
      toast.info(`Status alterado para: ${newStatus}`);
    } else {
      toast.info(`Status alterado para: ${newStatus}`);
    }
  };

  // Favorite toggle
  const toggleFavorite = () => {
    setIsFavorited((prev) => {
      const state = !prev;
      if (state) {
        toast.success(`Favoritou ${details.originalTitle || titleBase?.title}!`, {
          description: "Adicionado aos seus favoritos públicos.",
        });
      } else {
        toast.info(`Removeu dos favoritos.`);
      }
      return state;
    });
  };

  // Share action
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: titleBase?.title,
        text: details.tagline,
        url: window.location.href,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copiado para a área de transferência!");
    }
  };

  // Add to List trigger
  const handleAddToList = () => {
    toast.success("Lista atualizada!", {
      description: `"${titleBase?.title}" foi adicionada à sua coleção.`,
    });
  };

  // Rating trigger
  const handleRate = (stars: number) => {
    setUserRating(stars);
    toast.success(`Você avaliou com ${stars} estrelas!`, {
      description: "Sua avaliação foi compartilhada com a comunidade.",
    });
  };

  // Add community comment
  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    const newComment: CommentData = {
      user: {
        name: PROFILE.name,
        avatar: PROFILE.avatar,
      },
      comment: newCommentText,
      time: "Agora mesmo",
      likes: 0,
      rating: userRating || undefined,
    };

    setCommentsList((prev) => [newComment, ...prev]);
    setNewCommentText("");
    toast.success("Comentário publicado!");
  };

  // Sort comments logic
  const sortedComments = useMemo(() => {
    return [...commentsList].sort((a, b) => {
      if (sortOrder === "likes") return b.likes - a.likes;
      return 0; // maintain default new insertion order
    });
  }, [commentsList, sortOrder]);

  const activeEpisodes = details.episodes[selectedSeason] || [];

  return (
    <AppShell>
      {/* Back Button */}
      <button
        onClick={() => window.history.back()}
        className="mb-4 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Voltar
      </button>

      {/* SECTION 1: Cinematic Header Backdrop */}
      <section className="-mx-5 relative min-h-[300px] overflow-hidden px-5 mb-8">
        {/* Backdrop Background */}
        <div className="absolute inset-0 z-0 overflow-hidden" aria-hidden>
          <img
            src={titleBase?.backdrop || "https://image.tmdb.org/t/p/w1280/q8eejQcg1bAqImEV8jh8RtBD4uH.jpg"}
            alt=""
            className="h-full w-full object-cover opacity-35"
          />
          {/* Subtle vignettes and dark overlay fading to page background */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#090909] via-[#090909]/60 to-black/30" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#090909] via-transparent to-transparent" />
        </div>

        {/* Header content card overlay */}
        <div className="relative z-10 flex gap-4 pt-12 items-end">
          {/* Official poster on the left */}
          <img
            src={titleBase?.poster || titleBase?.backdrop}
            alt={titleBase?.title}
            className="w-[100px] aspect-[2/3] object-cover rounded-2xl border border-white/10 shadow-[0_24px_50px_rgba(0,0,0,0.8)] shrink-0 bg-surface-2"
          />
          <div className="min-w-0 flex-1 pb-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-accent/95">
              Série · {details.year} · {details.ageRating}
            </span>
            <h1 className="tracking-title text-[24px] font-extrabold text-foreground leading-[1.1] mt-1.5 break-words">
              {titleBase?.title}
            </h1>
            {details.originalTitle && details.originalTitle !== titleBase?.title && (
              <div className="text-[12px] italic text-muted-foreground/80 mt-0.5">
                Título Original: {details.originalTitle}
              </div>
            )}
            <div className="text-[11px] text-muted-foreground mt-2 flex flex-wrap gap-2 items-center">
              <span>{details.runtime} por ep.</span>
              <span>•</span>
              <span>{details.seasonsCount} Temporadas</span>
            </div>
            {/* Rating scores */}
            <div className="mt-2.5 flex items-center gap-1.5">
              <div className="flex items-center gap-0.5 text-accent text-xs font-bold bg-accent/15 border border-accent/25 px-1.5 py-0.5 rounded-md">
                <Star className="h-3.5 w-3.5 fill-current" />
                <span>{details.averageRating}</span>
              </div>
              <span className="text-[11px] text-muted-foreground">
                ({details.ratingsCount} avaliações)
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: CTAs and Status selectors */}
      <section className="mb-8 grid grid-cols-2 gap-3">
        {/* Start / Continue button */}
        {status === "Watching" || status === "Finished" ? (
          <button
            onClick={() => {
              toast.success("Retomando reprodução no player...", {
                description: `Carregando Temporada ${selectedSeason} · Episódio 1...`,
              });
            }}
            className="flex items-center justify-center gap-2 rounded-2xl bg-accent text-accent-foreground font-bold text-[13px] py-3.5 shadow-lg active:scale-95 transition-transform duration-200 cursor-pointer"
          >
            <Play className="h-4.5 w-4.5 fill-current ml-0.5" strokeWidth={0} />
            Continuar Assistindo
          </button>
        ) : (
          <button
            onClick={() => handleStatusChange("Watching")}
            className="flex items-center justify-center gap-2 rounded-2xl bg-accent text-accent-foreground font-bold text-[13px] py-3.5 shadow-lg active:scale-95 transition-transform duration-200 cursor-pointer"
          >
            <Tv className="h-4.5 w-4.5" />
            Começar a Assistir
          </button>
        )}

        {/* Status Dropdown */}
        <div className="relative group">
          <select
            value={status}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="w-full bg-secondary border border-border text-foreground font-semibold text-[13px] py-3.5 px-4 rounded-2xl appearance-none focus:outline-none focus:ring-1 focus:ring-accent cursor-pointer pr-10 text-center"
          >
            <option value="Want to Watch">Quero Assistir</option>
            <option value="Watching">Assistindo</option>
            <option value="Finished">Finalizado (Em dia)</option>
            <option value="Paused">Pausado</option>
            <option value="Abandoned">Abandonado</option>
          </select>
          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        </div>
      </section>

      {/* SECTION 3: Active Progress Dashboard */}
      {(status === "Watching" || watchedCount > 0) && (
        <section className="card-surface p-5 mb-8 animate-fade-in">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-bold text-accent uppercase tracking-widest">
                Seu Progresso
              </span>
              <h3 className="text-[16px] font-bold text-foreground mt-1">
                {watchedCount === totalEpisodesCount ? "Série Concluída" : "Em andamento"}
              </h3>
            </div>
            {/* Simulated streak */}
            <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full text-[10px] font-bold text-amber-500 uppercase tracking-wider">
              <Flame className="h-3 w-3 fill-current" />
              <span>3 dias streak</span>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {watchedCount} de {totalEpisodesCount} episódios vistos
            </span>
            <span className="font-bold text-foreground">{progressPercent}%</span>
          </div>

          <div className="mt-2 h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-accent rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </section>
      )}

      {/* SECTION 4: Quick Action Panel */}
      <section className="flex justify-between items-center bg-card/45 border border-border p-4 rounded-3xl mb-8">
        <div className="flex gap-1 justify-around w-full">
          {/* Favorite */}
          <button
            onClick={toggleFavorite}
            className={cn(
              "flex flex-col items-center gap-1.5 p-2 rounded-2xl hover:bg-white/5 active:scale-95 transition-all cursor-pointer flex-1",
              isFavorited ? "text-red-500" : "text-muted-foreground hover:text-foreground"
            )}
            aria-label="Favoritar"
          >
            <Heart className={cn("h-5 w-5", isFavorited && "fill-current")} strokeWidth={1.6} />
            <span className="text-[10px] font-medium tracking-wide">Favorito</span>
          </button>

          {/* Add to List */}
          <button
            onClick={handleAddToList}
            className="flex flex-col items-center gap-1.5 p-2 rounded-2xl hover:bg-white/5 active:scale-95 transition-all text-muted-foreground hover:text-foreground cursor-pointer flex-1"
            aria-label="Adicionar à lista"
          >
            <Plus className="h-5 w-5" strokeWidth={1.6} />
            <span className="text-[10px] font-medium tracking-wide">Na Lista</span>
          </button>

          {/* Share */}
          <button
            onClick={handleShare}
            className="flex flex-col items-center gap-1.5 p-2 rounded-2xl hover:bg-white/5 active:scale-95 transition-all text-muted-foreground hover:text-foreground cursor-pointer flex-1"
            aria-label="Compartilhar"
          >
            <Share2 className="h-5 w-5" strokeWidth={1.6} />
            <span className="text-[10px] font-medium tracking-wide">Partilhar</span>
          </button>

          {/* Comment */}
          <a
            href="#comments"
            className="flex flex-col items-center gap-1.5 p-2 rounded-2xl hover:bg-white/5 active:scale-95 transition-all text-muted-foreground hover:text-foreground cursor-pointer flex-1 text-center"
            aria-label="Comentar"
          >
            <MessageCircle className="h-5 w-5 mx-auto" strokeWidth={1.6} />
            <span className="text-[10px] font-medium tracking-wide">Comentar</span>
          </a>

          {/* Rate Panel */}
          <div className="flex flex-col items-center gap-1.5 p-2 flex-1 relative group">
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  onClick={() => handleRate(s)}
                  className="cursor-pointer"
                  aria-label={`Avaliar com ${s} estrelas`}
                >
                  <Star
                    className={cn(
                      "h-3.5 w-3.5 transition-colors",
                      s <= userRating ? "text-accent fill-current" : "text-muted-foreground/30 hover:text-accent/60"
                    )}
                    strokeWidth={1.4}
                  />
                </button>
              ))}
            </div>
            <span className="text-[10px] font-medium text-muted-foreground tracking-wide mt-1 leading-none select-none">
              Avaliar
            </span>
          </div>
        </div>
      </section>

      {/* SECTION 5: Where to Watch */}
      <section className="mb-10">
        <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-3.5">
          Onde Assistir
        </h3>
        <div className="flex flex-wrap gap-2.5">
          {details.streamingPlatforms.map((stream) => (
            <div
              key={stream.name}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-border/80 font-bold text-[13px] tracking-wide",
                stream.logoColor
              )}
            >
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              {stream.name}
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 6: Season selector & Episode list grid */}
      <section className="mb-10">
        <SectionTitle
          eyebrow="Lista de episódios"
          title="Episódios"
        />

        {/* Season tab list */}
        <div className="-mx-5 flex border-b border-border/60 px-5 gap-6 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden mb-6">
          {Array.from({ length: details.seasonsCount }).map((_, idx) => {
            const seasonNum = idx + 1;
            const isActive = selectedSeason === seasonNum;
            return (
              <button
                key={seasonNum}
                onClick={() => setSelectedSeason(seasonNum)}
                className={cn(
                  "py-3 text-[12.5px] font-bold tracking-wide relative shrink-0 cursor-pointer transition-colors duration-200",
                  isActive ? "text-foreground" : "text-muted-foreground/70 hover:text-foreground"
                )}
              >
                Temporada {seasonNum}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2.5px] rounded-full bg-accent" />
                )}
              </button>
            );
          })}
        </div>

        {/* Episode cards grid */}
        <div className="space-y-4">
          {activeEpisodes.map((ep) => {
            const key = `${selectedSeason}-${ep.episodeNum}`;
            const epWatched = !!watchedEpisodes[key];

            return (
              <div
                key={ep.episodeNum}
                className={cn(
                  "flex gap-3.5 p-3 rounded-2xl border border-border bg-card/45 relative transition-all duration-300",
                  epWatched && "border-accent/10 bg-accent/[0.01]"
                )}
              >
                {/* Episode thumbnail preview */}
                <div className="relative aspect-[16/9] w-[100px] shrink-0 rounded-xl overflow-hidden bg-surface-2 border border-border">
                  <img
                    src={titleBase?.backdrop}
                    alt=""
                    className="h-full w-full object-cover opacity-60"
                  />
                  <div className="absolute inset-0 bg-black/30" />
                  <div className="absolute bottom-1.5 left-2 text-[10px] font-extrabold text-foreground bg-black/50 px-1 py-0.2 rounded">
                    Ep. {ep.episodeNum}
                  </div>
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                  <div>
                    <h4 className="text-[13.5px] font-bold text-foreground truncate">
                      {ep.title}
                    </h4>
                    <p className="text-[10px] text-muted-foreground/90 mt-1 flex flex-wrap gap-1.5 items-center">
                      <span>{ep.runtime}</span>
                      <span>•</span>
                      <span>{ep.airDate}</span>
                      <span>•</span>
                      <span className="flex items-center gap-0.5 text-accent">
                        ★ {ep.rating}
                      </span>
                    </p>
                  </div>

                  {/* Mark Watched Button */}
                  <div className="flex items-center justify-between mt-2.5">
                    <span className="text-[10px] text-muted-foreground leading-none">
                      {epWatched ? "Assistido" : "Não visto"}
                    </span>
                    <button
                      onClick={() => toggleEpisodeWatched(selectedSeason, ep.episodeNum, ep.title)}
                      className={cn(
                        "flex h-7 w-7 items-center justify-center rounded-full border transition-all duration-200 active:scale-90 cursor-pointer",
                        epWatched
                          ? "bg-accent border-accent text-accent-foreground shadow"
                          : "border-border text-muted-foreground/70 hover:text-foreground hover:bg-white/5"
                      )}
                      aria-label={epWatched ? "Marcar como não visto" : "Marcar como assistido"}
                    >
                      <Check className="h-3.5 w-3.5" strokeWidth={3} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* SECTION 7: Casting Row */}
      <section className="mb-10">
        <SectionTitle
          eyebrow="Equipe"
          title="Elenco principal"
        />
        <div className="-mx-5 flex gap-4 overflow-x-auto px-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pb-1">
          {details.cast.map((actor) => (
            <div
              key={actor.name}
              className="w-[85px] shrink-0 text-center cursor-pointer active:scale-95 transition-transform"
              onClick={() => toast.info("Página de detalhes do ator em breve!")}
            >
              <img
                src={actor.avatar}
                alt={actor.name}
                className="h-14 w-14 rounded-full border border-border mx-auto object-cover bg-surface-2"
              />
              <div className="mt-2 text-[11px] font-bold text-foreground truncate">
                {actor.name}
              </div>
              <div className="text-[9.5px] text-muted-foreground truncate">
                {actor.character}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 8: Similar Series Recommendation Carousel */}
      <section className="mb-10">
        <SectionTitle
          eyebrow="Sugestões"
          title="Séries semelhantes"
        />
        <div className="-mx-5 flex gap-4 overflow-x-auto px-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pb-2">
          {ALL_TITLES.filter((t) => t.kind === "series" && t.id !== id).map((t) => (
            <Link
              key={t.id}
              to="/series/$id"
              params={{ id: t.id }}
              className="w-[100px] shrink-0 group active:scale-[0.98] transition-all"
            >
              <div className="aspect-[2/3] w-full overflow-hidden rounded-xl border border-border bg-surface-2 relative shadow">
                <img
                  src={t.poster ?? t.backdrop}
                  alt={t.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="mt-2 truncate text-[11.5px] font-bold text-foreground group-hover:text-accent transition-colors">
                {t.title}
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* SECTION 9: Ratings & Community reviews */}
      <section className="mb-10">
        <SectionTitle
          eyebrow="Avaliações"
          title="Crítica e notas"
        />
        <div className="grid grid-cols-3 gap-3 bg-card/45 border border-border p-4.5 rounded-3xl items-center text-center">
          <div className="border-r border-border/80">
            <div className="text-[26px] font-black text-foreground leading-none">
              {details.averageRating}
            </div>
            <div className="text-[8.5px] uppercase tracking-wider text-muted-foreground mt-1.5">
              Comunidade
            </div>
          </div>
          <div className="border-r border-border/80">
            <div className="text-[26px] font-black text-accent leading-none">
              {userRating ? `${userRating}.0` : "—"}
            </div>
            <div className="text-[8.5px] uppercase tracking-wider text-muted-foreground mt-1.5">
              Sua nota
            </div>
          </div>
          <div>
            <div className="text-[26px] font-black text-foreground leading-none">94%</div>
            <div className="text-[8.5px] uppercase tracking-wider text-muted-foreground mt-1.5">
              Recomendam
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 10: Comments & Sort controls */}
      <section id="comments" className="mb-6 animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <SectionTitle
            eyebrow="Comunidade"
            title="Comentários"
          />
          {/* Sorting */}
          <div className="flex gap-2">
            <button
              onClick={() => setSortOrder("likes")}
              className={cn(
                "px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-colors",
                sortOrder === "likes"
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Curtidos
            </button>
            <button
              onClick={() => setSortOrder("new")}
              className={cn(
                "px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-colors",
                sortOrder === "new"
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Recentes
            </button>
          </div>
        </div>

        {/* Comment input form */}
        <form onSubmit={handlePostComment} className="flex gap-3 mb-6 items-start">
          <img
            src={PROFILE.avatar}
            alt={PROFILE.name}
            className="h-8 w-8 rounded-full border border-border object-cover shrink-0"
          />
          <div className="flex-1">
            <textarea
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
              placeholder="Escreva um comentário sobre a série…"
              rows={2}
              className="w-full bg-surface-2 border border-border rounded-xl p-3 text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent resize-none"
            />
            <div className="mt-2 flex justify-end">
              <button
                type="submit"
                disabled={!newCommentText.trim()}
                className="px-3 py-1.5 rounded-lg bg-accent text-accent-foreground text-[11px] font-bold shadow hover:scale-[1.01] active:scale-95 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
              >
                Comentar
              </button>
            </div>
          </div>
        </form>

        {/* Comments list */}
        <div className="space-y-4">
          {sortedComments.map((com, idx) => (
            <div key={idx} className="flex gap-3.5 border-b border-border/40 pb-4.5 last:border-0 last:pb-0">
              <img
                src={com.user.avatar}
                alt={com.user.name}
                className="h-8 w-8 rounded-full border border-border object-cover shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[12.5px] font-semibold text-foreground">
                      {com.user.name}
                    </span>
                    {com.rating && (
                      <span className="inline-flex items-center gap-0.5 text-accent text-[10px] font-bold bg-accent/15 px-1 py-0.2 rounded border border-accent/20">
                        ★ {com.rating}.0
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground">{com.time}</span>
                </div>
                <p className="mt-1.5 text-[13px] leading-relaxed text-foreground/80 break-words">
                  {com.comment}
                </p>
                {/* Likes row */}
                <div className="mt-2.5 flex items-center gap-4 text-[11.5px] text-muted-foreground">
                  <button
                    onClick={() => {
                      setCommentsList((prev) =>
                        prev.map((c, i) => (i === idx ? { ...c, likes: c.likes + 1 } : c))
                      );
                      toast.success("Comentário curtido!");
                    }}
                    className="hover:text-foreground active:scale-95 transition-transform cursor-pointer"
                  >
                    Curtir ({com.likes})
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
