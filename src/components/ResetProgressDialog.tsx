import { useState } from "react";
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

interface ResetProgressDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (scope: "self" | "all") => Promise<void> | void;
}

const ResetProgressDialog = ({ open, onOpenChange, onConfirm }: ResetProgressDialogProps) => {
  const [scope, setScope] = useState<"self" | "all">("self");
  const [busy, setBusy] = useState(false);

  const handleConfirm = async () => {
    setBusy(true);
    try {
      await onConfirm(scope);
      onOpenChange(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Reset de progresso</AlertDialogTitle>
          <AlertDialogDescription>
            Escolhe o que apagar. Esta ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-2 py-2">
          <label className="flex cursor-pointer items-start gap-3 rounded-md border border-border p-3 hover:bg-secondary/40">
            <input
              type="radio"
              name="reset-scope"
              checked={scope === "self"}
              onChange={() => setScope("self")}
              className="mt-1"
            />
            <span>
              <span className="block font-body text-sm font-semibold text-foreground">
                Apenas o meu progresso
              </span>
              <span className="block font-body text-xs text-muted-foreground">
                Limpa missões e fotos do jogador atual.
              </span>
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-3 rounded-md border border-border p-3 hover:bg-secondary/40">
            <input
              type="radio"
              name="reset-scope"
              checked={scope === "all"}
              onChange={() => setScope("all")}
              className="mt-1"
            />
            <span>
              <span className="block font-body text-sm font-semibold text-foreground">
                Todos os jogadores
              </span>
              <span className="block font-body text-xs text-muted-foreground">
                Limpa tudo, em todos os dispositivos.
              </span>
            </span>
          </label>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={busy}>
            {busy ? "A apagar..." : "Confirmar reset"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ResetProgressDialog;
