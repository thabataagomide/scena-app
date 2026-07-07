import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Heart, MessageCircle, MoreHorizontal, Star, Sparkles } from "lucide-react";
import { AppShell, SectionTitle } from "@/components/scena/AppShell";
import { Backdrop } from "@/components/scena/Backdrop";
import { FEED, UPCOMING, type FeedItem } from "@/lib/scena-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  const [tab, setTab] = useState<"feed" | "novidades">("feed");

  return (
    <AppShell
      header={
        <Tabs
          value={tab}
          onChange={setTab}
          items={[
            { value: "feed", label: "Feed" },
            { value: "novidades", label: "Novidades" },
          ]}
        />
      }
    >
      {tab === "feed" ? <FeedList /> : <Novidades />}
    </AppShell>
  );
}

function Tabs<T extends string>({
  value,
  onChange,
  items,
}: {
  value: T;
  onChange: (v: T) => void;
  items: { value: T; label: string }[];
}) {
  return (
    <div className="mb-6 flex items-center justify-center gap-10 border-b border-border">
      {items.map((it) => {
        const active = value === it.value;
        return (
          <button
            key={it.value}
            onClick={() => onChange(it.value)}
            className={cn(
              "tracking-eyebrow relative -mb-px py-3 text-[11px] font-semibold transition-colors",
              active ? "text-foreground" : "text-muted-foreground",
            )}
          >
            {it.label}
            <span
              className={cn(
                "absolute inset-x-0 -bottom-px h-[2px] rounded-full transition-all duration-300",
                active ? "bg-accent" : "bg-transparent",
              )}
            />
          </button>
        );
      })}
    </div>
  );
}

function FeedList() {
  return (
    <div className="space-y-5">
      {FEED.map((item, i) => (
        <div
          key={item.id}
          className="animate-rise"
          style={{ animationDelay: `${i * 60}ms` }}
        >
          <FeedCard item={item} />
        </div>
      ))}
    </div>
  );
}

function FeedCard({ item }: { item: FeedItem }) {
  const [liked, setLiked] = useState(false);

  return (
    <article className="card-surface group relative overflow-hidden transition-transform duration-500 hover:-translate-y-0.5">
      <div className="relative min-h-[232px]">
        <Backdrop src={item.title.backdrop} alt={item.title.title} />

        <div className="relative flex h-full flex-col p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <img
                src={item.user.avatar}
                alt={item.user.name}
                className="h-9 w-9 shrink-0 rounded-full border border-border object-cover"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="truncate text-[14px] font-semibold text-foreground">
                    {item.user.name}
                  </span>
                  <span className="text-[11.5px] font-normal text-muted-foreground">
                    · {item.time}
                  </span>
                </div>
                <div className="mt-0.5 text-[12px] font-medium tracking-wide text-accent/90">
                  {item.action}
                </div>
              </div>
            </div>
            <button
              className="-mr-1 rounded-full p-1.5 text-muted-foreground/70 transition-colors hover:text-foreground"
              aria-label="Mais"
            >
              <MoreHorizontal className="h-[18px] w-[18px]" strokeWidth={1.4} />
            </button>
          </div>

          <div className="mt-8">
            <h3 className="tracking-title max-w-[80%] text-[26px] font-semibold leading-[1.1] text-foreground">
              {item.title.title}
            </h3>

            {item.season && item.episode && (
              <div className="mt-2 text-[11.5px] font-medium tracking-wide text-muted-foreground">
                Temporada {item.season} · Episódio {item.episode}
              </div>
            )}

            {typeof item.rating === "number" && (
              <div className="mt-3 flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      "h-[15px] w-[15px]",
                      i < item.rating!
                        ? "fill-accent text-accent"
                        : "text-muted-foreground/30",
                    )}
                    strokeWidth={1.4}
                  />
                ))}
              </div>
            )}

            {item.comment && (
              <p className="mt-4 max-w-[76%] text-[13.5px] leading-relaxed text-foreground/75">
                &ldquo;{item.comment}&rdquo;
              </p>
            )}
          </div>

          <div className="mt-8 flex items-center gap-6">
            <button
              onClick={() => setLiked((v) => !v)}
              className={cn(
                "flex items-center gap-2 text-[12.5px] transition-all duration-200 active:scale-95",
                liked ? "text-accent" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Heart
                className={cn("h-[17px] w-[17px]", liked && "fill-accent")}
                strokeWidth={1.4}
              />
              {item.likes + (liked ? 1 : 0)}
            </button>
            <button className="flex items-center gap-2 text-[12.5px] text-muted-foreground transition-colors hover:text-foreground">
              <MessageCircle className="h-[17px] w-[17px]" strokeWidth={1.4} />
              {item.comments}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}


function Novidades() {
  const groups = [
    { label: "Hoje", items: UPCOMING.today },
    { label: "Esta semana", items: UPCOMING.week },
    { label: "Este mês", items: UPCOMING.month },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-start gap-3 rounded-2xl border border-border bg-surface-2 p-4">
        <Sparkles className="mt-0.5 h-4 w-4 text-accent" strokeWidth={1.6} />
        <p className="text-[13px] leading-relaxed text-muted-foreground">
          Priorizamos primeiro os lançamentos das séries que você já acompanha.
        </p>
      </div>

      {groups.map((g) => (
        <section key={g.label}>
          <SectionTitle eyebrow="Lançamentos" title={g.label} />
          <div className="space-y-3">
            {g.items.map((it) => (
              <div
                key={it.id}
                className="relative h-[110px] overflow-hidden rounded-2xl border border-border"
              >
                <Backdrop src={it.title.backdrop} alt={it.title.title} />
                <div className="relative flex h-full flex-col justify-end p-4">
                  <div className="text-[11px] font-medium text-accent">
                    {it.label}
                  </div>
                  <div className="tracking-title text-[17px] font-semibold text-foreground">
                    {it.title.title}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
