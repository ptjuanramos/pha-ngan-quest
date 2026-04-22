import { Shield, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface AdminBadgeProps {
  onResetClick?: () => void;
}

const AdminBadge = ({ onResetClick }: AdminBadgeProps) => {
  const { isAdmin, username, logout } = useAuth();
  if (!isAdmin) return null;

  return (
    <div className="fixed right-3 top-3 z-50 flex items-center gap-2">
      <div className="flex items-center gap-1.5 rounded-full bg-accent/15 px-3 py-1.5 text-accent shadow-sm backdrop-blur">
        <Shield size={14} />
        <span className="font-body text-xs font-bold uppercase tracking-wide">
          Admin{username ? ` · ${username}` : ""}
        </span>
      </div>
      {onResetClick && (
        <button
          onClick={onResetClick}
          className="rounded-full bg-background/80 px-3 py-1.5 font-body text-xs font-semibold text-foreground shadow-sm backdrop-blur transition-all active:scale-95"
        >
          Reset
        </button>
      )}
      <button
        onClick={logout}
        aria-label="Sair"
        className="flex h-8 w-8 items-center justify-center rounded-full bg-background/80 text-foreground shadow-sm backdrop-blur transition-all active:scale-95"
      >
        <LogOut size={14} />
      </button>
    </div>
  );
};

export default AdminBadge;
