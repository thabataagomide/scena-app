/**
 * /movies/$id — Movie Details Page
 *
 * Cinematic details page for a single movie, fed by TMDb (with mock fallback).
 * Reuses PlatformChip, CastCard and MediaCardVerticalSm from the Series page
 * so cast, providers and recommendations stay visually consistent.
 */

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Bookmark,
  Check,
  Film,
  Heart,
  MessageCircle,
  Plus,
  Share2,
  Star,
} from "lucide-react";
import { AppShell, SectionTitle } from "@/components/scena/AppShell";
import { MediaCardVerticalSm, titleToMedia } from "@/components/scena/MediaCard";
import { CastCard, PlatformChip } from "@/routes/series.$id";
import { movieService } from "@/services/movie.service";
import { libraryStore, type MovieLibraryStatus } from "@/services/library.store";
import type { Movie, MovieDetails } from "@/services/models";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/movies/$id")({
  head: ({ params }) => {
    const base = movieService.getMovie(params.id);
    return {
      meta: [
        { title: base ? `${base.title} · Scena` : "Filme · Scena" },
        {
          name: "description",
          content: base?.overview ?? "Detalhes do filme, elenco, avaliações e onde assistir.",
        },
      ],
    };
  },
  component: MovieDetailsPage,
});

// ─── Placeholder community comments ──────────────────────────────────────────

const MOCK_COMMENTS = [
  {
    name: "Camila R.",
    avatar: "https://i.pravatar.cc/100?u=camila",
    time: "há 2 dias",
    rating: 5,
    body: "Filme absolutamente arrebatador. Vou pensar nele por semanas.",
    likes: 42,
  },
  {
    name: "Lucas M.",
    avatar: "https://i.pravatar.cc/100?u=lucasmov",
    time: "há 5 dias",
    rating: 4,
    body: "Fotografia impecável e trilha sonora inesquecível. Uma pequena queda no ato final.",
    likes: 21,
  },
];

// ─── Page ────────────────────────────────────────────────────────────────────

function MovieDetailsPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();

  const [base, setBase] = useState<Movie | undefined>(() => movieService.getMovie(id));
  const [details, setDetails] = useState<MovieDetails | null>(null);
  const [similar, setSimilar] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [errored, setErrored] = useState(false);
  const [attempt, setAttempt] = useState(0);

  const [status, setStatus] = useState<MovieLibraryStatus | undefined>(() =>
    typeof window !== "undefined"
      ? (libraryStore.get({ id, kind: "movie" })?.status as MovieLibraryStatus | undefined)
      : undefined,
  );
  const [favorited, setFavorited] = useState<boolean>(() =>
    typeof window !== "undefined" ? Boolean(libraryStore.get({ id, kind: "movie" })?.favorite) : false,
  );
  const [userRating, setUserRating] = useState<number>(() =>
    typeof window !== "undefined" ? (libraryStore.get({ id, kind: "movie" })?.rating ?? 0) : 0,
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setErrored(false);
    Promise.all([
      movieService.getMovieAsync(id),
      movieService.getMovieDetailsAsync(id),
      movieService.getSimilarMoviesAsync(id),
    ])
      .then(([b, d, sims]) => {
        if (cancelled) return;
        if (b) setBase(b);
        setDetails(d);
        setSimilar(sims.filter((m) => m.id !== id));
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setErrored(true);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, attempt]);

  const backdropSrc =
    base?.backdrop ?? "https://image.tmdb.org/t/p/w1280/56v2KjBlU4XaOv9rVYEQypROD7P.jpg";
  const posterSrc = base?.poster ?? base?.backdrop;

  const genres = useMemo(() => details?.genres ?? base?.genres ?? [], [details, base]);
  const currentMovie = useMemo<Movie | undefined>(() => {
    if (!base) return undefined;
    return {
      ...base,
      genres,
      tmdbRating: details?.averageRating ?? base.tmdbRating,
    };
  }, [base, details, genres]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const item = libraryStore.get({ id, kind: "movie" });
    setStatus(item?.status as MovieLibraryStatus | undefined);
    setFavorited(Boolean(item?.favorite));
    setUserRating(item?.rating ?? 0);
  }, [id]);

  // ── Handlers ──
  const toggleStatus = (next: MovieLibraryStatus) => {
    if (!currentMovie) return;
    if (status === next) {
      libraryStore.remove(currentMovie);
      setStatus(undefined);
      setFavorited(false);
      setUserRating(0);
      toast.info("Removido da biblioteca");
      return;
    }
    const item = libraryStore.setStatus(currentMovie, next);
    setStatus(item.status as MovieLibraryStatus);
    setFavorited(item.favorite);
    setUserRating(item.rating ?? 0);
    toast.success(next === "want" ? "Adicionado a Quero assistir" : "Marcado como assistido", {
      description: base?.title,
    });
  };

  const toggleFavorite = () => {
    if (!currentMovie) return;
    const nextVal = !favorited;
    const item = libraryStore.setFavorite(currentMovie, nextVal);
    setStatus(item.status as MovieLibraryStatus);
    setFavorited(item.favorite);
    setUserRating(item.rating ?? 0);
    toast[nextVal ? "success" : "info"](
      nextVal ? `Favoritado: ${base?.title ?? "Filme"}` : "Removido dos favoritos",
    );
  };

  const rate = (n: number) => {
    if (!currentMovie) return;
    const item = libraryStore.setRating(currentMovie, n);
    setStatus(item.status as MovieLibraryStatus);
    setFavorited(item.favorite);
    setUserRating(item.rating ?? 0);
    toast.success(`${n} estrelas — obrigado pela avaliação!`);
  };

  const toggleLibraryMembership = () => {
    if (!currentMovie) return;
    if (status) {
      libraryStore.remove(currentMovie);
      setStatus(undefined);
      setFavorited(false);
      setUserRating(0);
      toast.info("Removido da biblioteca", { description: currentMovie.title });
      return;
    }
    const item = libraryStore.setStatus(currentMovie, "want");
    setStatus(item.status as MovieLibraryStatus);
    setFavorited(item.favorite);
    setUserRating(item.rating ?? 0);
    toast.success("Adicionado à sua biblioteca", { description: currentMovie.title });
  };

  const handleShare = () => {
    if (typeof navigator === "undefined") return;
    if (navigator.share) {
      navigator
        .share({ title: base?.title, text: details?.tagline, url: window.location.href })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copiado!");
    }
  };

  // ── Render states ──
  if (loading && !details) {
    return (
      <AppShell>
        <MovieDetailsSkeleton />
      </AppShell>
    );
  }

  if (errored || !details) {
    return (
      <AppShell>
        <div className="mt-16 flex flex-col items-center gap-4 text-center">
          <Film className="h-10 w-10 text-muted-foreground" strokeWidth={1.4} />
          <div>
            <h1 className="tracking-title text-[18px] font-semibold text-foreground">
              Não foi possível carregar
            </h1>
            <p className="mt-1 text-[13px] text-muted-foreground">
              Verifique sua conexão e tente novamente.
            </p>
          </div>
          <button
            onClick={() => setAttempt((n) => n + 1)}
            className="mt-2 rounded-2xl bg-accent px-5 py-3 text-[12.5px] font-bold text-accent-foreground shadow active:scale-95"
          >
            Tentar de novo
          </button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <button
        onClick={() => navigate({ to: "/buscar" })}
        className="mb-5 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors duration-200 active:scale-95"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Voltar
      </button>

      {/* ── Cinematic Header ── */}
      <section className="-mx-5 relative overflow-hidden mb-8" aria-label="Informações do filme">
        <div className="absolute inset-0 z-0" aria-hidden>
          <img
            src={backdropSrc}
            alt=""
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover opacity-30 scale-105"
            style={{ filter: "blur(1px)" }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#090909] via-[#090909]/70 to-[#090909]/20" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#090909] via-transparent to-[#090909]/60" />
        </div>

        <div className="relative z-10 px-5 pt-8 pb-7">
          <div className="flex gap-5 items-end">
            {posterSrc && (
              <div className="shrink-0">
                <img
                  src={posterSrc}
                  alt={base?.title}
                  referrerPolicy="no-referrer"
                  className="w-[108px] aspect-[2/3] rounded-2xl border border-white/10 object-cover shadow-[0_24px_60px_rgba(0,0,0,0.9)] bg-surface-2"
                />
              </div>
            )}

            <div className="min-w-0 flex-1 pb-1">
              <div className="flex items-center gap-1.5 flex-wrap mb-2">
                <span className="text-[9.5px] font-bold uppercase tracking-widest text-accent/90 bg-accent/10 border border-accent/20 px-2 py-0.5 rounded-full">
                  Filme
                </span>
                <span className="text-[10px] text-muted-foreground">·</span>
                <span className="text-[10px] text-muted-foreground font-medium">
                  {details.year}
                </span>
                {details.ageRating && details.ageRating !== "—" && (
                  <>
                    <span className="text-[10px] text-muted-foreground">·</span>
                    <span className="text-[9.5px] border border-border text-muted-foreground px-1.5 py-0.3 rounded font-semibold">
                      {details.ageRating}
                    </span>
                  </>
                )}
              </div>

              <h1 className="tracking-title text-[22px] font-extrabold text-foreground leading-[1.1] break-words mb-1">
                {base?.title ?? details.id}
              </h1>

              {details.originalTitle && details.originalTitle !== base?.title && (
                <div className="text-[11.5px] italic text-muted-foreground/70 mb-2">
                  {details.originalTitle}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10.5px] text-muted-foreground mb-2.5">
                <span>{details.runtime}</span>
              </div>

              {genres.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {genres.map((g) => (
                    <span
                      key={g}
                      className="text-[9.5px] font-medium px-2 py-0.5 rounded-full bg-white/6 border border-white/10 text-foreground/70"
                    >
                      {g}
                    </span>
                  ))}
                </div>
              )}

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

          {details.tagline && (
            <p className="mt-4 text-[12px] italic text-muted-foreground/70 leading-relaxed border-l-2 border-accent/30 pl-3">
              "{details.tagline}"
            </p>
          )}
        </div>
      </section>

      {/* ── Primary CTAs ── */}
      <section className="mb-7 flex gap-3" aria-label="Ações principais">
        <button
          onClick={() => toggleStatus("want")}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-2xl font-bold text-[13px] py-3.5 transition-all duration-200 active:scale-95",
            status === "want"
              ? "bg-accent text-accent-foreground shadow-[0_8px_30px_rgba(216,190,132,0.25)]"
              : "border border-border bg-card/60 text-foreground hover:bg-card/80",
          )}
        >
          <Bookmark className="h-4 w-4" strokeWidth={1.8} />
          {status === "want" ? "Na lista" : "Quero assistir"}
        </button>
        <button
          onClick={() => toggleStatus("watched")}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-2xl font-bold text-[13px] py-3.5 transition-all duration-200 active:scale-95",
            status === "watched"
              ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-300"
              : "border border-border bg-card/60 text-foreground hover:bg-card/80",
          )}
        >
          <Check className="h-4 w-4" strokeWidth={2} />
          {status === "watched" ? "Assistido" : "Marcar assistido"}
        </button>
      </section>

      {/* ── Quick Actions ── */}
      <section className="mb-8" aria-label="Ações rápidas">
        <div className="flex items-center justify-around rounded-3xl border border-border bg-card/40 p-4">
          <QuickAction
            icon={<Heart className={cn("h-5 w-5", favorited && "fill-current")} strokeWidth={1.6} />}
            label="Favorito"
            onClick={toggleFavorite}
            active={favorited}
            activeClass="text-red-500"
          />
          <QuickAction
            icon={<Plus className="h-5 w-5" strokeWidth={1.6} />}
            label={status ? "Remover" : "Na Lista"}
            onClick={toggleLibraryMembership}
            active={Boolean(status)}
          />

          <div className="flex flex-col items-center gap-1.5">
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  onClick={() => rate(s)}
                  className="p-0.5"
                  aria-label={`Avaliar ${s} estrelas`}
                >
                  <Star
                    className={cn(
                      "h-3.5 w-3.5 transition-colors duration-200",
                      s <= userRating
                        ? "text-accent fill-current"
                        : "text-muted-foreground/30 hover:text-accent/60",
                    )}
                    strokeWidth={1.4}
                  />
                </button>
              ))}
            </div>
            <span className="text-[10px] font-medium text-muted-foreground tracking-wide">
              Avaliar
            </span>
          </div>

          <QuickAction
            icon={<Share2 className="h-5 w-5" strokeWidth={1.6} />}
            label="Partilhar"
            onClick={handleShare}
          />

          <a
            href="#comments"
            className="flex flex-col items-center gap-1.5 p-2 rounded-2xl hover:bg-white/5 active:scale-95 transition-all text-muted-foreground hover:text-foreground"
          >
            <MessageCircle className="h-5 w-5" strokeWidth={1.6} />
            <span className="text-[10px] font-medium tracking-wide">Comentar</span>
          </a>
        </div>
      </section>

      {/* ── Synopsis ── */}
      {details.overview && (
        <section className="mb-8" aria-label="Sinopse">
          <SectionTitle eyebrow="Sobre o filme" title="Sinopse" />
          <p className="text-[13.5px] leading-relaxed text-foreground/80">{details.overview}</p>
        </section>
      )}

      {/* ── Movie Info ── */}
      <section className="mb-8" aria-label="Informações do filme">
        <SectionTitle eyebrow="Detalhes" title="Ficha técnica" />
        <div className="rounded-3xl border border-border bg-card/40 divide-y divide-border/60">
          <InfoRow label="Lançamento" value={formatDate(details.releaseDate) ?? "—"} />
          <InfoRow label="Duração" value={details.runtime} />
          <InfoRow label="Idioma original" value={details.originalLanguage ?? "—"} />
          <InfoRow label="País" value={details.country ?? "—"} />
          <InfoRow label="Gêneros" value={genres.length > 0 ? genres.join(", ") : "—"} />
        </div>
      </section>

      {/* ── Where to watch ── */}
      <section className="mb-8" aria-label="Onde assistir">
        <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
          Onde Assistir
        </div>
        {details.streamingPlatforms.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {details.streamingPlatforms.map((p) => (
              <PlatformChip key={p.name} platform={p} />
            ))}
          </div>
        ) : (
          <EmptyLine text="Sem plataformas disponíveis por enquanto." />
        )}
      </section>

      {/* ── Cast ── */}
      <section className="mb-10" aria-label="Elenco">
        <SectionTitle eyebrow="Equipe" title="Elenco principal" />
        {details.cast.length > 0 ? (
          <div className="-mx-5 flex gap-4 overflow-x-auto px-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pb-2">
            {details.cast.map((actor) => (
              <CastCard key={`${actor.name}-${actor.character ?? ""}`} actor={actor} />
            ))}
          </div>
        ) : (
          <EmptyLine text="Elenco ainda não disponível." />
        )}
      </section>

      {/* ── Similar Movies ── */}
      <section className="mb-10" aria-label="Filmes semelhantes">
        <SectionTitle eyebrow="Sugestões" title="Filmes semelhantes" />
        {similar.length > 0 ? (
          <div className="-mx-5 flex gap-3 overflow-x-auto px-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pb-2">
            {similar.map((t) => (
              <div key={t.id} className="w-[110px] shrink-0">
                <MediaCardVerticalSm media={titleToMedia(t)} readonly />
              </div>
            ))}
          </div>
        ) : (
          <EmptyLine text="Nenhuma recomendação disponível." />
        )}
      </section>

      {/* ── Ratings + Reviews ── */}
      <section id="comments" className="mb-10" aria-label="Avaliações">
        <SectionTitle eyebrow="Comunidade" title="Notas e avaliações" />
        <div className="grid grid-cols-3 gap-px bg-border rounded-3xl overflow-hidden border border-border mb-6">
          {[
            { value: details.averageRating, label: "Comunidade", gold: false },
            { value: userRating ? `${userRating}.0` : "—", label: "Sua nota", gold: true },
            { value: "92%", label: "Recomendam", gold: false },
          ].map((stat) => (
            <div key={stat.label} className="bg-card/60 px-4 py-5 text-center">
              <div
                className={cn(
                  "text-[24px] font-black leading-none",
                  stat.gold ? "text-accent" : "text-foreground",
                )}
              >
                {stat.value}
              </div>
              <div className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground mt-2">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-5">
          {MOCK_COMMENTS.map((c) => (
            <div
              key={c.name}
              className="flex gap-3.5 border-b border-border/30 pb-5 last:border-0 last:pb-0"
            >
              <img
                src={c.avatar}
                alt={c.name}
                className="h-8 w-8 rounded-full border border-border object-cover shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[12.5px] font-semibold text-foreground">{c.name}</span>
                    <span className="inline-flex items-center gap-0.5 text-accent text-[9.5px] font-bold bg-accent/12 border border-accent/20 px-1.5 py-0.5 rounded-full">
                      <Star className="h-2.5 w-2.5 fill-current" strokeWidth={0} /> {c.rating}.0
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">{c.time}</span>
                </div>
                <p className="text-[13px] leading-relaxed text-foreground/80">{c.body}</p>
                <div className="mt-2 text-[11px] text-muted-foreground">♥ {c.likes}</div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </AppShell>
  );
}

// ─── Small helpers ───────────────────────────────────────────────────────────

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
        "flex flex-col items-center gap-1.5 p-2 rounded-2xl hover:bg-white/5 active:scale-95 transition-all flex-1",
        active ? activeClass : "text-muted-foreground hover:text-foreground",
      )}
    >
      {icon}
      <span className="text-[10px] font-medium tracking-wide">{label}</span>
    </button>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 px-4 py-3">
      <span className="text-[11.5px] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <span className="text-right text-[12.5px] font-medium text-foreground/90">{value}</span>
    </div>
  );
}

function EmptyLine({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border/70 px-4 py-4 text-[12.5px] text-muted-foreground">
      {text}
    </div>
  );
}

function formatDate(iso?: string): string | undefined {
  if (!iso) return undefined;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function MovieDetailsSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="-mx-5 mb-8">
        <div className="h-[280px] w-full bg-surface-2/60" />
      </div>
      <div className="mb-7 flex gap-3">
        <div className="h-12 flex-1 rounded-2xl bg-surface-2/60" />
        <div className="h-12 flex-1 rounded-2xl bg-surface-2/60" />
      </div>
      <div className="mb-8 h-24 rounded-3xl bg-surface-2/60" />
      <div className="mb-8 h-40 rounded-3xl bg-surface-2/60" />
      <div className="mb-8 flex gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-14 w-14 rounded-full bg-surface-2/60" />
        ))}
      </div>
      <div className="flex gap-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-40 w-[110px] rounded-2xl bg-surface-2/60" />
        ))}
      </div>
    </div>
  );
}
