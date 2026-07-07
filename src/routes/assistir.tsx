import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Check, Calendar, Bell, BellRing, Play } from "lucide-react";
import { AppShell, SectionTitle } from "@/components/scena/AppShell";
import { WATCHING as INITIAL_WATCHING, TITLES, PROFILE, type WatchingItem } from "@/lib/scena-data";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/assistir")({
  head: () => ({
    meta: [
      { title: "Assistir · Scena" },
      { name: "description", content: "Continue suas séries em andamento." },
    ],
  }),
  component: AssistirPage,
});

// A localized mapping of episode titles to make the "next episode" advancement feel real and premium
const EPISODE_TITLES: Record<string, Record<number, string>> = {
  severance: {
    5: "Arrive Alive",
    6: "Trojan's Horse",
    7: "The We We Are",
    8: "What's for Dinner?",
    9: "Sunder",
    10: "The Room (Season Finale)",
  },
  theBear: {
    3: "Doors",
    4: "Violet",
    5: "Children",
    6: "Napkins",
    7: "Legacy",
    8: "Ice Chips",
    9: "Apologies",
    10: "Forever (Season Finale)",
  },
  arcane: {
    2: "Some Mysteries Are Better Left Unsolved",
    3: "The Base Violence Necessary for Change",
    4: "Happy Progress Day!",
    5: "Everybody Wants to Be My Enemy",
    6: "When These Walls Come Tumbling Down",
    7: "The Boy Saviour",
    8: "Oil and Water",
    9: "The Monster You Created (Season Finale)",
  },
};

// Initial state for upcoming episodes
interface UpcomingItem {
  id: string;
  titleId: string;
  releaseDate: string;
  episodeLabel: string;
  episodeTitle: string;
}

const INITIAL_UPCOMING: UpcomingItem[] = [
  {
    id: "up1",
    titleId: "severance",
    releaseDate: "Hoje, 21:00",
    episodeLabel: "T2 · E6",
    episodeTitle: "Trojan's Horse",
  },
  {
    id: "up2",
    titleId: "theBear",
    releaseDate: "Amanhã, 19:00",
    episodeLabel: "T3 · E4",
    episodeTitle: "Violet",
  },
  {
    id: "up3",
    titleId: "arcane",
    releaseDate: "Sexta-feira",
    episodeLabel: "T2 · E1",
    episodeTitle: "Nova Temporada",
  },
  {
    id: "up4",
    titleId: "strangerThings",
    releaseDate: "15 de Julho",
    episodeLabel: "T5 · E1",
    episodeTitle: "O Começo do Fim",
  },
];

// Initial state for recently released episodes
interface RecentlyReleasedItem {
  id: string;
  titleId: string;
  episodeLabel: string;
  episodeTitle: string;
  releasedAt: string;
}

const RECENTLY_RELEASED: RecentlyReleasedItem[] = [
  {
    id: "rr1",
    titleId: "succession",
    episodeLabel: "T4 · E10",
    episodeTitle: "Com Olhos Abertos",
    releasedAt: "Há 2 dias",
  },
  {
    id: "rr2",
    titleId: "theBear",
    episodeLabel: "T3 · E2",
    episodeTitle: "Next",
    releasedAt: "Ontem",
  },
  {
    id: "rr3",
    titleId: "strangerThings",
    episodeLabel: "T4 · E9",
    episodeTitle: "O Plano de Onze",
    releasedAt: "Há 3 dias",
  },
];

