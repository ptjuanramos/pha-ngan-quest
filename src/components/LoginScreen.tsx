import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const LoginScreen = () => {
  const { login, loggingIn, loginError } = useAuth();
  const [username, setUsername] = useState("ana-lia");
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    const trimmed = username.trim();
    if (!trimmed) {
      setLocalError("Escolhe um nome para entrares.");
      return;
    }
    try {
      await login(trimmed);
    } catch {
      // surfaced via loginError
    }
  };

  const errorMsg = localError ?? loginError;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center fade-in">
      <p className="font-body text-xs uppercase tracking-[0.3em] text-muted-foreground mb-2">
        Diário da Aventura
      </p>
      <h1 className="font-heading text-4xl font-bold text-foreground leading-tight mb-6">
        Quem és?
      </h1>
      <p className="font-body text-base text-muted-foreground max-w-[280px] leading-relaxed mb-8">
        Escreve o teu nome para abrirmos o teu diário desta ilha.
      </p>

      <form onSubmit={handleSubmit} className="w-full max-w-[300px] space-y-4">
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="O teu nome"
          autoFocus
          autoComplete="username"
          disabled={loggingIn}
          className="w-full rounded-lg border border-border bg-background px-4 py-3 font-body text-base text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50"
        />

        {errorMsg && (
          <p className="font-body text-sm text-destructive" role="alert">
            {errorMsg}
          </p>
        )}

        <button
          type="submit"
          disabled={loggingIn}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-8 py-4 font-body text-base font-semibold text-accent-foreground transition-all active:scale-95 shadow-lg shadow-accent/20 disabled:opacity-60 disabled:active:scale-100"
        >
          {loggingIn ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              A entrar...
            </>
          ) : (
            <>Entrar</>
          )}
        </button>
      </form>
    </div>
  );
};

export default LoginScreen;
