import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, Clock, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { OWNER_EMAIL } from "@/hooks/use-admin";

interface MemberRow {
  id: number;
  username: string;
  email: string;
  sessionCount: number;
  totalMinutes: number;
  lastSignInAt: string | null;
}

function formatMinutes(min: number) {
  if (!min) return "0 min";
  const h = Math.floor(min / 60), m = min % 60;
  if (h && m) return `${h} h ${m} min`;
  if (h) return `${h} h`;
  return `${m} min`;
}

function formatDate(s: string | null) {
  if (!s) return "—";
  try {
    return new Date(s).toLocaleString("es-ES", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  } catch { return "—"; }
}

type SortKey = "username" | "sessionCount" | "totalMinutes" | "lastSignInAt";
type SortDir = "asc" | "desc";
const PAGE_SIZE = 10;

export function UsersTimeTable() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["ccc-timer-ranking"],
    queryFn: async () => {
      const res = await fetch("/api/extensiones/ccc-timer/ranking");
      if (!res.ok) throw new Error("error");
      return res.json() as Promise<{ members: MemberRow[] }>;
    },
  });

  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("totalMinutes");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir(key === "username" ? "asc" : "desc"); }
    setPage(1);
  };

  const rows = useMemo(() => {
    const list = data?.members ?? [];
    const q = query.trim().toLowerCase();
    const filtered = q ? list.filter(m => m.username.toLowerCase().includes(q)) : list;
    return [...filtered].sort((a, b) => {
      let av: string | number = "";
      let bv: string | number = "";
      if (sortKey === "username")     { av = a.username.toLowerCase(); bv = b.username.toLowerCase(); }
      if (sortKey === "sessionCount") { av = a.sessionCount; bv = b.sessionCount; }
      if (sortKey === "totalMinutes") { av = a.totalMinutes; bv = b.totalMinutes; }
      if (sortKey === "lastSignInAt") { av = a.lastSignInAt ? new Date(a.lastSignInAt).getTime() : 0; bv = b.lastSignInAt ? new Date(b.lastSignInAt).getTime() : 0; }
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [data, query, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = rows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const SortIcon = ({ k }: { k: SortKey }) => {
    if (sortKey !== k) return <ArrowUpDown className="h-3.5 w-3.5 opacity-50" />;
    return sortDir === "asc" ? <ArrowUp className="h-3.5 w-3.5 text-primary" /> : <ArrowDown className="h-3.5 w-3.5 text-primary" />;
  };

  const Th = ({ k, label }: { k: SortKey; label: string }) => (
    <th className="text-left px-3 py-2">
      <button onClick={() => toggleSort(k)} className="flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground uppercase tracking-wider">
        {label}<SortIcon k={k} />
      </button>
    </th>
  );

  if (isLoading) return <div className="flex justify-center py-8"><div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (error) return <p className="text-destructive text-sm text-center py-4">Error al cargar ranking.</p>;

  return (
    <div className="card-soft rounded-2xl animate-fade-up overflow-hidden">
      <div className="p-4 border-b border-border/50 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" /><span className="font-semibold text-foreground">Ranking del equipo</span>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input value={query} onChange={e => { setQuery(e.target.value); setPage(1); }}
            placeholder="Buscar…" className="pl-8 h-8 text-xs w-40 bg-background/50 border-border/50" />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="border-b border-border/30">
            <tr>
              <th className="text-left px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-8">#</th>
              <Th k="username" label="Usuario" />
              <Th k="sessionCount" label="Sesiones" />
              <Th k="totalMinutes" label="Tiempo total" />
              <Th k="lastSignInAt" label="Última sesión" />
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr><td colSpan={5} className="text-center text-muted-foreground text-sm py-8">No hay datos de sesiones aún.</td></tr>
            ) : paginated.map((m, i) => {
              const rank = (safePage - 1) * PAGE_SIZE + i + 1;
              const isOwner = m.email === OWNER_EMAIL;
              return (
                <tr key={m.id} className="border-b border-border/20 hover:bg-muted/20 transition-colors">
                  <td className="px-3 py-2.5 text-sm text-muted-foreground font-mono">{rank <= 3 ? ["🥇","🥈","🥉"][rank-1] : rank}</td>
                  <td className="px-3 py-2.5">
                    <span className={`text-sm font-medium ${isOwner ? "owner-name" : ""}`}>{m.username}</span>
                    {isOwner && <span className="ml-1.5 text-[10px] text-amber-400 font-bold">OWNER</span>}
                  </td>
                  <td className="px-3 py-2.5 text-sm font-mono text-secondary">{m.sessionCount}</td>
                  <td className="px-3 py-2.5 text-sm font-mono text-primary">{formatMinutes(m.totalMinutes)}</td>
                  <td className="px-3 py-2.5 text-xs text-muted-foreground">{formatDate(m.lastSignInAt)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-border/30 text-xs text-muted-foreground">
          <span>{rows.length} miembro{rows.length !== 1 ? "s" : ""}</span>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" disabled={safePage === 1} onClick={() => setPage(p => p - 1)}>
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <span>{safePage} / {totalPages}</span>
            <Button variant="ghost" size="icon" className="h-7 w-7" disabled={safePage === totalPages} onClick={() => setPage(p => p + 1)}>
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