function AssistirPage() {
  // 1. Continue Watching Stateful List
  const [watchingList, setWatchingList] = useState<WatchingItem[]>(INITIAL_WATCHING);

  // 2. Notifications/Follow state for upcoming episodes
  const [notifications, setNotifications] = useState<Record<string, boolean>>({});

  // Helper to check if a show is followed by the user
  const isShowFollowed = (titleId: string) => {
    return PROFILE.favoriteSeries.some((fav) => fav.id === titleId);
  };

  // Handler to mark the next episode as watched
  const handleMarkWatched = (id: string) => {
    setWatchingList((prevList) =>
      prevList.map((item) => {
        if (item.id !== id) return item;

        const nextWatchedCount = item.watchedEpisodes + 1;
        const isFinished = nextWatchedCount === item.totalEpisodes;

        if (isFinished) {
          toast.success(`Parabéns! Você completou ${item.title.title}. 🎉`, {
            description: `Todos os ${item.totalEpisodes} episódios foram assistidos.`,
            duration: 4000,
          });
          return {
            ...item,
            watchedEpisodes: nextWatchedCount,
            nextLabel: "Tudo assistido",
          };
        }

        // Advance to next episode details
        const nextEpisodeNum = item.episode + 1;
        const showId = item.title.id;
        const nextEpisodeTitle =
          EPISODE_TITLES[showId]?.[nextEpisodeNum + 1] || `Episódio ${nextEpisodeNum + 1}`;
        const newNextLabel = `T${item.season} · E${nextEpisodeNum + 1} · ${nextEpisodeTitle}`;

        toast.success(`Episódio marcado como visto!`, {
          description: `${item.title.title} · T${item.season} E${item.episode} assistido.`,
          duration: 3000,
        });

        return {
          ...item,
          episode: nextEpisodeNum,
          watchedEpisodes: nextWatchedCount,
          nextLabel: newNextLabel,
        };
      })
    );
  };

  // Toggle notifications for upcoming shows
  const toggleNotification = (id: string, titleName: string) => {
    setNotifications((prev) => {
      const isRegistered = !prev[id];
      if (isRegistered) {
        toast.success("Notificação ativada!", {
          description: `Avisaremos você assim que o novo episódio de ${titleName} for lançado.`,
        });
      } else {
        toast.info("Notificação desativada.", {
          description: `Você não receberá alertas para novos episódios de ${titleName}.`,
        });
      }
      return { ...prev, [id]: isRegistered };
    });
  };

  // Sort upcoming episodes prioritizing followed shows
  const sortedUpcoming = [...INITIAL_UPCOMING].sort((a, b) => {
    const aFollowed = isShowFollowed(a.titleId);
    const bFollowed = isShowFollowed(b.titleId);
    if (aFollowed && !bFollowed) return -1;
    if (!aFollowed && bFollowed) return 1;
    return 0;
  });

  return (
    <AppShell>
      {/* SECTION 1: Continue Watching */}
      <section className="mb-10">
        <SectionTitle
          eyebrow="Continuar assistindo"
          title="Onde você parou"
        />
        <div className="space-y-4">
          {watchingList.map((w) => (
            <WatchingCard key={w.id} item={w} onMarkWatched={handleMarkWatched} />
          ))}
        </div>
      </section>

      {/* SECTION 2: Upcoming Episodes */}
      <section className="mb-10">
        <SectionTitle
          eyebrow="Lançamentos em breve"
          title="Próximos episódios"
        />
        <div className="space-y-3">
          {sortedUpcoming.map((up) => {
            const titleInfo = TITLES[up.titleId];
            if (!titleInfo) return null;
            const followed = isShowFollowed(up.titleId);
            const isNotified = !!notifications[up.id];

            return (
              <div
                key={up.id}
                className={cn(
                  "flex items-center gap-4 rounded-2xl border border-border bg-card/45 p-3.5 transition-all duration-300 hover:border-accent/20",
                  followed && "border-l-[3px] border-l-accent pl-3 bg-accent/[0.02]"
                )}
              >
                <img
                  src={titleInfo.poster ?? titleInfo.backdrop}
                  alt={titleInfo.title}
                  className="h-[64px] w-[46px] rounded-xl border border-border object-cover shrink-0 bg-surface-2"
                  referrerPolicy="no-referrer"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-[14.5px] font-semibold text-foreground">
                      {titleInfo.title}
                    </span>
                    {followed && (
                      <span className="inline-flex shrink-0 items-center rounded-full bg-accent/10 border border-accent/20 px-1.5 py-0.5 text-[8.5px] font-semibold text-accent tracking-wider uppercase">
                        ★ Segue
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 truncate text-[11.5px] text-muted-foreground">
                    {up.episodeLabel} · {up.episodeTitle}
                  </div>
                  <div className="mt-2 flex items-center gap-1.5 text-[10px] font-medium tracking-wide text-accent/90 uppercase">
                    <Calendar className="h-3 w-3 text-accent" strokeWidth={1.6} />
                    <span>{up.releaseDate}</span>
                  </div>
                </div>

                <button
                  onClick={() => toggleNotification(up.id, titleInfo.title)}
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-full border border-border transition-all duration-300 active:scale-95 cursor-pointer",
                    isNotified
                      ? "bg-accent/15 border-accent/30 text-accent"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                  )}
                  aria-label={isNotified ? "Notificação ativada" : "Ativar notificação"}
                >
                  {isNotified ? (
                    <BellRing className="h-4 w-4 animate-bounce" strokeWidth={1.6} />
                  ) : (
                    <Bell className="h-4 w-4" strokeWidth={1.6} />
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* SECTION 3: Recently Released */}
      <section className="mb-6">
        <SectionTitle
          eyebrow="Recém-lançados"
          title="Lançados recentemente"
        />
        <div className="-mx-5 flex gap-4.5 overflow-x-auto px-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pb-3">
          {RECENTLY_RELEASED.map((rr) => {
            const titleInfo = TITLES[rr.titleId];
            if (!titleInfo) return null;

            return (
              <div
                key={rr.id}
                className="w-[130px] shrink-0 group relative cursor-pointer active:scale-[0.98] transition-all duration-300"
                onClick={() => {
                  toast.info(`Iniciando reprodução de ${titleInfo.title}...`, {
                    description: `${rr.episodeLabel} · ${rr.episodeTitle}`,
                  });
                }}
              >
                {/* Poster container */}
                <div className="aspect-[2/3] w-full overflow-hidden rounded-2xl border border-border bg-surface-2 relative">
                  <img
                    src={titleInfo.poster ?? titleInfo.backdrop}
                    alt={titleInfo.title}
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  {/* Premium Badge at top-left */}
                  <span className="absolute top-2 left-2 inline-flex items-center rounded-md bg-background/80 backdrop-blur-md px-1.5 py-0.5 text-[8.5px] font-bold text-accent border border-border/40 tracking-wider uppercase">
                    {rr.releasedAt}
                  </span>
                  {/* Subtle play overlay on hover */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[1px]">
                    <div className="h-10 w-10 rounded-full bg-accent text-accent-foreground flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-110">
                      <Play className="h-4 w-4 fill-current ml-0.5" strokeWidth={0} />
                    </div>
                  </div>
                </div>
                {/* Title & Info */}
                <div className="mt-2.5">
                  <div className="truncate text-[13px] font-semibold text-foreground group-hover:text-accent transition-colors duration-200">
                    {titleInfo.title}
                  </div>
                  <div className="mt-0.5 truncate text-[11px] text-muted-foreground">
                    {rr.episodeLabel} · {rr.episodeTitle}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </AppShell>
  );
}

interface WatchingCardProps {
  item: WatchingItem;
  onMarkWatched: (id: string) => void;
}

function WatchingCard({ item, onMarkWatched }: WatchingCardProps) {
  const progress = Math.round((item.watchedEpisodes / item.totalEpisodes) * 100);
  const isFinished = item.watchedEpisodes === item.totalEpisodes;

  return (
    <article
      className={cn(
        "group relative flex gap-4 rounded-3xl border border-border bg-card p-4 transition-all duration-300 hover:border-accent/25",
        isFinished && "border-accent/15 bg-accent/[0.01]"
      )}
    >
      {/* Poster on the left */}
      <div className="relative aspect-[2/3] w-[76px] shrink-0 overflow-hidden rounded-xl border border-border bg-surface-2">
        <img
          src={item.title.poster ?? item.title.backdrop}
          alt={item.title.title}
          referrerPolicy="no-referrer"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-103"
        />
        {isFinished && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/65 backdrop-blur-[1px]">
            <Check className="h-6 w-6 text-accent" strokeWidth={2.5} />
          </div>
        )}
      </div>

      {/* Content on the right */}
      <div className="flex flex-1 flex-col justify-between min-w-0">
        <div>
          <div className="flex items-start justify-between gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-accent">
              {isFinished ? "Concluído" : `T${item.season} · E${item.episode}`}
            </span>
            <span className="text-[10.5px] font-medium text-muted-foreground/80">
              {item.watchedEpisodes}/{item.totalEpisodes} eps
            </span>
          </div>

          <h3 className="tracking-title mt-1.5 truncate text-[15.5px] font-bold text-foreground">
            {item.title.title}
          </h3>

          {/* Progress bar */}
          <div className="mt-3">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className={cn(
                  "h-full rounded-full bg-accent transition-all duration-500 ease-out",
                  isFinished && "bg-accent/80"
                )}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Button to mark next as watched */}
        <div className="mt-3 flex items-center justify-between gap-4">
          <span className="truncate text-[11px] text-muted-foreground/80">
            {isFinished ? (
              "Você assistiu tudo! ✨"
            ) : (
              <>
                Próximo:{" "}
                <span className="text-foreground/90 font-medium">
                  {item.nextLabel.split(" · ").slice(2).join(" · ") || "Episódio " + (item.episode + 1)}
                </span>
              </>
            )}
          </span>

          {!isFinished ? (
            <button
              onClick={() => onMarkWatched(item.id)}
              className="flex h-[28px] shrink-0 items-center justify-center gap-1.5 rounded-lg bg-secondary/80 px-2.5 text-[11px] font-semibold text-accent border border-border/40 hover:bg-secondary hover:text-accent-foreground transition-all duration-200 active:scale-95 cursor-pointer"
              aria-label={`Marcar próximo episódio de ${item.title.title} como assistido`}
            >
              <Check className="h-3 w-3" strokeWidth={2.5} />
              <span>Marcar visto</span>
            </button>
          ) : (
            <span className="inline-flex shrink-0 items-center gap-1 text-[11px] font-semibold text-accent/90 uppercase tracking-wider">
              ✔ Em dia
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

