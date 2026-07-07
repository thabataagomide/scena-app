import { createFileRoute } from "@tanstack/react-router";
import { ChevronRight, Bookmark, Heart, Check, Flag, Pause, X, ListMusic, Plus } from "lucide-react";
import { AppShell, SectionTitle } from "@/components/scena/AppShell";
import { LIBRARY_SECTIONS } from "@/lib/scena-data";
import type { LucideIcon } from "lucide-react";

export const Route = createFileRoute("/biblioteca")({
  head: () => ({
    meta: [
      { title: "Biblioteca · Scena" },
      { name: "description", content: "Sua coleção pessoal de filmes e séries." },
    ],
  }),
  component: BibliotecaPage,
});

const ICON_MAP: Record<string, LucideIcon> = {
  want: Bookmark,
  favorites: Heart,
  watched: Check,
  finished: Flag,
  paused: Pause,
  abandoned: X,
  myLists: ListMusic,
  savedLists: ListMusic,
};

function BibliotecaPage() {
  return (
    <AppShell>
      <SectionTitle eyebrow="Privada" title="Sua biblioteca" />

      <div className="grid grid-cols-2 gap-3">
        {LIBRARY_SECTIONS.map((s) => {
          const Icon = ICON_MAP[s.key] ?? Bookmark;
          return (
            <button
              key={s.key}
              className="group flex flex-col items-start gap-3 rounded-2xl border border-border bg-card p-4 text-left transition-all hover:border-accent/30 active:scale-[0.98]"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-accent">
                <Icon className="h-4 w-4" strokeWidth={1.6} />
              </div>
              <div>
                <div className="text-[14px] font-semibold text-foreground">
                  {s.label}
                </div>
                <div className="mt-0.5 text-[11.5px] text-muted-foreground">
                  {s.count} itens
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-10">
        <SectionTitle
          eyebrow="Coleções"
          title="Minhas listas"
          action={
            <button className="flex items-center gap-1 text-[12px] font-medium text-accent">
              <Plus className="h-4 w-4" strokeWidth={1.8} /> Nova
            </button>
          }
        />
        <div className="space-y-3">
          {[
            { name: "Sci-fi para maratonar", count: 18, privacy: "Pública" },
            { name: "Comfort watches", count: 24, privacy: "Privada" },
            { name: "A24 essenciais", count: 11, privacy: "Pública" },
          ].map((l) => (
            <div
              key={l.name}
              className="flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-4"
            >
              <div>
                <div className="text-[14.5px] font-semibold text-foreground">
                  {l.name}
                </div>
                <div className="mt-0.5 text-[12px] text-muted-foreground">
                  {l.count} títulos · {l.privacy}
                </div>
              </div>
              <ChevronRight
                className="h-4 w-4 text-muted-foreground"
                strokeWidth={1.6}
              />
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
