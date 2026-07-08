import { createFileRoute, Link } from "@tanstack/react-router";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Clock, Search as SearchIcon, TrendingUp, X } from "lucide-react";
import { AppShell, SectionTitle } from "@/components/scena/AppShell";
import { MediaCard, titleToMedia } from "@/components/scena/MediaCard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  SEARCH_FILTERS,
  searchService,
  type SearchFilterKey,
  type SearchListResult,
  type SearchMediaResult,
  type SearchUserResult,
} from "@/services/search.service";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/buscar")({
  head: () => ({
    meta: [
      { title: "Buscar - Scena" },
      { name: "description", content: "Descubra filmes, series, usuarios e listas no Scena." },
    ],
  }),
  component: BuscarPage,
});

const RECENT_SEARCHES_KEY = "scena.search.recent.v1";
const RESULT_LIMIT = 3;

const searchHistoryStore = {
  load() {
    if (typeof window === "undefined") return [] as string[];
    try {
      const value = window.localStorage.getItem(RECENT_SEARCHES_KEY);
      return value ? (JSON.parse(value) as string[]) : [];
    } catch {
      return [];
    }
  },
  save(searches: string[]) {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(searches));
  },
};

function BuscarPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<SearchFilterKey>("all");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [expanded, setExpanded] = useState<Record<SearchFilterKey, boolean>>({
    all: false,
    series: false,
    movie: false,
    users: false,
    lists: false,
  });

  useEffect(() => {
    inputRef.current?.focus();
    setRecentSearches(searchHistoryStore.load());
  }, []);

  const trimmedQuery = query.trim();
  const hasQuery = trimmedQuery.length > 0;

  const groupedResults = useMemo(() => {
    return searchService.search(trimmedQuery);
  }, [trimmedQuery]);

  const visibleSections = getVisibleSections(filter, groupedResults);
  const totalResults = visibleSections.reduce((sum, section) => sum + section.items.length, 0);

  const saveSearch = (value: string) => {
    const clean = value.trim();
    if (!clean) return;
    const next = [
      clean,
      ...recentSearches.filter((item) => normalize(item) !== normalize(clean)),
    ].slice(0, 6);
    setRecentSearches(next);
    searchHistoryStore.save(next);
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    saveSearch(query);
  };

  const removeRecentSearch = (value: string) => {
    const next = recentSearches.filter((item) => item !== value);
    setRecentSearches(next);
    searchHistoryStore.save(next);
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    searchHistoryStore.save([]);
  };

  const chooseSearch = (value: string) => {
    setQuery(value);
    saveSearch(value);
    inputRef.current?.focus();
  };

  return (
    <AppShell>
      <form onSubmit={handleSubmit} className="mb-5">
        <div className="flex items-center gap-3 rounded-[24px] border border-border bg-surface-2 px-4 py-3.5 shadow-[var(--shadow-card)] focus-within:border-accent/35">
          <SearchIcon className="h-[19px] w-[19px] text-muted-foreground" strokeWidth={1.6} />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onBlur={() => saveSearch(query)}
            placeholder="Buscar series, filmes, usuarios e listas"
            className="w-full bg-transparent text-[15px] font-medium text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          {hasQuery && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
              aria-label="Limpar busca"
            >
              <X className="h-4 w-4" strokeWidth={1.7} />
            </button>
          )}
        </div>
      </form>

      <div className="-mx-5 mb-8 flex gap-2 overflow-x-auto px-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {SEARCH_FILTERS.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setFilter(item.key)}
            className={cn(
              "shrink-0 rounded-full border px-4 py-1.5 text-[12.5px] font-semibold transition-all",
              filter === item.key
                ? "border-accent/40 bg-accent/10 text-accent"
                : "border-border bg-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {!hasQuery ? (
        <DiscoveryHome
          recentSearches={recentSearches}
          onChooseSearch={chooseSearch}
          onRemoveSearch={removeRecentSearch}
          onClearSearches={clearRecentSearches}
        />
      ) : totalResults > 0 ? (
        <div className="space-y-9">
          {visibleSections.map((section) => (
            <ResultSection
              key={section.key}
              sectionKey={section.key}
              title={section.title}
              items={section.items}
              expanded={expanded[section.key]}
              onToggle={() =>
                setExpanded((state) => ({ ...state, [section.key]: !state[section.key] }))
              }
            />
          ))}
        </div>
      ) : (
        <EmptyState onChooseSearch={chooseSearch} />
      )}
    </AppShell>
  );
}

