import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Check,
  Calendar,
  Bell,
  BellRing,
  Play,
  Share2,
  Sparkles,
  Clock,
  RefreshCw,
} from "lucide-react";
import { AppShell, SectionTitle } from "@/components/scena/AppShell";
import { mediaService } from "@/services/media.service";
import { seriesService } from "@/services/series.service";
import { userService } from "@/services/user.service";
import type { UpcomingRelease, WatchingItem } from "@/services/models";
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

const INITIAL_WATCHING = seriesService.getWatching();
const UPCOMING_RELEASES = seriesService.getUpcomingReleases();
const RECENTLY_RELEASED = seriesService.getRecentlyReleased();

interface ExtendedWatchingItem extends WatchingItem {
  hasNewEpisode?: boolean;
}

interface WatchingCardProps {
  item: ExtendedWatchingItem;
  onMarkWatched: (id: string) => void;
}

function AssistirPage() {
  const profile = userService.getCurrentUser();
  const resumeTitle = mediaService.getMediaById("severance");

  // Stateful states for the user cockpit
  const [watchingList, setWatchingList] = useState<ExtendedWatchingItem[]>(() =>
    INITIAL_WATCHING.map((w) => ({ ...w, hasNewEpisode: false })),
  );
  const [completedList, setCompletedList] = useState<ExtendedWatchingItem[]>([]);
  const [followedShows, setFollowedShows] = useState<string[]>(() =>
    (profile.favoriteSeries ?? []).map((s) => s.id),
  );
  const [stats, setStats] = useState({
    episodesWatched: 243,
    hoursWatched: 162.5,
  });
  const [shareActivity, setShareActivity] = useState(true);

  // Toggle followed shows state
  const toggleFollow = (id: string, title: string) => {
    setFollowedShows((prev) => {
      const isFollowing = prev.includes(id);
      if (isFollowing) {
        toast.info(`Você deixou de seguir ${title}`, {
          description: "Os episódios futuros não aparecerão no seu cronograma.",
        });
        return prev.filter((showId) => showId !== id);
      } else {
        toast.success(`Você está seguindo ${title}!`, {
          description: "Novos lançamentos serão agrupados no seu cronograma.",
        });
        return [...prev, id];
      }
    });
  };

  // Mark episode as watched interaction loop
  const handleMarkWatched = (id: string) => {
    setWatchingList((prevList) => {
      const targetItem = prevList.find((w) => w.id === id);
      if (!targetItem) return prevList;

      const nextWatchedCount = targetItem.watchedEpisodes + 1;
      const isFinished = nextWatchedCount === targetItem.totalEpisodes;

      // Update statistics
      setStats((prev) => ({
        episodesWatched: prev.episodesWatched + 1,
        hoursWatched: Number((prev.hoursWatched + 0.75).toFixed(1)), // ~45 mins per ep
      }));

      // Social feed check
      if (shareActivity) {
        if (isFinished) {
          toast.message("Atividade publicada 👥", {
            description: `Você compartilhou a conclusão de ${targetItem.title.title} no feed.`,
          });
        } else {
          toast.message("Atividade publicada 👥", {
            description: `Você compartilhou que assistiu T${targetItem.season} · E${targetItem.episode} de ${targetItem.title.title}.`,
          });
        }
      }

      if (isFinished) {
        toast.success(`Série concluída! 🎉`, {
          description: `Você assistiu todos os ${targetItem.totalEpisodes} episódios de ${targetItem.title.title}.`,
          duration: 4000,
        });

        // Add to completed list
        setCompletedList((prevCompleted) => [
          ...prevCompleted,
          {
            ...targetItem,
            watchedEpisodes: nextWatchedCount,
            nextLabel: "Tudo assistido",
            hasNewEpisode: false,
          },
        ]);

        // Remove from watching list
        return prevList.filter((w) => w.id !== id);
      }

      // Regular advance
      const nextEpisodeNum = targetItem.episode + 1;
      const showId = targetItem.title.id;
      const nextEpisodeTitle =
        seriesService.getEpisodeTitle(showId, nextEpisodeNum + 1) ||
        `Episódio ${nextEpisodeNum + 1}`;
      const newNextLabel = `T${targetItem.season} · E${nextEpisodeNum + 1} · ${nextEpisodeTitle}`;

      toast.success(`Episódio marcado como visto!`, {
        description: `${targetItem.title.title} · T${targetItem.season} E${targetItem.episode} assistido.`,
        duration: 2500,
      });

      return prevList.map((item) => {
        if (item.id !== id) return item;
        return {
          ...item,
          episode: nextEpisodeNum,
          watchedEpisodes: nextWatchedCount,
          nextLabel: newNextLabel,
          hasNewEpisode: false, // Badge clears once user interacts
        };
      });
    });
  };

  // Reset a completed show back to watching list for simulation purposes
  const resetShowProgress = (id: string) => {
    const targetItem = completedList.find((c) => c.id === id);
    if (!targetItem) return;

    setCompletedList((prev) => prev.filter((c) => c.id !== id));
    setWatchingList((prev) => [
      ...prev,
      {
        ...targetItem,
        watchedEpisodes: 0,
        episode: 1,
        nextLabel: `T${targetItem.season} · E2 · ${seriesService.getEpisodeTitle(targetItem.title.id, 2) || "Episódio 2"}`,
        hasNewEpisode: false,
      },
    ]);

    toast.info(`Progresso de ${targetItem.title.title} reiniciado!`, {
      description: "A série foi enviada de volta para Continue Assistindo.",
    });
  };

  // UX Simulator actions
  const simulateNewEpisode = () => {
    if (completedList.length > 0) {
      const showToRestore = completedList[0];
      setCompletedList((prev) => prev.filter((c) => c.id !== showToRestore.id));
      setWatchingList((prev) => [
        ...prev,
        {
          ...showToRestore,
          watchedEpisodes: showToRestore.totalEpisodes - 1, // 9/10 watched
          episode: showToRestore.totalEpisodes - 1,
          hasNewEpisode: true, // Show the glowing new episode badge
          nextLabel: `T${showToRestore.season} · E${showToRestore.totalEpisodes} · ${seriesService.getEpisodeTitle(showToRestore.title.id, showToRestore.totalEpisodes) || "Episódio " + showToRestore.totalEpisodes}`,
        },
      ]);
      toast.success(`Novo episódio disponível! 📺`, {
        description: `${showToRestore.title.title} voltou para o painel de reprodução com o selo de Novo Episódio.`,
      });
    } else {
      // Toggle new episode badge on Severance or the first item
      setWatchingList((prev) => {
        if (prev.length === 0) return prev;
        const list = [...prev];
        list[0] = { ...list[0], hasNewEpisode: true };
        return list;
      });
      toast.success(`Novo episódio simulado! 📺`, {
        description: `Adicionado selo de 'Novo Episódio' em ${watchingList[0]?.title.title || "série ativa"}.`,
      });
    }
  };

  // Reset all watch data back to initial mock state
  const resetAllData = () => {
    setWatchingList(INITIAL_WATCHING.map((w) => ({ ...w, hasNewEpisode: false })));
    setCompletedList([]);
    setFollowedShows((profile.favoriteSeries ?? []).map((s) => s.id));
    setStats({ episodesWatched: 243, hoursWatched: 162.5 });
    toast.info("Mock de dados redefinido!");
  };

  // Filter and group upcoming releases based on followed shows list
  const filteredUpcoming = (group: "today" | "tomorrow" | "week") => {
    return UPCOMING_RELEASES.filter(
      (up) => up.group === group && followedShows.includes(up.titleId),
    );
  };

  const hasAnyUpcoming = UPCOMING_RELEASES.some((up) => followedShows.includes(up.titleId));

  return (
    <AppShell>
      {/* SECTION 1: Profile & Weekly Stats Dashboard */}
      <header className="card-surface p-5 mb-8 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={profile.avatar}
              alt={profile.name}
              className="h-10 w-10 rounded-full border border-border object-cover"
            />
            <div>
              <div className="text-[13px] font-semibold text-foreground leading-tight">
                {profile.name}
              </div>
              <div className="text-[11px] text-muted-foreground">Cockpit de Reprodução</div>
            </div>
          </div>

          <div className="flex gap-4 text-right">
            <div>
              <div className="text-[15px] font-bold text-foreground leading-none">
                {stats.episodesWatched}
              </div>
              <div className="text-[9px] uppercase tracking-wider text-muted-foreground mt-1">
                Episódios
              </div>
            </div>
            <div className="h-6 w-px bg-border self-center" />
            <div>
              <div className="text-[15px] font-bold text-foreground leading-none">
                {stats.hoursWatched}h
              </div>
              <div className="text-[9px] uppercase tracking-wider text-muted-foreground mt-1">
                Assistidas
              </div>
            </div>
          </div>
        </div>

        <div className="h-px bg-border" />

        <div className="flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground flex items-center gap-1.5">
            <Share2 className="h-3 w-3 text-accent" />
            Publicação social no feed
          </span>
          <label className="relative inline-flex items-center cursor-pointer select-none">
            <input
              type="checkbox"
              checked={shareActivity}
              onChange={(e) => setShareActivity(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-8 h-4.5 bg-secondary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-accent" />
          </label>
        </div>
      </header>

      {/* SECTION 2: Resume Watching [Reserved Layout] */}
      <section className="mb-10">
        <SectionTitle eyebrow="Continuar reprodução" title="Onde você pausou" />
        <div className="relative h-[156px] overflow-hidden rounded-3xl border border-border group cursor-pointer">
          {/* Backdrop screenshot background */}
          <img
            src={resumeTitle?.backdrop ?? ""}
            alt="Severance paused screenshot"
            className="absolute inset-0 h-full w-full object-cover opacity-60 transition-transform duration-700 group-hover:scale-[1.02]"
          />
          {/* Dark gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/20" />

          {/* Central Play Icon Overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-accent/90 text-accent-foreground shadow-lg backdrop-blur-sm transition-transform duration-300 group-hover:scale-110">
              <Play className="h-4.5 w-4.5 fill-current ml-0.5" strokeWidth={0} />
            </div>
          </div>

          {/* Pause Info details */}
          <div className="absolute bottom-0 inset-x-0 p-5 pt-10">
            <div className="flex items-end justify-between gap-4">
              <div className="min-w-0">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-accent">
                  Pausado · T2 · E5
                </span>
                <h4 className="mt-0.5 truncate text-[14.5px] font-bold text-foreground">
                  Severance: Trojan's Horse
                </h4>
              </div>
              <span className="shrink-0 text-[10.5px] font-semibold text-muted-foreground/90">
                24 min restantes
              </span>
            </div>
            {/* Timestamp progress bar */}
            <div className="mt-3.5 h-1.5 w-full overflow-hidden rounded-full bg-white/20">
              <div className="h-full w-[58%] rounded-full bg-accent" />
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: Continue Watching */}
      <section className="mb-10">
        <SectionTitle eyebrow="Sua jornada" title="Em andamento" />
        {watchingList.length > 0 ? (
          <div className="space-y-4">
            {watchingList.map((w) => (
              <WatchingCard key={w.id} item={w} onMarkWatched={handleMarkWatched} />
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-border p-8 text-center bg-card/20">
            <Sparkles className="mx-auto h-5 w-5 text-accent/80 mb-2" />
            <div className="text-[13.5px] font-medium text-foreground">Você está em dia! ✨</div>
            <p className="text-[11.5px] text-muted-foreground mt-1 max-w-[280px] mx-auto leading-relaxed">
              Todas as suas séries em andamento foram assistidas. Novos episódios aparecerão aqui
              automaticamente.
            </p>
          </div>
        )}
      </section>

      {/* SECTION 4: Upcoming Episodes (Followed Shows Only) */}
      <section className="mb-10">
        <div className="flex items-end justify-between mb-4">
          <SectionTitle eyebrow="Lançamentos em breve" title="Próximos episódios" />
        </div>

        {/* Tactile Following Manager */}
        <div className="mb-4">
          <div className="text-[10px] font-semibold text-muted-foreground/80 uppercase tracking-wider mb-2.5">
            Séries que você segue
          </div>
          <div className="-mx-5 flex gap-2.5 overflow-x-auto px-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pb-1">
            {seriesService.getAllSeries().map((t) => {
              const isFollowed = followedShows.includes(t.id);
              return (
                <button
                  key={t.id}
                  onClick={() => toggleFollow(t.id, t.title)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] font-semibold transition-all duration-300 active:scale-95 shrink-0 cursor-pointer",
                    isFollowed
                      ? "bg-accent/10 border-accent/30 text-accent"
                      : "bg-surface border-border text-muted-foreground hover:text-foreground",
                  )}
                >
                  <span className="text-[12px]">{isFollowed ? "✓" : "+"}</span>
                  <span>{t.title}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Timeline Grouping */}
        {hasAnyUpcoming ? (
          <div className="space-y-6">
            {/* Group: Today */}
            {filteredUpcoming("today").length > 0 && (
              <div>
                <div className="text-[10px] font-bold text-accent uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
                  Hoje
                </div>
                <div className="space-y-2.5">
                  {filteredUpcoming("today").map((up) => (
                    <UpcomingRow key={up.id} up={up} />
                  ))}
                </div>
              </div>
            )}

            {/* Group: Tomorrow */}
            {filteredUpcoming("tomorrow").length > 0 && (
              <div>
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2.5">
                  Amanhã
                </div>
                <div className="space-y-2.5">
                  {filteredUpcoming("tomorrow").map((up) => (
                    <UpcomingRow key={up.id} up={up} />
                  ))}
                </div>
              </div>
            )}

            {/* Group: This Week */}
            {filteredUpcoming("week").length > 0 && (
              <div>
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2.5">
                  Esta Semana
                </div>
                <div className="space-y-2.5">
                  {filteredUpcoming("week").map((up) => (
                    <UpcomingRow key={up.id} up={up} />
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border p-6 text-center text-[12.5px] text-muted-foreground/95 bg-card/10">
            Nenhum lançamento previsto para as séries seguidas.
            <div className="mt-1 text-[11px] text-muted-foreground/60">
              Siga séries na lista acima para monitorar os episódios futuros.
            </div>
          </div>
        )}
      </section>

      {/* SECTION 5: Recently Released */}
      <section className="mb-10">
        <SectionTitle eyebrow="Recém-lançados" title="Lançados recentemente" />
        <div className="-mx-5 flex gap-4.5 overflow-x-auto px-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pb-3">
          {RECENTLY_RELEASED.map((rr) => {
            const titleInfo = mediaService.getMediaById(rr.titleId);
            if (!titleInfo) return null;

            return (
              <Link
                key={rr.id}
                to="/series/$id"
                params={{ id: rr.titleId }}
                className="w-[125px] shrink-0 group relative cursor-pointer active:scale-[0.98] transition-all duration-300 block text-left"
              >
                {/* Highlighted card frame */}
                <div className="aspect-[2/3] w-full overflow-hidden rounded-2xl border border-accent/25 bg-surface-2 relative shadow-[0_0_12px_rgba(216,190,132,0.06)] group-hover:border-accent/40">
                  <img
                    src={titleInfo.poster ?? titleInfo.backdrop}
                    alt={titleInfo.title}
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  {/* Highlight tag */}
                  <span className="absolute top-2 left-2 inline-flex items-center rounded-md bg-accent/90 backdrop-blur-md px-1.5 py-0.5 text-[8.5px] font-bold text-accent-foreground tracking-wider uppercase">
                    {rr.releasedAt}
                  </span>
                  {/* Play overlay - quick play button */}
                  <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[1px]">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toast.info(`Iniciando reprodução de ${titleInfo.title}...`, {
                          description: `${rr.episodeLabel} · ${rr.episodeTitle}`,
                        });
                      }}
                      className="h-9 w-9 rounded-full bg-accent text-accent-foreground flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-transform duration-200 cursor-pointer"
                      aria-label="Reproduzir rapidamente"
                    >
                      <Play className="h-3.5 w-3.5 fill-current ml-0.5" strokeWidth={0} />
                    </button>
                  </div>
                </div>
                {/* Title info */}
                <div className="mt-2.5">
                  <div className="truncate text-[12.5px] font-semibold text-foreground group-hover:text-accent transition-colors duration-200">
                    {titleInfo.title}
                  </div>
                  <div className="mt-0.5 truncate text-[11px] text-muted-foreground">
                    {rr.episodeLabel}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* SECTION 6: Up to Date Collapsible Section */}
      {completedList.length > 0 && (
        <section className="mb-10 animate-fade-in">
          <SectionTitle eyebrow="Tudo assistido" title="Séries em dia" />
          <div className="space-y-3">
            {completedList.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between rounded-2xl border border-border bg-card/30 p-3"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={c.title.poster ?? c.title.backdrop}
                    alt={c.title.title}
                    className="h-11 w-8 rounded-lg border border-border object-cover"
                  />
                  <div>
                    <div className="text-[13.5px] font-semibold text-foreground leading-tight">
                      {c.title.title}
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      Concluída · {c.totalEpisodes} episódios assistidos
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => resetShowProgress(c.id)}
                  className="text-[11px] font-semibold text-accent hover:text-accent/80 px-2.5 py-1.5 rounded-lg bg-secondary/40 border border-border/40 hover:bg-secondary/70 transition-all duration-200 cursor-pointer"
                >
                  Resetar
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* SECTION 7: UX Developer Sandbox Controls */}
      <footer className="mt-12 mb-6 border-t border-border pt-6">
        <details className="group rounded-2xl border border-border bg-surface p-4">
          <summary className="list-none flex items-center justify-between cursor-pointer select-none">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Painel de Simulação UX Scena
            </span>
            <span className="text-muted-foreground/60 group-open:rotate-180 transition-transform duration-200">
              ▼
            </span>
          </summary>
          <div className="mt-4 space-y-3 pt-3 border-t border-border">
            <p className="text-[11.5px] text-muted-foreground leading-relaxed">
              Use estes controles rápidos para testar e validar os fluxos de trabalho do aplicativo
              (como conclusão automática de série e reintegração automática quando há novos
              lançamentos).
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={simulateNewEpisode}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-accent text-accent-foreground text-[11px] font-bold shadow transition-all duration-200 hover:scale-[1.01] active:scale-95 cursor-pointer"
              >
                <Sparkles className="h-3 w-3" />
                Simular Novo Episódio
              </button>
              <button
                onClick={resetAllData}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground text-[11px] font-bold border border-border transition-all duration-200 active:scale-95 cursor-pointer"
              >
                <RefreshCw className="h-3 w-3" />
                Redefinir Tudo
              </button>
            </div>
          </div>
        </details>
      </footer>
    </AppShell>
  );
}

// Sub-component: Upcoming Item Row
function UpcomingRow({ up }: { up: UpcomingRelease }) {
  const titleInfo = mediaService.getMediaById(up.titleId);
  if (!titleInfo) return null;

  return (
    <div className="flex items-center gap-4 rounded-2xl border border-border bg-card/35 p-3">
      <img
        src={titleInfo.poster ?? titleInfo.backdrop}
        alt={titleInfo.title}
        className="h-14 w-10 rounded-lg border border-border object-cover shrink-0 bg-surface-2"
        referrerPolicy="no-referrer"
      />
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13.5px] font-semibold text-foreground">
          {titleInfo.title}
        </div>
        <div className="mt-0.5 truncate text-[11px] text-muted-foreground">
          Episódio {up.episodeNum} · {up.episodeTitle}
        </div>
      </div>
      <div className="text-right">
        <div className="text-[11px] font-bold text-accent tracking-wide">{up.releaseDate}</div>
        <div className="mt-0.5 text-[9.5px] text-muted-foreground/80 uppercase font-semibold flex items-center gap-1 justify-end">
          <Clock className="h-2.5 w-2.5 text-muted-foreground/60" />
          {up.countdown}
        </div>
      </div>
    </div>
  );
}

// Sub-component: Stateful Watching Card
function WatchingCard({ item, onMarkWatched }: WatchingCardProps) {
  const progress = Math.round((item.watchedEpisodes / item.totalEpisodes) * 100);
  const isFinished = item.watchedEpisodes === item.totalEpisodes;

  return (
    <article
      className={cn(
        "group relative flex gap-5 rounded-[28px] border border-border bg-card overflow-hidden p-5 transition-all duration-500 hover:border-accent/20",
        item.hasNewEpisode && "border-accent/25 shadow-[0_0_15px_rgba(216,190,132,0.06)]",
      )}
    >
      {/* Cinematic Backdrop Background Layer */}
      <div className="absolute inset-0 z-0 overflow-hidden" aria-hidden>
        <img
          src={item.title.backdrop}
          alt=""
          referrerPolicy="no-referrer"
          className="h-full w-full object-cover opacity-[0.24] scale-[1.02] transition-transform duration-700 group-hover:scale-[1.04]"
        />
        {/* Soft dark overlays to keep readable */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#101010]/95 via-[#101010]/85 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#101010] via-[#101010]/50 to-transparent" />
      </div>

      {/* Official Poster Container */}
      <Link
        to="/series/$id"
        params={{ id: item.title.id }}
        className="relative z-10 aspect-[2/3] w-[72px] shrink-0 overflow-hidden rounded-xl border border-white/5 bg-surface-2 shadow-2xl block hover:scale-[1.02] active:scale-95 transition-transform duration-200 cursor-pointer"
      >
        <img
          src={item.title.poster ?? item.title.backdrop}
          alt={item.title.title}
          referrerPolicy="no-referrer"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-103"
        />
        {item.hasNewEpisode && (
          <span className="absolute top-1.5 left-1.5 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
          </span>
        )}
      </Link>

      {/* Typography and Actions */}
      <div className="relative z-10 flex flex-1 flex-col justify-between min-w-0 py-0.5">
        <div>
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-accent/90">
                T{item.season} · E{item.episode}
              </span>
              {item.hasNewEpisode && (
                <span className="inline-flex items-center rounded-full bg-accent/15 border border-accent/20 px-1 py-0.2 text-[8px] font-bold text-accent tracking-wider uppercase animate-pulse">
                  Novo
                </span>
              )}
            </div>
            <span className="text-[10.5px] font-semibold text-muted-foreground/85">
              {item.watchedEpisodes}/{item.totalEpisodes} eps · {progress}%
            </span>
          </div>

          <h3 className="tracking-title mt-1.5 truncate text-[16px] font-extrabold text-foreground leading-tight group-hover:text-accent/95 transition-colors duration-300">
            <Link to="/series/$id" params={{ id: item.title.id }} className="hover:text-accent">
              {item.title.title}
            </Link>
          </h3>

          {/* Progress Bar */}
          <div className="mt-3.5">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-accent transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Sub-label & Action Check Button */}
        <div className="mt-4 flex items-center justify-between gap-4">
          <span className="truncate text-[11px] text-muted-foreground/80 leading-none">
            Próximo:{" "}
            <span className="text-foreground/90 font-medium">
              {item.nextLabel.split(" · ").slice(2).join(" · ") || "Episódio " + (item.episode + 1)}
            </span>
          </span>

          <button
            onClick={() => onMarkWatched(item.id)}
            className="flex h-[28px] shrink-0 items-center justify-center gap-1.5 rounded-lg bg-accent text-accent-foreground px-3 text-[11px] font-bold shadow-lg shadow-black/20 hover:scale-[1.01] active:scale-95 transition-all duration-200 cursor-pointer"
            aria-label={`Marcar próximo episódio de ${item.title.title} como assistido`}
          >
            <Check className="h-3.5 w-3.5" strokeWidth={3} />
            <span>Visto</span>
          </button>
        </div>
      </div>
    </article>
  );
}
