import { useEffect, useState, useRef } from "react";
import { Link, NavLink, useLocation } from "react-router";
import { useQuery } from "@tanstack/react-query";
import {
  LayoutGrid,
  Truck,
  Users,
  Package,
  Route,
  Wrench,
  Wallet,
  CalendarDays,
  Settings,
  BarChart3,
  Menu,
  FileText,
  Fuel,
  ClipboardList,
  LogOut,
} from "lucide-react";
import { useFleet } from "./context";
import { Button } from "../components/ui";
import { roles, type Actor } from "../domain/models";
import { config } from "./config";
import { HeaderSearch } from "./header-search";
const management = [
  ["/", "Přehled", LayoutGrid],
  ["/vehicles", "Vozidla", Truck],
  ["/drivers", "Řidiči", Users],
  ["/orders", "Zakázky", Package],
  ["/trips", "Přehled jízd", Route],
  ["/faults", "Servis a závady", Wrench],
  ["/costs", "Náklady a CCS", Wallet],
  ["/deadlines", "Termíny a upozornění", CalendarDays],
  ["/settings", "Nastavení", Settings],
] as const;
const driverNav = [
  ["/my/vehicle", "Přehled", LayoutGrid],
  ["/my/orders", "Moje zakázky", Package],
  ["/my/trips", "Moje jízdy", Route],
  ["/my/fault", "Závady", Wrench],
  ["/my/fuel", "Tankování", Fuel],
  ["/my/requests", "Moje úkoly", ClipboardList],
  ["/my/documents", "Moje dokumenty", FileText],
] as const;
export function Layout({
  children,
  onActor,
  onLogout,
}: {
  children: React.ReactNode;
  onActor?: (actor: Actor) => void;
  onLogout?: () => void;
}) {
  const { s, actor, repo } = useFleet();
  const [userOpen, setUserOpen] = useState(false);
  const userRef = useRef<HTMLDivElement>(null);
  const userTrigger = useRef<HTMLButtonElement>(null);
  const userName = s.drivers.find(d => d.id === actor.driverId)?.name || actor.role;
  useEffect(() => {
    if (!userOpen) return;
    const outside = (e: PointerEvent) => { if (!userRef.current?.contains(e.target as Node)) setUserOpen(false); };
    const escape = (e: KeyboardEvent) => { if (e.key === "Escape") { setUserOpen(false); userTrigger.current?.focus(); } };
    document.addEventListener("pointerdown", outside); document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("pointerdown", outside); document.removeEventListener("keydown", escape); };
  }, [userOpen]);
  const [menu, setMenu] = useState(false);
  const location = useLocation();
  useEffect(() => {
    setMenu(false);
    window.scrollTo(0, 0);
  }, [location.pathname]);
  const identities = useQuery({
    queryKey: ["actors", repo.mode],
    queryFn: ({ signal }) => repo.identities(signal),
    enabled: repo.mode === "local",
    retry: false,
    staleTime: 60000,
  });
  const entries =
    actor.role === "Řidič"
      ? driverNav
      : actor.role === "Vedení"
        ? [
            ...management.slice(0, -1),
            ["/reports", "Reporty", BarChart3] as const,
            management[management.length - 1],
          ]
        : management;
  return (
    <>
      <a
        href="#main"
        className="skip-link"
        onClick={(event) => {
          event.preventDefault();
          document.getElementById("main")?.focus();
        }}
      >
        Přejít k obsahu
      </a>
      <aside className={"sidebar " + (menu ? "open" : "")}>
        <Link
          className="brand"
          to={actor.role === "Řidič" ? "/my/vehicle" : "/"}
        >
          <span className="brand-mark">
            <Truck size={23} />
          </span>
          FleetCare<span className="brand-period">.</span>
        </Link>
        <nav aria-label="Hlavní navigace">
          {entries.map(([path, label, Icon]) => (
            <NavLink
              key={path}
              to={path}
              end={path === "/"}
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              <Icon size={19} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
      {menu && (
        <button
          className="menu-shade"
          aria-label="Zavřít navigaci"
          onClick={() => setMenu(false)}
        />
      )}
      <div className="main-shell">
        <header className="topbar">
          <Button
            className="mobile-menu"
            aria-label="Otevřít navigaci"
            aria-expanded={menu}
            onClick={() => setMenu(!menu)}
          >
            <Menu size={21} />
          </Button>
          <HeaderSearch
            key={`${actor.role}:${actor.driverId}:${location.pathname}`}
          />
          <div className="user-menu" ref={userRef}>
            <Button ref={userTrigger} aria-haspopup="true" aria-expanded={userOpen} aria-controls="user-options" onClick={() => setUserOpen(!userOpen)}>
              <span className="avatar">{userName.split(/\s+/).slice(0,2).map(x => x[0]).join("")}</span><span>{userName}<small>{actor.role}</small></span>
            </Button>
            {userOpen && <div className="choice-menu" id="user-options" aria-label="Uživatelské menu">
        {repo.mode === "local" ? (
          <label className="role-select">
            <select
              aria-label="Role"
              value={actor.role}
              onChange={(e) =>
                onActor?.({
                  role: e.target.value as Actor["role"],
                  driverId: null,
                })
              }
            >
              {roles.map((role) => (
                <option key={role}>{role}</option>
              ))}
            </select>
          </label>
        ) : (
          <div className="role-display" aria-label="Přihlášená role">
            {actor.role}
          </div>
        )}
              {onLogout && <Button onClick={onLogout}><LogOut size={17} />Odhlásit se</Button>}
            </div>}
          </div>
        </header>
        {actor.role === "Řidič" && repo.mode === "local" && (
          <div className="actor-bar">
            <label>
              Řidič
              <select
                aria-label="Vybraný řidič"
                value={actor.driverId || ""}
                onChange={(e) =>
                  onActor?.({ ...actor, driverId: e.target.value || null })
                }
              >
                <option value="">Zvolte existujícího řidiče…</option>
                {identities.data?.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </label>
            {identities.error && (
              <span role="alert">{identities.error.message}</span>
            )}
          </div>
        )}
        {config.label && <div className="mode-banner demo">{config.label}</div>}
        <main className="content" id="main" tabIndex={-1}>
          {children}
        </main>
      </div>
    </>
  );
}