function DiscoveryHome({
  recentSearches,
  onChooseSearch,
  onRemoveSearch,
  onClearSearches,
}: {
  recentSearches: string[];
  onChooseSearch: (value: string) => void;
  onRemoveSearch: (value: string) => void;
  onClearSearches: () => void;
}) {
  const trending = searchService.getTrending();

  return (
    <div className="space-y-10">
      <section>
        <SectionHeader
          title="Buscas recentes"
          action={recentSearches.length > 0 ? "Limpar" : undefined}
          onAction={onClearSearches}
        />
        {recentSearches.length > 0 ? (
          <div className="space-y-2.5">
            {recentSearches.map((item) => (
              <div
                key={item}
                className="flex items-center gap-3 rounded-2xl border border-border bg-card px-3 py-2.5"
              >
                <button
                  type="button"
                  onClick={() => onChooseSearch(item)}
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                >
                  <Clock className="h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.5} />
                  <span className="truncate text-[13.5px] font-medium text-foreground">{item}</span>
                </button>
                <button
                  type="button"
                  onClick={() => onRemoveSearch(item)}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
                  aria-label={`Remover ${item}`}
                >
                  <X className="h-3.5 w-3.5" strokeWidth={1.7} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-card px-4 py-5 text-[13px] leading-relaxed text-muted-foreground">
            Suas buscas recentes vao aparecer aqui.
          </div>
        )}
      </section>

      <TrendingMedia title="Trending TV Shows" items={trending.series} />
      <TrendingMedia title="Trending Movies" items={trending.movies} />
      <section>
        <SectionTitle eyebrow="Em alta" title="Trending Lists" />
        <div className="space-y-3">
          {trending.lists.slice(0, 3).map((list) => (
            <ListCard key={list.id} list={list} />
          ))}
        </div>
      </section>
      <section>
        <SectionTitle eyebrow="Comunidade" title="Trending Users" />
        <div className="space-y-3">
          {trending.users.slice(0, 3).map((user) => (
            <UserCard key={user.id} user={user} />
          ))}
        </div>
      </section>
    </div>
  );
}

function ResultSection({
  sectionKey,
  title,
  items,
  expanded,
  onToggle,
}: {
  sectionKey: Exclude<SearchFilterKey, "all">;
  title: string;
  items: Array<SearchMediaResult | SearchUserResult | SearchListResult>;
  expanded: boolean;
  onToggle: () => void;
}) {
  if (items.length === 0) return null;
  const visibleItems = expanded ? items : items.slice(0, RESULT_LIMIT);
  const canExpand = items.length > RESULT_LIMIT;

  return (
    <section>
      <SectionHeader
        title={title}
        count={items.length}
        action={canExpand ? (expanded ? "Menos" : "Ver todos") : undefined}
        onAction={onToggle}
      />
      <div className="space-y-3">
        {visibleItems.map((item) => {
          if (sectionKey === "series" || sectionKey === "movie") {
            return <MediaResult key={(item as SearchMediaResult).id} title={item as SearchMediaResult} />;
          }
          if (sectionKey === "users")
            return <UserCard key={(item as SearchUserResult).id} user={item as SearchUserResult} />;
          return <ListCard key={(item as SearchListResult).id} list={item as SearchListResult} />;
        })}
      </div>
    </section>
  );
}

function MediaResult({ title }: { title: SearchMediaResult }) {
  return (
    <MediaCard
      media={titleToMedia(title)}
      orientation="horizontal"
      size="lg"
      status={title.status}
      readonly={title.kind === "movie"}
      callbacks={title.kind === "movie" ? { onOpen: () => undefined } : undefined}
    />
  );
}

function TrendingMedia({ title, items }: { title: string; items: SearchMediaResult[] }) {
  return (
    <section>
      <SectionTitle eyebrow="Em alta" title={title} />
      <div className="-mx-5 flex gap-3 overflow-x-auto px-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map((item) => (
          <MediaCard
            key={item.id}
            media={titleToMedia(item)}
            size="sm"
            orientation="vertical"
            readonly
            className="w-[116px] shrink-0"
          />
        ))}
      </div>
    </section>
  );
}

