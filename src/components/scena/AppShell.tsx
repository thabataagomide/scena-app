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

// Consistent stroke weight across every nav icon.
const NAV_STROKE = 1.4;

export function AppShell({
  children,
  header,
}: {
  children: ReactNode;
  header?: ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <div className="container-mobile pb-36 pt-8">
        <div className="mb-8 flex items-center justify-center">
          <ScenaLogo size={30} />
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
      style={{ paddingBottom: "max(env(safe-area-inset-bottom), 14px)" }}
      aria-label="Navegação principal"
    >
      <div className="container-mobile">
        <div
          className="mx-auto mt-3 flex items-stretch justify-between rounded-[26px] border border-border px-1.5 py-1.5 backdrop-blur-2xl"
          style={{
            background:
              "linear-gradient(180deg, rgba(22,22,22,0.82) 0%, rgba(14,14,14,0.88) 100%)",
          }}
        >
          {TABS.map(({ to, label, icon: Icon }) => {
            const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group relative flex flex-1 flex-col items-center justify-center gap-1 rounded-[20px] px-2 py-2.5 transition-all duration-300",
                  active ? "text-accent" : "text-muted-foreground",
                )}
              >
                <Icon
                  className={cn(
                    "h-[21px] w-[21px] transition-transform duration-300",
                    active
                      ? "scale-[1.04]"
                      : "group-hover:text-foreground group-active:scale-95",
                  )}
                  strokeWidth={NAV_STROKE}
                />
                <span
                  className={cn(
                    "text-[10px] font-medium tracking-[0.02em] transition-opacity",
                    active ? "opacity-100" : "opacity-80 group-hover:opacity-100",
                  )}
                >
                  {label}
                </span>
                <span
                  className={cn(
                    "absolute -bottom-0.5 left-1/2 h-[3px] w-[3px] -translate-x-1/2 rounded-full transition-all duration-300",
                    active ? "bg-accent opacity-100" : "opacity-0",
                  )}
                />
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
    <div className="mb-5 flex items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow && (
          <div className="tracking-eyebrow mb-2 text-[10px] font-medium text-muted-foreground">
            {eyebrow}
          </div>
        )}
        <h2 className="tracking-title text-[22px] font-semibold leading-tight text-foreground">
          {title}
        </h2>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
