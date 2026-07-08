/**
 * /series/$id — TV Show Details Page
 *
 * The central hub for everything related to a TV show.
 * Manages: progress tracking, episode marking, status, ratings, cast, streaming, recommendations.
 *
 * Reusable sub-components exported from this file:
 *   SeasonTabs     — horizontal season tab bar
 *   EpisodeCard    — single episode row with mark-watched toggle
 *   PlatformChip   — streaming provider pill
 *   CastCard       — cast member avatar + info
 *   ProgressSection — watch progress dashboard
 *   StatusBottomSheet — slide-up status picker sheet
 */

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import {
  Check,
  Heart,
  Plus,
  Share2,
  Star,
  MessageCircle,
  Play,
  Flame,
  ArrowLeft,
  Tv,
  ChevronDown,
  X,
  Sparkles,
} from "lucide-react";
import { AppShell, SectionTitle } from "@/components/scena/AppShell";
import { MediaCardVerticalSm, titleToMedia } from "@/components/scena/MediaCard";
import { seriesService } from "@/services/series.service";
import { userService } from "@/services/user.service";
import { mediaService } from "@/services/media.service";
import type {
  Comment as CommentData,
  Episode as EpisodeData,
  Person as CastMember,
  SeriesDetails,
  StreamingPlatform,
  WatchStatus,
} from "@/services/models";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ─── Route ───────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/series/$id")({
  head: ({ params }) => {
    const titleInfo = seriesService.getSeries(params.id);
    return {
      meta: [
        { title: titleInfo ? `${titleInfo.title} · Scena` : "Série · Scena" },
        { name: "description", content: "Episódios, progresso, elenco, avaliações e muito mais." },
      ],
    };
  },
  component: SeriesDetailsPage,
});

// Shared data models are imported from the service layer. The UI stays bound to
// Scena contracts, not to mock, TMDb, or Supabase response shapes.
// ─── Status Meta ──────────────────────────────────────────────────────────────

export const STATUS_META: Record<WatchStatus, { label: string; dot: string; color: string; desc: string }> = {
  want:      { label: "Quero Assistir", dot: "bg-muted-foreground/60",  color: "text-muted-foreground",   desc: "Adicionado à sua lista de desejos" },
  watching:  { label: "Assistindo",     dot: "bg-accent",               color: "text-accent",             desc: "Em progresso — continue de onde parou" },
  uptodate:  { label: "Em Dia",         dot: "bg-emerald-400",          color: "text-emerald-400",        desc: "Você viu todos os episódios lançados" },
  finished:  { label: "Finalizado",     dot: "bg-foreground/50",        color: "text-foreground/70",      desc: "Série concluída" },
  paused:    { label: "Pausado",        dot: "bg-amber-400",            color: "text-amber-400",          desc: "Você pausou temporariamente" },
  abandoned: { label: "Abandonado",     dot: "bg-red-400/70",           color: "text-red-400",            desc: "Você parou de assistir" },
};

const STATUS_ORDER: WatchStatus[] = ["want", "watching", "uptodate", "finished", "paused", "abandoned"];

// ─── Mock Database ────────────────────────────────────────────────────────────

function SeriesDetailsPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();

  const currentUser = userService.getCurrentUser();
  const PROFILE = userService.getProfile();
  const ALL_TITLES = mediaService.getAllMedia();
  const titleBase = seriesService.getSeries(id);
  const details = useMemo(() => seriesService.getSeriesDetails(id), [id]);

  // ── State ──
  const [status, setStatus] = useState<WatchStatus>(() => {
    return seriesService.isWatching(id) ? "watching" : "want";
  });
  const [showStatusSheet, setShowStatusSheet] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [commentsList, setCommentsList] = useState<CommentData[]>(() => details.comments);
  const [newCommentText, setNewCommentText] = useState("");
  const [sortOrder, setSortOrder] = useState<"likes" | "new">("likes");

  // ── Episode watch tracking ──
  const totalEpisodesCount = useMemo(() => {
    return Object.values(details.episodes).reduce((s, eps) => s + eps.length, 0) || 10;
  }, [details]);

  const [watchedEpisodes, setWatchedEpisodes] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    const watchingItem = seriesService.getWatchingBySeriesId(id);
    const limit = watchingItem ? watchingItem.watchedEpisodes : 0;
    let count = 0;
    Object.entries(details.episodes).forEach(([sNum, eps]) => {
      eps.forEach((ep) => {
        count++;
        if (count <= limit) map[`${sNum}-${ep.episodeNum}`] = true;
      });
    });
    return map;
  });

  const watchedCount = useMemo(
    () => Object.values(watchedEpisodes).filter(Boolean).length,
    [watchedEpisodes]
  );
  const progressPercent = Math.round((watchedCount / totalEpisodesCount) * 100);

  // Current episode (first unwatched)
  const currentEpisodeLabel = useMemo(() => {
    for (const [sNum, eps] of Object.entries(details.episodes)) {
      for (const ep of eps) {
        const key = `${sNum}-${ep.episodeNum}`;
        if (!watchedEpisodes[key]) {
          return `T${sNum} · E${ep.episodeNum} · ${ep.title}`;
        }
      }
    }
    return "Todos assistidos";
  }, [watchedEpisodes, details.episodes]);

  // ── Lock body scroll when sheet is open ──
  useEffect(() => {
    document.body.style.overflow = showStatusSheet ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [showStatusSheet]);

  // ── Handlers ──
  const toggleEpisodeWatched = (seasonNum: number, ep: EpisodeData) => {
    const key = `${seasonNum}-${ep.episodeNum}`;
    const wasWatched = !!watchedEpisodes[key];
    const newMap = { ...watchedEpisodes, [key]: !wasWatched };
    setWatchedEpisodes(newMap);

    const newCount = Object.values(newMap).filter(Boolean).length;

    if (!wasWatched) {
      toast.success("Episódio marcado como visto!", {
        description: `T${seasonNum} · E${ep.episodeNum}: "${ep.title}"`,
      });
      if (newCount === totalEpisodesCount) {
        setStatus("finished");
        toast.success("Série concluída! 🎉", { description: `Todos os ${totalEpisodesCount} episódios assistidos.` });
      } else if (newCount === Object.values(details.episodes).flat().length) {
        setStatus("uptodate");
        toast.success("Em dia! ✨", { description: "Você viu todos os episódios disponíveis." });
      } else if (status === "want") {
        setStatus("watching");
      }
    } else {
      toast.info("Marcação removida", {
        description: `T${seasonNum} · E${ep.episodeNum}: "${ep.title}"`,
      });
      if (newCount === 0) setStatus("want");
      else if (status === "finished") setStatus("watching");
    }
  };

  const handleStatusChange = (newStatus: WatchStatus) => {
    setStatus(newStatus);
    setShowStatusSheet(false);

    if (newStatus === "finished") {
      const fullMap: Record<string, boolean> = {};
      Object.entries(details.episodes).forEach(([sNum, eps]) =>
        eps.forEach((ep) => { fullMap[`${sNum}-${ep.episodeNum}`] = true; })
      );
      setWatchedEpisodes(fullMap);
      toast.success("Série marcada como concluída! 🎉");
    } else if (newStatus === "want" || newStatus === "abandoned") {
      setWatchedEpisodes({});
      toast.info(`Status: ${STATUS_META[newStatus].label}`);
    } else {
      toast.info(`Status: ${STATUS_META[newStatus].label}`);
    }
  };

  const toggleFavorite = () => {
    const next = !isFavorited;
    setIsFavorited(next);
    toast[next ? "success" : "info"](
      next ? `Favoritado: ${titleBase?.title}` : "Removido dos favoritos"
    );
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: titleBase?.title, text: details.tagline, url: window.location.href }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copiado!");
    }
  };

  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;
    setCommentsList((prev) => [
      { user: { name: PROFILE.name, avatar: PROFILE.avatar }, comment: newCommentText, time: "Agora mesmo", likes: 0, rating: userRating || undefined },
      ...prev,
    ]);
    setNewCommentText("");
    toast.success("Comentário publicado!");
  };

  const sortedComments = useMemo(() => {
    return [...commentsList].sort((a, b) => sortOrder === "likes" ? b.likes - a.likes : 0);
  }, [commentsList, sortOrder]);

  const activeEpisodes = details.episodes[selectedSeason] ?? [];
  const statusMeta = STATUS_META[status];
  const similarTitles = ALL_TITLES.filter((t) => t.kind === "series" && t.id !== id);

  const backdropSrc = titleBase?.backdrop ?? "https://image.tmdb.org/t/p/w1280/56v2KjBlU4XaOv9rVYEQypROD7P.jpg";
  const posterSrc   = titleBase?.poster ?? titleBase?.backdrop;

  return (
    <>
      <AppShell>
        {/* ── Back Navigation ── */}
        <button
          onClick={() => navigate({ to: "..", from: "/series/$id" })}
          className="mb-5 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors duration-200 cursor-pointer active:scale-95"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Voltar
        </button>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* SECTION 1 — Cinematic Header                                        */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <section className="-mx-5 relative overflow-hidden mb-8" aria-label="Informações da série">
          {/* Backdrop */}
          <div className="absolute inset-0 z-0" aria-hidden>
            <img
              src={backdropSrc}
              alt=""
              className="h-full w-full object-cover opacity-30 scale-105"
              style={{ filter: "blur(1px)" }}
            />
            {/* Layered gradient fades */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#090909] via-[#090909]/70 to-[#090909]/20" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#090909] via-transparent to-[#090909]/60" />
          </div>

          {/* Header content */}
          <div className="relative z-10 px-5 pt-8 pb-7">
            <div className="flex gap-5 items-end">
              {/* Poster */}
              {posterSrc && (
                <div className="shrink-0">
                  <img
                    src={posterSrc}
                    alt={titleBase?.title}
                    className="w-[108px] aspect-[2/3] rounded-2xl border border-white/10 object-cover shadow-[0_24px_60px_rgba(0,0,0,0.9)] bg-surface-2"
                  />
                </div>
              )}

              {/* Metadata */}
              <div className="min-w-0 flex-1 pb-1">
                {/* Kind · Year · Age */}
                <div className="flex items-center gap-1.5 flex-wrap mb-2">
                  <span className="text-[9.5px] font-bold uppercase tracking-widest text-accent/90 bg-accent/10 border border-accent/20 px-2 py-0.5 rounded-full">
                    Série
                  </span>
                  <span className="text-[10px] text-muted-foreground">·</span>
                  <span className="text-[10px] text-muted-foreground font-medium">{details.year}</span>
                  <span className="text-[10px] text-muted-foreground">·</span>
                  <span className="text-[9.5px] border border-border text-muted-foreground px-1.5 py-0.3 rounded font-semibold">{details.ageRating}</span>
                </div>

                {/* Title */}
                <h1 className="tracking-title text-[22px] font-extrabold text-foreground leading-[1.1] break-words mb-1">
                  {titleBase?.title ?? details.id}
                </h1>

                {/* Original title */}
                {details.originalTitle && details.originalTitle !== titleBase?.title && (
                  <div className="text-[11.5px] italic text-muted-foreground/70 mb-2">
                    {details.originalTitle}
                  </div>
                )}

                {/* Meta row */}
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10.5px] text-muted-foreground mb-2.5">
                  <span>{details.runtime} por ep.</span>
                  <span>·</span>
                  <span>{details.seasonsCount} {details.seasonsCount === 1 ? "Temporada" : "Temporadas"}</span>
                </div>

                {/* Genres */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {details.genres.map((g) => (
                    <span key={g} className="text-[9.5px] font-medium px-2 py-0.5 rounded-full bg-white/6 border border-white/10 text-foreground/70">
                      {g}
                    </span>
                  ))}
                </div>

                {/* Community rating */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 text-accent font-bold text-[11px] bg-accent/12 border border-accent/25 px-2 py-1 rounded-lg">
                    <Star className="h-3 w-3 fill-current" strokeWidth={0} />
                    <span>{details.averageRating}</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {details.ratingsCount} avaliações
                  </span>
                </div>
              </div>
            </div>

            {/* Tagline */}
            {details.tagline && (
              <p className="mt-4 text-[12px] italic text-muted-foreground/70 leading-relaxed border-l-2 border-accent/30 pl-3">
                "{details.tagline}"
              </p>
            )}
          </div>
        </section>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* SECTION 2 — Primary CTA + Status Pill                               */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <section className="mb-7 flex gap-3" aria-label="Ações principais">
          {/* Primary CTA */}
          <button
            onClick={() => {
              if (status === "want") {
                handleStatusChange("watching");
              } else {
                toast.success("Retomando...", { description: currentEpisodeLabel });
              }
            }}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-accent text-accent-foreground font-bold text-[13px] py-3.5 shadow-[0_8px_30px_rgba(216,190,132,0.25)] active:scale-95 hover:scale-[1.01] transition-all duration-200 cursor-pointer"
          >
            {status === "want" ? (
              <><Tv className="h-4 w-4" strokeWidth={1.8} /> Começar a Assistir</>
            ) : (
              <><Play className="h-4 w-4 fill-current ml-0.5" strokeWidth={0} /> Continuar Assistindo</>
            )}
          </button>

          {/* Status pill — tappable bottom sheet trigger */}
          <button
            onClick={() => setShowStatusSheet(true)}
            className="flex items-center gap-2 rounded-2xl border border-border bg-card/60 px-4 py-3.5 text-[12px] font-semibold transition-all duration-200 active:scale-95 cursor-pointer hover:bg-card/80 shrink-0"
            aria-label="Alterar status"
          >
            <span className={cn("h-2 w-2 rounded-full shrink-0", statusMeta.dot)} />
            <span className={statusMeta.color}>{statusMeta.label}</span>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground/60" />
          </button>
        </section>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* SECTION 3 — Watch Progress Dashboard                                */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {(status === "watching" || status === "uptodate" || status === "finished" || watchedCount > 0) && (
          <ProgressSection
            watchedCount={watchedCount}
            totalCount={totalEpisodesCount}
            progressPercent={progressPercent}
            currentEpisodeLabel={currentEpisodeLabel}
            status={status}
          />
        )}

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* SECTION 4 — Quick Actions                                           */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <section className="mb-8" aria-label="Ações rápidas">
          <div className="flex items-center justify-around rounded-3xl border border-border bg-card/40 p-4">
            {/* Favorite */}
            <QuickAction
              icon={<Heart className={cn("h-5 w-5", isFavorited && "fill-current")} strokeWidth={1.6} />}
              label="Favorito"
              onClick={toggleFavorite}
              active={isFavorited}
              activeClass="text-red-500"
            />

            {/* Add to list */}
            <QuickAction
              icon={<Plus className="h-5 w-5" strokeWidth={1.6} />}
              label="Na Lista"
              onClick={() => toast.success("Adicionado à sua lista!", { description: titleBase?.title })}
            />

            {/* Rate */}
            <div className="flex flex-col items-center gap-1.5">
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      setUserRating(s);
                      toast.success(`${s} estrelas — obrigado pela avaliação!`);
                    }}
                    className="cursor-pointer p-0.5"
                    aria-label={`Avaliar ${s} estrelas`}
                  >
                    <Star
                      className={cn("h-3.5 w-3.5 transition-colors duration-200", s <= userRating ? "text-accent fill-current" : "text-muted-foreground/30 hover:text-accent/60")}
                      strokeWidth={1.4}
                    />
                  </button>
                ))}
              </div>
              <span className="text-[10px] font-medium text-muted-foreground tracking-wide select-none">Avaliar</span>
            </div>

            {/* Share */}
            <QuickAction
              icon={<Share2 className="h-5 w-5" strokeWidth={1.6} />}
              label="Partilhar"
              onClick={handleShare}
            />

            {/* Comment */}
            <a
              href="#comments"
              className="flex flex-col items-center gap-1.5 p-2 rounded-2xl hover:bg-white/5 active:scale-95 transition-all text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <MessageCircle className="h-5 w-5 mx-auto" strokeWidth={1.6} />
              <span className="text-[10px] font-medium tracking-wide">Comentar</span>
            </a>
          </div>
        </section>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* SECTION 5 — Streaming Platforms                                     */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <section className="mb-8" aria-label="Onde assistir">
          <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
            Onde Assistir
          </div>
          <div className="flex flex-wrap gap-2">
            {details.streamingPlatforms.map((p) => (
              <PlatformChip key={p.name} platform={p} />
            ))}
          </div>
        </section>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* SECTION 6 — Seasons + Episodes                                      */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <section className="mb-10" aria-label="Episódios">
          <SectionTitle
            eyebrow="Lista de episódios"
            title="Episódios"
            action={
              <span className="text-[11px] text-muted-foreground font-medium">
                {activeEpisodes.filter((ep) => watchedEpisodes[`${selectedSeason}-${ep.episodeNum}`]).length}/{activeEpisodes.length} vistos
              </span>
            }
          />

          {/* Season tabs */}
          <SeasonTabs
            count={details.seasonsCount}
            selected={selectedSeason}
            onSelect={setSelectedSeason}
            watchedPerSeason={Object.fromEntries(
              Array.from({ length: details.seasonsCount }, (_, i) => {
                const sNum = i + 1;
                const eps = details.episodes[sNum] ?? [];
                const watched = eps.filter((ep) => watchedEpisodes[`${sNum}-${ep.episodeNum}`]).length;
                return [sNum, { watched, total: eps.length }];
              })
            )}
          />

          {/* Episode list */}
          <div className="space-y-3">
            {activeEpisodes.map((ep) => (
              <EpisodeCard
                key={ep.episodeNum}
                episode={ep}
                seasonNum={selectedSeason}
                backdrop={backdropSrc}
                isWatched={!!watchedEpisodes[`${selectedSeason}-${ep.episodeNum}`]}
                onToggle={() => toggleEpisodeWatched(selectedSeason, ep)}
              />
            ))}
          </div>
        </section>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* SECTION 7 — Cast                                                    */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <section className="mb-10" aria-label="Elenco">
          <SectionTitle eyebrow="Equipe" title="Elenco principal" />
          <div className="-mx-5 flex gap-4 overflow-x-auto px-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pb-2">
            {details.cast.map((actor) => (
              <CastCard key={actor.name} actor={actor} />
            ))}
          </div>
        </section>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* SECTION 8 — Similar Series (reuses MediaCard)                       */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {similarTitles.length > 0 && (
          <section className="mb-10" aria-label="Séries semelhantes">
            <SectionTitle eyebrow="Sugestões" title="Séries semelhantes" />
            <div className="-mx-5 flex gap-3 overflow-x-auto px-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pb-2">
              {similarTitles.map((t) => (
                <div key={t.id} className="w-[110px] shrink-0">
                  <MediaCardVerticalSm media={titleToMedia(t)} readonly />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* SECTION 9 — Ratings                                                 */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <section className="mb-10" aria-label="Avaliações">
          <SectionTitle eyebrow="Avaliações" title="Crítica e notas" />
          <div className="grid grid-cols-3 gap-px bg-border rounded-3xl overflow-hidden border border-border">
            {[
              { value: details.averageRating, label: "Comunidade", gold: false },
              { value: userRating ? `${userRating}.0` : "—",       label: "Sua nota",    gold: true  },
              { value: "94%",                                        label: "Recomendam",  gold: false },
            ].map((stat) => (
              <div key={stat.label} className="bg-card/60 px-4 py-5 text-center">
                <div className={cn("text-[24px] font-black leading-none", stat.gold ? "text-accent" : "text-foreground")}>
                  {stat.value}
                </div>
                <div className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground mt-2">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* SECTION 10 — Comments                                               */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <section id="comments" className="mb-10" aria-label="Comentários da comunidade">
          <div className="flex items-end justify-between mb-5">
            <SectionTitle eyebrow="Comunidade" title="Comentários" />
            <div className="flex gap-1 shrink-0">
              {(["likes", "new"] as const).map((o) => (
                <button
                  key={o}
                  onClick={() => setSortOrder(o)}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors duration-200 cursor-pointer",
                    sortOrder === o ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {o === "likes" ? "Curtidos" : "Recentes"}
                </button>
              ))}
            </div>
          </div>

          {/* Comment input */}
          <form onSubmit={handlePostComment} className="flex gap-3 mb-6 items-start">
            <img src={PROFILE.avatar} alt={PROFILE.name} className="h-8 w-8 rounded-full border border-border object-cover shrink-0 mt-0.5" />
            <div className="flex-1">
              <textarea
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                placeholder="Compartilhe sua opinião sobre a série…"
                rows={2}
                className="w-full bg-surface-2 border border-border rounded-2xl px-4 py-3 text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent/50 resize-none"
              />
              <div className="mt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={!newCommentText.trim()}
                  className="px-4 py-1.5 rounded-xl bg-accent text-accent-foreground text-[11.5px] font-bold shadow-sm hover:scale-[1.01] active:scale-95 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
                >
                  Publicar
                </button>
              </div>
            </div>
          </form>

          {/* Comments list */}
          <div className="space-y-5">
            {sortedComments.map((com, idx) => (
              <div key={idx} className="flex gap-3.5 border-b border-border/30 pb-5 last:border-0 last:pb-0">
                <img src={com.user.avatar} alt={com.user.name} className="h-8 w-8 rounded-full border border-border object-cover shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[12.5px] font-semibold text-foreground">{com.user.name}</span>
                      {com.rating && (
                        <span className="inline-flex items-center gap-0.5 text-accent text-[9.5px] font-bold bg-accent/12 border border-accent/20 px-1.5 py-0.5 rounded-full">
                          <Star className="h-2.5 w-2.5 fill-current" strokeWidth={0} /> {com.rating}.0
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground">{com.time}</span>
                  </div>
                  <p className="text-[13px] leading-relaxed text-foreground/80">{com.comment}</p>
                  <button
                    onClick={() =>
                      setCommentsList((prev) =>
                        prev.map((c, i) => i === idx ? { ...c, likes: c.likes + 1 } : c)
                      )
                    }
                    className="mt-2 text-[11px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer active:scale-95"
                  >
                    ♥ {com.likes}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </AppShell>

      {/* ── Status Bottom Sheet (rendered outside AppShell, full viewport) ── */}
      <StatusBottomSheet
        open={showStatusSheet}
        current={status}
        onSelect={handleStatusChange}
        onDismiss={() => setShowStatusSheet(false)}
      />
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// REUSABLE SUB-COMPONENTS
// These are exported and designed to be reused in Movies, Library, Search, Profile.
// ─────────────────────────────────────────────────────────────────────────────

// ── ProgressSection ──────────────────────────────────────────────────────────

export function ProgressSection({
  watchedCount,
  totalCount,
  progressPercent,
  currentEpisodeLabel,
  status,
}: {
  watchedCount: number;
  totalCount: number;
  progressPercent: number;
  currentEpisodeLabel: string;
  status: WatchStatus;
}) {
  const remaining = totalCount - watchedCount;

  return (
    <section className="mb-7 animate-fade-in" aria-label="Progresso de exibição">
      <div className="rounded-3xl border border-border bg-card/50 p-5">
        {/* Header row */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="text-[9.5px] font-bold uppercase tracking-widest text-accent mb-1">
              Seu Progresso
            </div>
            <h3 className="text-[15px] font-bold text-foreground leading-tight">
              {status === "finished" ? "Série Concluída ✓" : status === "uptodate" ? "Em Dia ✨" : "Em andamento"}
            </h3>
          </div>
          <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/15 px-2.5 py-1 rounded-full text-[10px] font-bold text-amber-400 uppercase tracking-wide">
            <Flame className="h-3 w-3 fill-current" />
            <span>3 dias</span>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { val: watchedCount,  label: "Vistos"     },
            { val: remaining > 0 ? remaining : "—", label: "Restantes"  },
            { val: `${progressPercent}%`,            label: "Progresso"  },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl bg-secondary/60 px-3 py-3 text-center">
              <div className="text-[18px] font-extrabold text-foreground leading-none">
                {s.val}
              </div>
              <div className="text-[9.5px] uppercase tracking-wider text-muted-foreground mt-1">
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div className="mb-3">
          <div className="h-2 w-full overflow-hidden rounded-full bg-white/8">
            <div
              className="h-full rounded-full bg-accent transition-all duration-700 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Next episode label */}
        {currentEpisodeLabel !== "Todos assistidos" && (
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <Play className="h-3 w-3 text-accent shrink-0" strokeWidth={0} fill="currentColor" />
            <span>Próximo: <span className="text-foreground/80 font-medium">{currentEpisodeLabel}</span></span>
          </div>
        )}
      </div>
    </section>
  );
}

// ── SeasonTabs ────────────────────────────────────────────────────────────────

export function SeasonTabs({
  count,
  selected,
  onSelect,
  watchedPerSeason,
}: {
  count: number;
  selected: number;
  onSelect: (n: number) => void;
  watchedPerSeason?: Record<number, { watched: number; total: number }>;
}) {
  return (
    <div className="-mx-5 mb-5 flex overflow-x-auto px-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden border-b border-border/50 gap-0">
      {Array.from({ length: count }, (_, i) => i + 1).map((sNum) => {
        const active = selected === sNum;
        const season = watchedPerSeason?.[sNum];
        const allWatched = season && season.watched === season.total && season.total > 0;

        return (
          <button
            key={sNum}
            onClick={() => onSelect(sNum)}
            className={cn(
              "relative flex items-center gap-1.5 py-3 px-4 text-[12.5px] font-bold tracking-wide shrink-0 cursor-pointer transition-colors duration-200 whitespace-nowrap",
              active ? "text-foreground" : "text-muted-foreground/60 hover:text-muted-foreground"
            )}
          >
            {allWatched && (
              <Check className="h-3 w-3 text-emerald-400 shrink-0" strokeWidth={3} />
            )}
            Temporada {sNum}
            {season && (
              <span className={cn("text-[9px] font-semibold rounded-full px-1.5 py-0.2",
                allWatched ? "text-emerald-400/80" : "text-muted-foreground/50"
              )}>
                {season.watched}/{season.total}
              </span>
            )}
            {active && (
              <span className="absolute bottom-0 left-0 right-0 h-[2.5px] rounded-full bg-accent" />
            )}
          </button>
        );
      })}
    </div>
  );
}

// ── EpisodeCard ───────────────────────────────────────────────────────────────

export function EpisodeCard({
  episode,
  seasonNum,
  backdrop,
  isWatched,
  onToggle,
}: {
  episode: EpisodeData;
  seasonNum: number;
  backdrop: string;
  isWatched: boolean;
  onToggle: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={cn(
        "rounded-2xl border bg-card/40 overflow-hidden transition-all duration-300",
        isWatched ? "border-emerald-500/15 bg-emerald-500/[0.02]" : "border-border"
      )}
    >
      <div className="flex gap-3.5 p-3">
        {/* Thumbnail */}
        <button
          onClick={onToggle}
          className="relative aspect-[16/9] w-[108px] shrink-0 overflow-hidden rounded-xl bg-surface-2 border border-border/60 cursor-pointer group/thumb active:scale-95 transition-transform"
          aria-label={isWatched ? "Marcar como não visto" : "Marcar como visto"}
        >
          <img
            src={backdrop}
            alt=""
            className="h-full w-full object-cover opacity-55 transition-opacity duration-300 group-hover/thumb:opacity-70"
          />
          {/* Overlay */}
          <div className={cn(
            "absolute inset-0 flex items-center justify-center transition-all duration-300",
            isWatched ? "bg-emerald-500/20" : "bg-black/30 opacity-0 group-hover/thumb:opacity-100"
          )}>
            {isWatched ? (
              <Check className="h-5 w-5 text-emerald-400" strokeWidth={3} />
            ) : (
              <Play className="h-4 w-4 text-white fill-current" strokeWidth={0} />
            )}
          </div>
          {/* Ep number badge */}
          <div className="absolute bottom-1.5 left-2 text-[9.5px] font-extrabold text-white bg-black/55 px-1.5 py-0.5 rounded-md">
            E{episode.episodeNum}
          </div>
          {isWatched && (
            <div className="absolute top-1.5 right-1.5 h-5 w-5 rounded-full bg-emerald-500 flex items-center justify-center shadow">
              <Check className="h-3 w-3 text-white" strokeWidth={3} />
            </div>
          )}
        </button>

        {/* Info */}
        <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
          <div>
            <h4 className={cn(
              "text-[13.5px] font-bold leading-tight truncate transition-colors duration-200",
              isWatched ? "text-foreground/60" : "text-foreground"
            )}>
              {episode.title}
            </h4>
            <div className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[10px] text-muted-foreground">
              <span>{episode.runtime}</span>
              <span>·</span>
              <span>{episode.airDate}</span>
              <span>·</span>
              <span className="flex items-center gap-0.5 text-accent font-semibold">
                <Star className="h-2.5 w-2.5 fill-current" strokeWidth={0} />
                {episode.rating}
              </span>
            </div>
          </div>

          {/* Overview toggle + mark button */}
          <div className="mt-2 flex items-center justify-between gap-3">
            <button
              onClick={() => setExpanded((v) => !v)}
              className="text-[10px] text-muted-foreground/70 hover:text-muted-foreground underline-offset-2 hover:underline transition-colors cursor-pointer"
            >
              {expanded ? "Menos" : "Sinopse"}
            </button>

            <button
              onClick={onToggle}
              className={cn(
                "flex h-7 items-center gap-1.5 rounded-xl border px-2.5 text-[10.5px] font-bold transition-all duration-200 active:scale-90 cursor-pointer",
                isWatched
                  ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
                  : "border-border text-muted-foreground hover:text-foreground hover:bg-white/5"
              )}
              aria-label={isWatched ? "Desmarcar" : "Marcar como visto"}
            >
              <Check className="h-3 w-3" strokeWidth={3} />
              <span>{isWatched ? "Visto" : "Marcar"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Expandable synopsis */}
      {expanded && (
        <div className="px-3 pb-3 -mt-1 animate-fade-in">
          <p className="text-[12px] text-muted-foreground/80 leading-relaxed border-t border-border/40 pt-2.5">
            {episode.overview}
          </p>
        </div>
      )}
    </div>
  );
}

// ── PlatformChip ──────────────────────────────────────────────────────────────

export function PlatformChip({ platform }: { platform: StreamingPlatform }) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 px-4 py-2.5 rounded-2xl border font-bold text-[12.5px] tracking-wide transition-transform duration-200 active:scale-95 cursor-default select-none",
        platform.logoColor
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />
      {platform.name}
    </div>
  );
}

// ── CastCard ──────────────────────────────────────────────────────────────────

export function CastCard({ actor }: { actor: CastMember }) {
  return (
    <button
      onClick={() => toast.info("Página do ator em breve!")}
      className="w-[80px] shrink-0 text-center group active:scale-95 transition-transform duration-200 cursor-pointer"
      aria-label={`Ver ${actor.name}`}
    >
      <div className="relative mx-auto h-14 w-14 rounded-full overflow-hidden border border-border bg-surface-2 transition-transform duration-300 group-hover:scale-105">
        <img
          src={actor.avatar}
          alt={actor.name}
          className="h-full w-full object-cover"
        />
        {/* Subtle shine ring on hover */}
        <div className="absolute inset-0 rounded-full ring-0 group-hover:ring-1 group-hover:ring-accent/30 transition-all duration-300" />
      </div>
      <div className="mt-2 text-[11px] font-bold text-foreground group-hover:text-accent transition-colors duration-200 leading-tight px-1 line-clamp-2">
        {actor.name}
      </div>
      <div className="mt-0.5 text-[9.5px] text-muted-foreground leading-tight px-1 line-clamp-1">
        {actor.character}
      </div>
    </button>
  );
}

// ── QuickAction ───────────────────────────────────────────────────────────────

function QuickAction({
  icon,
  label,
  onClick,
  active = false,
  activeClass = "text-accent",
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
  activeClass?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1.5 p-2 rounded-2xl hover:bg-white/5 active:scale-95 transition-all cursor-pointer flex-1",
        active ? activeClass : "text-muted-foreground hover:text-foreground"
      )}
    >
      {icon}
      <span className="text-[10px] font-medium tracking-wide">{label}</span>
    </button>
  );
}

// ── StatusBottomSheet ─────────────────────────────────────────────────────────

export function StatusBottomSheet({
  open,
  current,
  onSelect,
  onDismiss,
}: {
  open: boolean;
  current: WatchStatus;
  onSelect: (s: WatchStatus) => void;
  onDismiss: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end" role="dialog" aria-modal aria-label="Alterar status">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in"
        onClick={onDismiss}
      />

      {/* Sheet */}
      <div className="relative z-10 rounded-t-[28px] bg-card border border-border border-b-0 p-6 pb-10 animate-rise">
        {/* Handle */}
        <div className="mx-auto mb-6 h-1 w-10 rounded-full bg-border/80" />

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-0.5">Alterar status</div>
            <h2 className="text-[17px] font-bold text-foreground tracking-tight">Como você está?</h2>
          </div>
          <button
            onClick={onDismiss}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all cursor-pointer active:scale-90"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" strokeWidth={1.8} />
          </button>
        </div>

        {/* Status options */}
        <div className="space-y-2">
          {STATUS_ORDER.map((s) => {
            const meta = STATUS_META[s];
            const isActive = current === s;
            return (
              <button
                key={s}
                onClick={() => onSelect(s)}
                className={cn(
                  "w-full flex items-center gap-4 rounded-2xl border px-4 py-3.5 text-left transition-all duration-200 active:scale-[0.98] cursor-pointer",
                  isActive
                    ? "border-accent/30 bg-accent/8"
                    : "border-border/50 bg-secondary/40 hover:bg-secondary/70"
                )}
              >
                <span className={cn("h-2.5 w-2.5 rounded-full shrink-0", meta.dot)} />
                <div className="flex-1 min-w-0">
                  <div className={cn("text-[13.5px] font-bold", isActive ? meta.color : "text-foreground")}>
                    {meta.label}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">{meta.desc}</div>
                </div>
                {isActive && (
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent">
                    <Check className="h-3 w-3 text-accent-foreground" strokeWidth={3} />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Extra hint */}
        <div className="mt-4 flex items-center gap-2 text-[11px] text-muted-foreground/60">
          <Sparkles className="h-3.5 w-3.5 shrink-0" strokeWidth={1.4} />
          Alterar o status atualiza seu progresso automaticamente.
        </div>
      </div>
    </div>
  );
}

