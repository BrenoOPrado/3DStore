import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type User = { name: string; email: string };

type AuthContextValue = {
  user: User | null;
  login: (email: string, password: string) => string | null;
  signup: (name: string, email: string, password: string) => string | null;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const USER_KEY = "3dstore-user";
const ACCOUNTS_KEY = "3dstore-accounts";

type Account = User & { password: string };

function loadUser(): User | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

function loadAccounts(): Account[] {
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY);
    return raw ? (JSON.parse(raw) as Account[]) : [];
  } catch {
    return [];
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(loadUser);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      login: (email, password) => {
        const accounts = loadAccounts();
        const found = accounts.find(
          (a) => a.email.toLowerCase() === email.toLowerCase() && a.password === password
        );
        if (!found) return "E-mail ou senha inválidos.";
        const next = { name: found.name, email: found.email };
        localStorage.setItem(USER_KEY, JSON.stringify(next));
        setUser(next);
        return null;
      },
      signup: (name, email, password) => {
        if (name.trim().length < 2) return "Informe seu nome.";
        if (!email.includes("@")) return "E-mail inválido.";
        if (password.length < 6) return "A senha precisa ter ao menos 6 caracteres.";
        const accounts = loadAccounts();
        if (accounts.some((a) => a.email.toLowerCase() === email.toLowerCase())) {
          return "Já existe uma conta com este e-mail.";
        }
        const account: Account = { name: name.trim(), email: email.trim(), password };
        localStorage.setItem(ACCOUNTS_KEY, JSON.stringify([...accounts, account]));
        const next = { name: account.name, email: account.email };
        localStorage.setItem(USER_KEY, JSON.stringify(next));
        setUser(next);
        return null;
      },
      logout: () => {
        localStorage.removeItem(USER_KEY);
        setUser(null);
      },
    }),
    [user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
