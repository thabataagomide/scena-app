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
    <div className="space-y-4">
      {FEED.map((item) => (
        <FeedCard key={item.id} item={item} />
      ))}
    </div>
  );
}

function FeedCard({ item }: { item: FeedItem }) {
  const [liked, setLiked] = useState(false);

  return (
    <article className="relative overflow-hidden rounded-3xl border border-border bg-card shadow-[0_20px_40px_-24px_rgba(0,0,0,0.7)]">
      <div className="relative min-h-[188px]">
        <Backdrop src={item.title.backdrop} alt={item.title.title} />

        <div className="relative p-5">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <img
                src={item.user.avatar}
                alt={item.user.name}
                className="h-10 w-10 rounded-full border border-border object-cover"
              />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[15px] font-semibold text-foreground">
                    {item.user.name}
                  </span>
                  <span className="text-[12px] text-muted-foreground">
                    {item.time}
                  </span>
                </div>
                <div className="mt-0.5 text-[13px] font-medium text-accent">
                  {item.action}
                </div>
              </div>
            </div>
            <button
              className="rounded-full p-1.5 text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Mais"
            >
              <MoreHorizontal className="h-5 w-5" strokeWidth={1.6} />
            </button>
          </div>

          <h3 className="tracking-title mt-5 text-[22px] font-semibold text-foreground">
            {item.title.title}
          </h3>

          {item.season && item.episode && (
            <div className="mt-1 text-[12.5px] text-muted-foreground">
              T{item.season} · E{item.episode}
            </div>
          )}

          {typeof item.rating === "number" && (
            <div className="mt-2 flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    "h-4 w-4",
                    i < item.rating! ? "fill-accent text-accent" : "text-muted-foreground/40",
                  )}
                  strokeWidth={1.5}
                />
              ))}
            </div>
          )}

          {item.comment && (
            <p className="mt-3 max-w-[70%] text-[13.5px] leading-relaxed text-foreground/80">
              &ldquo;{item.comment}&rdquo;
            </p>
          )}

          <div className="mt-5 flex items-center gap-5">
            <button
              onClick={() => setLiked((v) => !v)}
              className={cn(
                "flex items-center gap-1.5 text-[13px] transition-colors",
                liked ? "text-accent" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Heart
                className={cn("h-[18px] w-[18px]", liked && "fill-accent")}
                strokeWidth={1.6}
              />
              {item.likes + (liked ? 1 : 0)}
            </button>
            <button className="flex items-center gap-1.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground">
              <MessageCircle className="h-[18px] w-[18px]" strokeWidth={1.6} />
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
