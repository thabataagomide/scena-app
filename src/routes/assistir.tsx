import { createFileRoute } from "@tanstack/react-router";
import { Check, Play } from "lucide-react";
import { AppShell, SectionTitle } from "@/components/scena/AppShell";
import { Backdrop } from "@/components/scena/Backdrop";
import { WATCHING, type WatchingItem } from "@/lib/scena-data";

export const Route = createFileRoute("/assistir")({
  head: () => ({
    meta: [
      { title: "Assistir · Scena" },
      { name: "description", content: "Continue suas séries em andamento." },
    ],
  }),
  component: AssistirPage,
});

function AssistirPage() {
  return (
    <AppShell>
      <SectionTitle
        eyebrow="Continuar assistindo"
        title="Onde você parou"
      />
      <div className="mb-10 space-y-4">
        {WATCHING.map((w) => (
          <WatchingCard key={w.id} item={w} />
        ))}
      </div>

      <SectionTitle eyebrow="Próximos" title="Próximos episódios" />
      <div className="mb-10 space-y-3">
        {WATCHING.map((w) => (
          <div
            key={w.id + "-next"}
            className="flex items-center gap-4 rounded-2xl border border-border bg-card p-3"
          >
            <img
              src={w.title.poster ?? w.title.backdrop}
              alt={w.title.title}
              className="h-16 w-12 rounded-md border border-border object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="min-w-0 flex-1">
              <div className="truncate text-[14.5px] font-semibold text-foreground">
                {w.title.title}
              </div>
              <div className="mt-0.5 truncate text-[12px] text-muted-foreground">
                {w.nextLabel}
              </div>
            </div>
            <button
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-accent transition-colors hover:bg-accent hover:text-accent-foreground"
              aria-label="Marcar como assistido"
            >
              <Check className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>
        ))}
      </div>

      <SectionTitle eyebrow="Alerta" title="Novos episódios disponíveis" />
      <div className="rounded-2xl border border-border bg-surface-2 p-5 text-[13px] leading-relaxed text-muted-foreground">
        Você está em dia com todas as suas séries acompanhadas. Assim que
        chegarem novos episódios, eles aparecerão aqui automaticamente.
      </div>
    </AppShell>
  );
}

function WatchingCard({ item }: { item: WatchingItem }) {
  const progress = Math.round(
    (item.watchedEpisodes / item.totalEpisodes) * 100,
  );
  return (
    <article className="relative h-[168px] overflow-hidden rounded-3xl border border-border">
      <Backdrop src={item.title.backdrop} alt={item.title.title} />
      <div className="relative flex h-full items-end justify-between gap-4 p-5">
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-medium text-accent">
            T{item.season} · E{item.episode}
          </div>
          <h3 className="tracking-title mt-1 truncate text-[19px] font-semibold text-foreground">
            {item.title.title}
          </h3>
          <div className="mt-3 flex items-center gap-3">
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-accent"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-[11px] text-muted-foreground">
              {item.watchedEpisodes}/{item.totalEpisodes}
            </span>
          </div>
        </div>
        <button
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-lg transition-transform active:scale-95"
          aria-label="Marcar próximo episódio como assistido"
        >
          <Play className="h-[18px] w-[18px] fill-current" strokeWidth={0} />
        </button>
      </div>
    </article>
  );
}
