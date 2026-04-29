import { useCallback, useEffect, useState } from "react";
import { Check, Clock, Minus, RefreshCw, RotateCcw } from "lucide-react";
import { adminService, missionsService } from "@/services";
import type { PlayerMissionStatusResponse } from "@/services/types";
import { toast } from "@/hooks/use-toast";
import ResetProgressDialog from "./ResetProgressDialog";

const STATUS_APPROVED = "APPROVED";

const AdminDashboard = () => {
  const [data, setData] = useState<PlayerMissionStatusResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [resetOpen, setResetOpen] = useState(false);

  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    try {
      const res = await adminService.listAllMissions(signal);
      setData(res);
    } catch {
      toast({
        title: "Erro",
        description: "Não foi possível carregar o painel.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const ctrl = new AbortController();
    load(ctrl.signal);
    return () => ctrl.abort();
  }, [load]);

  const handleReset = useCallback(async () => {
    try {
      const result = await missionsService.adminReset();
      toast({
        title: "Progresso reposto",
        description: `Apagadas ${result.deletedCompletions} missões e ${result.deletedPhotos} fotos.`,
      });
      await load();
    } catch {
      toast({
        title: "Erro",
        description: "Não foi possível repor o progresso.",
        variant: "destructive",
      });
    }
  }, [load]);

  // Build mission column list from the first player (all players share missions).
  const missionCols = data[0]?.missions ?? [];

  return (
    <div className="paper-texture min-h-screen px-4 pb-12 pt-20">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-heading text-3xl text-foreground">Painel de administração</h1>
            <p className="mt-1 font-body text-sm italic text-muted-foreground">
              Vista geral do progresso de cada exploradora.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => load()}
              className="flex items-center gap-2 rounded-full bg-secondary px-4 py-2 font-body text-sm font-semibold text-secondary-foreground shadow-sm transition active:scale-95"
            >
              <RefreshCw size={14} />
              Atualizar
            </button>
            <button
              onClick={() => setResetOpen(true)}
              className="flex items-center gap-2 rounded-full bg-destructive px-4 py-2 font-body text-sm font-semibold text-destructive-foreground shadow-sm transition active:scale-95"
            >
              <RotateCcw size={14} />
              Reset
            </button>
          </div>
        </header>

        {loading && data.length === 0 ? (
          <div className="rounded-xl border border-border bg-card/60 p-10 text-center font-body text-muted-foreground">
            A carregar...
          </div>
        ) : data.length === 0 ? (
          <div className="rounded-xl border border-border bg-card/60 p-10 text-center font-body text-muted-foreground">
            Ainda não há jogadoras registadas.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border bg-card/80 shadow-sm">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-muted/50">
                  <th className="sticky left-0 z-10 bg-muted/80 px-4 py-3 font-heading text-sm uppercase tracking-wide text-foreground">
                    Jogadora
                  </th>
                  {missionCols.map((m) => (
                    <th
                      key={m.missionId}
                      className="px-3 py-3 text-center font-body text-xs font-semibold text-muted-foreground"
                      title={m.title}
                    >
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-foreground">#{m.missionId}</span>
                        <span className="max-w-[7rem] truncate text-[10px] uppercase tracking-wide">
                          {m.title}
                        </span>
                      </div>
                    </th>
                  ))}
                  <th className="px-3 py-3 text-center font-body text-xs font-semibold text-muted-foreground">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.map((player) => {
                  const completed = player.missions.filter((m) => m.completed).length;
                  return (
                    <tr key={player.playerId} className="border-t border-border">
                      <td className="sticky left-0 z-10 bg-card px-4 py-3 font-body text-sm font-semibold text-foreground">
                        {player.username}
                      </td>
                      {player.missions.map((m) => (
                        <td key={m.missionId} className="px-3 py-3 text-center">
                          <StatusCell status={m} />
                        </td>
                      ))}
                      <td className="px-3 py-3 text-center font-body text-sm font-semibold text-foreground">
                        {completed}/{player.missions.length}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ResetProgressDialog open={resetOpen} onOpenChange={setResetOpen} onConfirm={handleReset} />
    </div>
  );
};

interface StatusCellProps {
  status: {
    completed: boolean;
    completedAt: string;
    validationStatus: string;
  };
}

const StatusCell = ({ status }: StatusCellProps) => {
  if (status.completed) {
    const when = status.completedAt
      ? new Date(status.completedAt).toLocaleString("pt-PT")
      : "";
    return (
      <span
        title={`Completa${when ? ` · ${when}` : ""}`}
        className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 text-primary"
      >
        <Check size={14} />
      </span>
    );
  }
  if (status.validationStatus && status.validationStatus !== "NONE") {
    return (
      <span
        title={`Pendente · ${status.validationStatus}`}
        className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-accent/15 text-accent"
      >
        <Clock size={14} />
      </span>
    );
  }
  return (
    <span
      title="Por iniciar"
      className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-muted text-muted-foreground"
    >
      <Minus size={14} />
    </span>
  );
};

export default AdminDashboard;
