import type { ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Home, PlayCircle, Search, Library, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScenaLogo } from "./Logo";

const TABS = [
  { to: "/", label: "Início", icon: Home },
  { to: "/assistir", label: "Assistir", icon: PlayCircle },
  { to: "/buscar", label: "Buscar", icon: Search },
  { to: "/biblioteca", label: "Biblioteca", icon: Library },
  { to: "/perfil", label: "Perfil", icon: User },
] as const;

export function AppShell({
  children,
  header,
}: {
  children: ReactNode;
  header?: ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <div className="container-mobile pb-32 pt-6">
        <div className="mb-6 flex items-center justify-center">
          <ScenaLogo />
        </div>
        {header}
        <div className="animate-fade-in">{children}</div>
      </div>
      <BottomNav />
    </div>
  );
}

function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40"
      style={{ paddingBottom: "max(env(safe-area-inset-bottom), 12px)" }}
    >
      <div className="container-mobile">
        <div className="mx-auto mt-3 flex items-center justify-between rounded-3xl border border-border bg-[rgba(20,20,20,0.85)] px-2 py-2 backdrop-blur-xl">
          {TABS.map(({ to, label, icon: Icon }) => {
            const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  "group flex flex-1 flex-col items-center gap-1 rounded-2xl px-2 py-2 transition-all duration-200",
                  active
                    ? "text-accent"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon
                  className={cn(
                    "h-[22px] w-[22px] transition-transform duration-200",
                    active ? "scale-105" : "group-active:scale-95",
                  )}
                  strokeWidth={1.6}
                />
                <span className="text-[10.5px] font-medium tracking-wide">
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

export function SectionTitle({
  eyebrow,
  title,
  action,
}: {
  eyebrow?: string;
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-end justify-between">
      <div>
        {eyebrow && (
          <div className="tracking-eyebrow mb-1 text-[10px] font-medium text-muted-foreground">
            {eyebrow}
          </div>
        )}
        <h2 className="tracking-title text-[20px] font-semibold text-foreground">
          {title}
        </h2>
      </div>
      {action}
    </div>
  );
}
