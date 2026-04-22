import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { playersService } from "@/services";
import { setAuthToken } from "@/services/httpClient";
import { decodeJwt, type JwtPayload } from "@/lib/jwt";

const STORAGE_KEY = "kpn-auth";

interface StoredAuth {
  token: string;
  playerId: number;
}

export interface AuthState {
  token: string | null;
  playerId: number | null;
  username: string | null;
  isAdmin: boolean;
  isAuthenticated: boolean;
}

interface AuthContextValue extends AuthState {
  login: (username: string) => Promise<void>;
  logout: () => void;
  loggingIn: boolean;
  loginError: string | null;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function stateFromToken(token: string, playerId: number): AuthState {
  const payload: JwtPayload | null = decodeJwt(token);
  return {
    token,
    playerId,
    username: (payload?.username as string) ?? null,
    isAdmin: !!payload?.is_admin,
    isAuthenticated: true,
  };
}

const EMPTY: AuthState = {
  token: null,
  playerId: null,
  username: null,
  isAdmin: false,
  isAuthenticated: false,
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<AuthState>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return EMPTY;
      const stored = JSON.parse(raw) as StoredAuth;
      setAuthToken(stored.token);
      return stateFromToken(stored.token, stored.playerId);
    } catch {
      return EMPTY;
    }
  });
  const [loggingIn, setLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  useEffect(() => {
    setAuthToken(state.token);
  }, [state.token]);

  const login = useCallback(async (username: string) => {
    setLoggingIn(true);
    setLoginError(null);
    try {
      const res = await playersService.identify({ username });
      const next = stateFromToken(res.token, res.playerId);
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ token: res.token, playerId: res.playerId })
      );
      setAuthToken(res.token);
      setState(next);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Não foi possível autenticar.";
      setLoginError(msg);
      throw err;
    } finally {
      setLoggingIn(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setAuthToken(null);
    setState(EMPTY);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ ...state, login, logout, loggingIn, loginError }),
    [state, login, logout, loggingIn, loginError]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
