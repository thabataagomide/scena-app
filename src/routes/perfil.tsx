import { createFileRoute, Link } from "@tanstack/react-router";
import { Settings, Trophy } from "lucide-react";
import { AppShell, SectionTitle } from "@/components/scena/AppShell";
import { PROFILE } from "@/lib/scena-data";

export const Route = createFileRoute("/perfil")({
  head: () => ({
    meta: [
      { title: "Perfil · Scena" },
      { name: "description", content: "Sua identidade cinéfila no Scena." },
    ],
  }),
  component: PerfilPage,
});

function PerfilPage() {
  return (
    <AppShell>
      <div className="relative">
        <button
          className="absolute right-0 top-0 flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:text-foreground"
          aria-label="Configurações"
        >
          <Settings className="h-4 w-4" strokeWidth={1.6} />
        </button>

        <div className="flex flex-col items-center text-center">
          <img
            src={PROFILE.avatar}
            alt={PROFILE.name}
            className="h-24 w-24 rounded-full border border-border object-cover"
          />
          <h1 className="tracking-title mt-4 text-[22px] font-semibold text-foreground">
            {PROFILE.name}
          </h1>
          <div className="mt-0.5 text-[13px] text-muted-foreground">
            {PROFILE.username} · <span>{PROFILE.flag} {PROFILE.country}</span>
          </div>
          <p className="mt-3 max-w-[320px] text-[13.5px] leading-relaxed text-foreground/80">
            {PROFILE.bio}
          </p>

          <div className="mt-5 flex items-center gap-6">
            <FollowStat label="Seguidores" value={PROFILE.followers} />
            <div className="h-6 w-px bg-border" />
            <FollowStat label="Seguindo" value={PROFILE.following} />
          </div>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-4 gap-2">
        {PROFILE.stats.map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border border-border bg-card px-2 py-4 text-center"
          >
            <div className="tracking-title text-[17px] font-semibold text-foreground">
              {s.value.toLocaleString("pt-BR")}
            </div>
            <div className="mt-0.5 text-[10.5px] uppercase tracking-wider text-muted-foreground">
              {s.label}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10">
        <SectionTitle eyebrow="Favoritas" title="Séries favoritas" />
        <PosterRow items={PROFILE.favoriteSeries} />
      </div>

      <div className="mt-10">
        <SectionTitle eyebrow="Favoritos" title="Filmes favoritos" />
        <PosterRow items={PROFILE.favoriteMovies} />
      </div>

      <div className="mt-10">
        <SectionTitle eyebrow="Diário" title="Últimos assistidos" />
        <PosterRow items={PROFILE.recentlyWatched} />
      </div>

      <div className="mt-10">
        <SectionTitle eyebrow="Reconhecimento" title="Conquistas" />
        <div className="grid grid-cols-3 gap-3">
          {["Maratonista", "Cinéfilo", "Crítico"].map((c) => (
            <div
              key={c}
              className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-4"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border text-accent">
                <Trophy className="h-4 w-4" strokeWidth={1.6} />
              </div>
              <div className="text-center text-[12px] font-medium text-foreground">
                {c}
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

function FollowStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center">
      <div className="tracking-title text-[16px] font-semibold text-foreground">
        {value.toLocaleString("pt-BR")}
      </div>
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
    </div>
  );
}

function PosterRow({
  items,
}: {
  items: { id: string; title: string; poster?: string; backdrop: string }[];
}) {
  return (
    <div className="-mx-5 flex gap-3 overflow-x-auto px-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {items.map((t) => (
        <Link
          key={t.id}
          to="/series/$id"
          params={{ id: t.id }}
          className="w-[110px] shrink-0 block group active:scale-[0.98] transition-all duration-300 cursor-pointer"
        >
          <div className="aspect-[2/3] overflow-hidden rounded-xl border border-border bg-surface-2 relative">
            <img
              src={t.poster ?? t.backdrop}
              alt={t.title}
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </div>
          <div className="mt-2 truncate text-[12px] font-medium text-foreground group-hover:text-accent transition-colors duration-200">
            {t.title}
          </div>
        </Link>
      ))}
    </div>
  );
}
