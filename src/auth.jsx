import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { request } from "./graph.jsx";

const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [session, setSession] = useState(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  const sequence = useRef(0);
  const refresh = useCallback(async () => {
    const current = ++sequence.current;
    try {
      const next = await request("auth/me");
      if (current === sequence.current) {
        setSession(next);
        setError("");
      }
    } catch (e) {
      if (current === sequence.current) {
        setSession(null);
        setError(
          e.status === 401
            ? ""
            : "Não foi possível verificar sua sessão. Tente entrar novamente.",
        );
      }
    } finally {
      if (current === sequence.current) setLoading(false);
    }
  }, []);
  useEffect(() => {
    refresh();
    const expired = () => {
      ++sequence.current;
      setSession(null);
      setError("Sua sessão expirou. Entre novamente.");
    };
    const focus = () => {
      if (!document.hidden) refresh();
    };
    window.addEventListener("campus-session-expired", expired);
    window.addEventListener("focus", focus);
    return () => {
      ++sequence.current;
      window.removeEventListener("campus-session-expired", expired);
      window.removeEventListener("focus", focus);
    };
  }, [refresh]);
  async function login(username, password) {
    ++sequence.current;
    const next = await request("auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    setSession(next);
    setError("");
    setLoading(false);
  }
  async function mutate(path, init = {}) {
    try {
      return await request(path, {
        ...init,
        headers: { ...init.headers, "X-CSRF-Token": session?.csrf_token || "" },
      });
    } catch (e) {
      if (e.status === 401) {
        setSession(null);
        setError("Sua sessão expirou. Entre novamente.");
      }
      throw e;
    }
  }
  async function logout() {
    await mutate("auth/logout", { method: "POST" });
    ++sequence.current;
    setSession(null);
    setError("");
  }
  async function changePassword(current_password, new_password) {
    const next = await mutate("auth/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ current_password, new_password }),
    });
    ++sequence.current;
    setSession(next);
    setError("");
  }
  const user = session?.user;
  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        logout,
        changePassword,
        mutate,
        isAdmin: user?.role === "admin" && !user.must_change_password,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
export const useAuth = () => useContext(AuthContext);

export function AccountPanel({ onClose }) {
  const { user, login, logout, changePassword } = useAuth();
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  const dialog = useRef(null);
  useEffect(() => {
    const node = dialog.current;
    node.showModal();
    return () => node.close();
  }, []);
  async function submit(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const values = new FormData(form);
    setError("");
    setMessage("");
    setBusy(true);
    try {
      if (!user) {
        await login(values.get("username"), values.get("password"));
        form.reset();
      } else {
        if (values.get("new_password") !== values.get("confirm"))
          throw new Error("As novas senhas não coincidem.");
        await changePassword(
          values.get("current_password"),
          values.get("new_password"),
        );
        form.reset();
        setMessage("Senha alterada. Sua sessão está ativa.");
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function exit() {
    setBusy(true);
    try {
      await logout();
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <dialog
      ref={dialog}
      onCancel={(e) => {
        e.preventDefault();
        if (!busy) onClose();
      }}
    >
      <button
        className="close"
        aria-label="Fechar conta"
        disabled={busy}
        onClick={onClose}
      >
        ×
      </button>
      <h2>{user ? `Conta de ${user.name}` : "Entrar no Campus Viva"}</h2>
      {user && (
        <>
          <p>
            Perfil: {user.role === "admin" ? "Administrador" : "Consulta"}.
            Sessão válida por até 8 horas.
          </p>
          {user.must_change_password && (
            <p role="status">
              Troque sua senha temporária para liberar o acesso administrativo.
            </p>
          )}
        </>
      )}
      <form key={user ? "password" : "login"} onSubmit={submit}>
        <fieldset disabled={busy} style={{ border: 0, padding: 0 }}>
          {!user ? (
            <>
              <label htmlFor="login-username">Usuário</label>
              <input
                id="login-username"
                name="username"
                autoComplete="username"
                maxLength="80"
                required
                autoFocus
              />
              <label htmlFor="login-password">Senha</label>
              <input
                id="login-password"
                name="password"
                type="password"
                autoComplete="current-password"
                maxLength="128"
                required
              />
            </>
          ) : (
            <>
              <h3>Alterar senha</h3>
              <label htmlFor="current-password">Senha atual</label>
              <input
                id="current-password"
                name="current_password"
                type="password"
                autoComplete="current-password"
                maxLength="128"
                required
              />
              <label htmlFor="new-password">Nova senha</label>
              <input
                id="new-password"
                name="new_password"
                type="password"
                autoComplete="new-password"
                minLength="12"
                maxLength="128"
                required
              />
              <label htmlFor="confirm-password">Confirme a nova senha</label>
              <input
                id="confirm-password"
                name="confirm"
                type="password"
                autoComplete="new-password"
                minLength="12"
                maxLength="128"
                required
              />
              <p className="sub">
                Use pelo menos 12 caracteres. A troca encerra suas outras
                sessões.
              </p>
            </>
          )}
          {error && <p role="alert">{error}</p>}
          {message && <p role="status">{message}</p>}
          <button className="btn primary full" type="submit">
            {busy ? "Aguarde…" : user ? "Salvar nova senha" : "Entrar"}
          </button>
        </fieldset>
      </form>
      {user && (
        <button className="btn full" onClick={exit} disabled={busy}>
          Sair da conta
        </button>
      )}
    </dialog>
  );
}