function UserCard({ user }: { user: SearchUserResult }) {
  return (
    <Link
      to="/perfil"
      className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 transition-transform duration-300 active:scale-[0.98]"
    >
      <Avatar className="h-12 w-12 border border-border">
        <AvatarImage src={user.avatar} alt={user.displayName} />
        <AvatarFallback>{user.displayName.slice(0, 1)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[14px] font-semibold text-foreground">{user.username}</div>
        <div className="truncate text-[12.5px] text-muted-foreground">{user.displayName}</div>
        <div className="mt-1 text-[11.5px] text-muted-foreground">
          {formatCompact(user.followers)} seguidores
        </div>
      </div>
      <Button
        type="button"
        size="sm"
        variant={user.following ? "secondary" : "default"}
        onClick={(event) => event.preventDefault()}
        className="rounded-full px-3"
      >
        {user.following ? "Seguindo" : "Seguir"}
      </Button>
    </Link>
  );
}

function ListCard({ list }: { list: SearchListResult }) {
  return (
    <button
      type="button"
      data-list-id={list.id}
      className="group flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-3 text-left transition-transform duration-300 active:scale-[0.98]"
    >
      <div className="relative h-[74px] w-[58px] shrink-0 overflow-hidden rounded-xl border border-border bg-surface-2">
        <img
          src={list.cover}
          alt=""
          referrerPolicy="no-referrer"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[14px] font-semibold text-foreground group-hover:text-accent">
          {list.title}
        </div>
        <div className="mt-1 truncate text-[12.5px] text-muted-foreground">
          por {list.creator.displayName}
        </div>
        <div className="mt-2 flex items-center gap-2 text-[11.5px] text-muted-foreground">
          <span>{list.titleCount} titulos</span>
          <span className="h-1 w-1 rounded-full bg-muted-foreground/40" />
          <span>{formatCompact(list.likes)} curtidas</span>
        </div>
      </div>
    </button>
  );
}

function EmptyState({ onChooseSearch }: { onChooseSearch: (value: string) => void }) {
  const popularSearches = searchService.getPopularSearches();

  return (
    <div className="rounded-[24px] border border-border bg-card px-5 py-8 text-center shadow-[var(--shadow-card)]">
      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full border border-border text-accent">
        <TrendingUp className="h-5 w-5" strokeWidth={1.5} />
      </div>
      <h2 className="tracking-title mt-4 text-[19px] font-semibold text-foreground">
        Nada por aqui ainda
      </h2>
      <p className="mx-auto mt-2 max-w-[300px] text-[13px] leading-relaxed text-muted-foreground">
        Tente buscar por um titulo popular, uma pessoa da comunidade ou uma lista publica.
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        {popularSearches.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => onChooseSearch(item)}
            className="rounded-full border border-border px-3 py-1.5 text-[12px] font-semibold text-muted-foreground transition-colors hover:text-foreground"
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}

function SectionHeader({
  title,
  count,
  action,
  onAction,
}: {
  title: string;
  count?: number;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <div className="min-w-0">
        <h2 className="tracking-title truncate text-[18px] font-semibold text-foreground">
          {title}
        </h2>
        {count !== undefined && (
          <div className="mt-0.5 text-[11.5px] text-muted-foreground">
            {count} resultado{count === 1 ? "" : "s"}
          </div>
        )}
      </div>
      {action && (
        <button
          type="button"
          onClick={onAction}
          className="shrink-0 text-[12px] font-semibold text-accent transition-colors hover:text-accent/80"
        >
          {action}
        </button>
      )}
    </div>
  );
}

function getVisibleSections(
  filter: SearchFilterKey,
  groups: {
    series: SearchMediaResult[];
    movie: SearchMediaResult[];
    users: SearchUserResult[];
    lists: SearchListResult[];
  },
) {
  const sections = [
    { key: "series", title: "TV Shows", items: groups.series },
    { key: "movie", title: "Movies", items: groups.movie },
    { key: "users", title: "Users", items: groups.users },
    { key: "lists", title: "Lists", items: groups.lists },
  ] as const;
  return filter === "all" ? [...sections] : sections.filter((section) => section.key === filter);
}

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function formatCompact(value: number) {
  return new Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 1 }).format(
    value,
  );
}
