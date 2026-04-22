import { useState } from "react";
import { Download, Lock, Eye } from "lucide-react";
import { missions } from "@/data/missions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface QuestCompleteProps {
  photos: Record<number, string>;
}

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const extFromDataUrl = (url: string) => {
  const m = /^data:image\/([a-zA-Z0-9.+-]+);/.exec(url);
  const sub = m?.[1]?.toLowerCase() ?? "jpeg";
  if (sub === "jpeg") return "jpg";
  return sub;
};

const downloadPhoto = (photo: string, missionId: number, title: string) => {
  const a = document.createElement("a");
  a.href = photo;
  a.download = `kpn-missao-${missionId}-${slugify(title)}.${extFromDataUrl(photo)}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

const QuestComplete = ({ photos }: QuestCompleteProps) => {
  const [revealed, setRevealed] = useState<Record<number, boolean>>({});
  const [confirmRevealId, setConfirmRevealId] = useState<number | null>(null);

  return (
    <div className="min-h-screen px-6 py-16 fade-in">
      <div className="text-center mb-12">
        <h1 className="font-heading text-4xl font-bold text-accent mb-4">
          Aventura Completa! 🌴
        </h1>
        <p className="font-body text-base leading-relaxed text-foreground max-w-xs mx-auto">
          Exploraste Ko Pha Ngan, completaste as 8 missões e sobreviveste aos
          desafios picantes!
        </p>
        <p className="font-body text-sm text-muted-foreground mt-3">
          Toca em cada foto para a guardar no teu dispositivo.
        </p>
      </div>

      {/* Gallery */}
      <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
        {missions.map((mission) => {
          const photo = photos[mission.id];
          if (!photo) return null;
          const isSpicy = mission.isSpicy;
          const isHidden = isSpicy && !revealed[mission.id];
          return (
            <div key={mission.id} className="relative overflow-hidden rounded-lg group">
              <div className="aspect-square">
                <img
                  src={photo}
                  alt={`Missão ${mission.id}`}
                  className={`h-full w-full object-cover transition-all ${
                    isHidden ? "blur-2xl scale-110" : ""
                  }`}
                />
              </div>

              {isHidden && (
                <button
                  type="button"
                  onClick={() => setConfirmRevealId(mission.id)}
                  aria-label={`Revelar foto picante da missão ${mission.id}`}
                  className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-foreground/30 text-primary-foreground"
                >
                  <Lock size={28} />
                  <span className="font-body text-xs font-semibold uppercase tracking-wider">
                    Picante
                  </span>
                </button>
              )}

              <button
                type="button"
                onClick={() => downloadPhoto(photo, mission.id, mission.title)}
                aria-label={`Descarregar foto da missão ${mission.id}`}
                className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-background/80 text-foreground shadow backdrop-blur-sm transition-all active:scale-90 hover:bg-background"
              >
                <Download size={16} />
              </button>

              {isSpicy && revealed[mission.id] && (
                <button
                  type="button"
                  onClick={() => setRevealed((r) => ({ ...r, [mission.id]: false }))}
                  aria-label={`Esconder foto da missão ${mission.id}`}
                  className="absolute left-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-background/80 text-foreground shadow backdrop-blur-sm transition-all active:scale-90 hover:bg-background"
                >
                  <Eye size={16} />
                </button>
              )}

              <div className="absolute bottom-0 left-0 right-0 bg-foreground/60 px-2 py-1">
                <p className="font-body text-xs text-primary-foreground truncate">
                  {mission.id}. {mission.title}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <AlertDialog
        open={confirmRevealId !== null}
        onOpenChange={(open) => !open && setConfirmRevealId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revelar foto picante?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta foto é de uma missão picante (+18). Tens a certeza que queres vê-la?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmRevealId !== null) {
                  setRevealed((r) => ({ ...r, [confirmRevealId]: true }));
                }
                setConfirmRevealId(null);
              }}
            >
              Sim, revelar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default QuestComplete;
