import { Shield, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface AdminBadgeProps {
  onResetClick?: () => void;
}

const AdminBadge = ({ onResetClick }: AdminBadgeProps) => {
  const { isAuthenticated, isAdmin, username, logout } = useAuth();
  if (!isAuthenticated) return null;

  const handleLogout = () => {
    try {
      sessionStorage.removeItem("kpn-photo-cache");
    } catch {
      /* ignore */
    }
    logout();
  };

  return (
    <div className="fixed right-3 top-3 z-50 flex items-center gap-2">
      {isAdmin ? (
        <div className="flex items-center gap-1.5 rounded-full bg-accent/15 px-3 py-1.5 text-accent shadow-sm backdrop-blur">
          <Shield size={14} />
          <span className="font-body text-xs font-bold uppercase tracking-wide">
            Admin{username ? ` · ${username}` : ""}
          </span>
        </div>
      ) : (
        username && (
          <div className="rounded-full bg-background/80 px-3 py-1.5 font-body text-xs font-semibold text-foreground shadow-sm backdrop-blur">
            {username}
          </div>
        )
      )}
      {isAdmin && onResetClick && (
        <button
          onClick={onResetClick}
          className="rounded-full bg-background/80 px-3 py-1.5 font-body text-xs font-semibold text-foreground shadow-sm backdrop-blur transition-all active:scale-95"
        >
          Reset
        </button>
      )}
      <button
        onClick={handleLogout}
        aria-label="Sair"
        title="Sair"
        className="flex h-8 items-center justify-center gap-1.5 rounded-full bg-background/80 px-3 font-body text-xs font-semibold text-foreground shadow-sm backdrop-blur transition-all active:scale-95"
      >
        <LogOut size={14} />
        Sair
      </button>
    </div>
  );
};

export default AdminBadge;
