import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search as SearchIcon } from "lucide-react";
import { AppShell } from "@/components/scena/AppShell";
import { Backdrop } from "@/components/scena/Backdrop";
import { ALL_TITLES } from "@/lib/scena-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/buscar")({
  head: () => ({
    meta: [
      { title: "Buscar · Scena" },
      { name: "description", content: "Pesquise filmes, séries, usuários e listas." },
    ],
  }),
  component: BuscarPage,
});

const FILTERS = [
  { key: "all", label: "Tudo" },
  { key: "series", label: "Séries" },
  { key: "movie", label: "Filmes" },
  { key: "users", label: "Usuários" },
  { key: "lists", label: "Listas" },
] as const;

function BuscarPage() {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("all");

  const results = useMemo(() => {
    return ALL_TITLES.filter((t) => {
      const kindOk =
        filter === "all" ||
        (filter === "series" && t.kind === "series") ||
        (filter === "movie" && t.kind === "movie");
      const matches =
        !q.trim() || t.title.toLowerCase().includes(q.trim().toLowerCase());
      return kindOk && matches;
    });
  }, [q, filter]);

  return (
    <AppShell>
      <div className="mb-5">
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface-2 px-4 py-3">
          <SearchIcon
            className="h-[18px] w-[18px] text-muted-foreground"
            strokeWidth={1.6}
          />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar filmes, séries, pessoas…"
            className="w-full bg-transparent text-[14px] text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
        </div>
      </div>

      <div className="-mx-5 mb-6 flex gap-2 overflow-x-auto px-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              "shrink-0 rounded-full border px-4 py-1.5 text-[12.5px] font-medium transition-all",
              filter === f.key
                ? "border-accent/40 bg-accent/10 text-accent"
                : "border-border bg-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {results.length === 0 && (
          <div className="rounded-2xl border border-border bg-surface-2 p-6 text-center text-[13px] text-muted-foreground">
            Nenhum resultado.
          </div>
        )}
        {results.map((t) => (
          <div
            key={t.id}
            className="relative h-[96px] overflow-hidden rounded-2xl border border-border"
          >
            <Backdrop src={t.backdrop} alt={t.title} />
            <div className="relative flex h-full flex-col justify-center p-4">
              <div className="text-[11px] font-medium text-accent">
                {t.kind === "series" ? "Série" : "Filme"} · {t.year}
              </div>
              <div className="tracking-title text-[16px] font-semibold text-foreground">
                {t.title}
              </div>
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
