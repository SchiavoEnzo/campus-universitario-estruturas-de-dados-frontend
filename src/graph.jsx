import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

const GraphContext = createContext(null);
const api = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

export async function request(path, init = {}) {
  const response = await fetch(`${api}/api/${path}`, {
    cache: "no-store",
    credentials: "include",
    signal: AbortSignal.timeout(12000),
    ...init,
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const error = new Error(
      typeof body.detail === "string"
        ? body.detail
        : `Não foi possível concluir a solicitação (HTTP ${response.status}).`,
    );
    error.status = response.status;
    throw error;
  }
  return response.status === 204 ? null : response.json();
}

function validateGraph(graph) {
  if (
    !graph ||
    !Array.isArray(graph.nodes) ||
    !Array.isArray(graph.edges) ||
    !Number.isInteger(graph.revision)
  ) {
    throw new Error("O servidor retornou um mapa inválido.");
  }
  const ids = new Set(graph.nodes.map((node) => node.id));
  if (
    ids.size !== graph.nodes.length ||
    graph.nodes.some(
      (node) =>
        typeof node.id !== "string" ||
        typeof node.name !== "string" ||
        typeof node.category !== "string" ||
        !Number.isFinite(node.x) ||
        !Number.isFinite(node.y),
    ) ||
    graph.edges.some(
      (edge) =>
        !ids.has(edge.from) ||
        !ids.has(edge.to) ||
        !Number.isFinite(edge.distance),
    )
  ) {
    throw new Error(
      "O mapa contém locais ou conexões inválidos. Verifique o cadastro.",
    );
  }
  return graph;
}

export function GraphProvider({ children }) {
  const [graph, setGraph] = useState(null);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);
  const sequence = useRef(0);
  const refresh = useCallback(async () => {
    const current = ++sequence.current;
    try {
      const next = validateGraph(await request("graph"));
      if (current === sequence.current) {
        setGraph((previous) =>
          JSON.stringify(previous) === JSON.stringify(next) ? previous : next,
        );
        setError("");
        setLastUpdated(new Date());
      }
      return next;
    } catch (failure) {
      if (current === sequence.current) setError(failure.message);
      throw failure;
    }
  }, []);

  useEffect(() => {
    const update = () => {
      if (!document.hidden) refresh().catch(() => {});
    };
    update();
    const timer = setInterval(update, 15000);
    window.addEventListener("focus", update);
    window.addEventListener("online", update);
    document.addEventListener("visibilitychange", update);
    return () => {
      ++sequence.current;
      clearInterval(timer);
      window.removeEventListener("focus", update);
      window.removeEventListener("online", update);
      document.removeEventListener("visibilitychange", update);
    };
  }, [refresh]);

  // Do not silently replace unavailable database data with demonstration data.
  if (error || !graph)
    return (
      <main style={{ margin: "40px auto", maxWidth: 700, padding: 24 }}>
        <h1>Campus Viva</h1>
        {error ? (
          <>
            <p role="alert">Não foi possível sincronizar o mapa: {error}</p>
            <p>
              A consulta será repetida automaticamente. Os dados anteriores não
              estão sendo apresentados como atuais.
            </p>
            <button
              className="btn primary"
              onClick={() => refresh().catch(() => {})}
            >
              Tentar novamente
            </button>
          </>
        ) : (
          <p role="status">Carregando dados do campus…</p>
        )}
      </main>
    );
  return (
    <GraphContext.Provider value={{ graph, refresh, lastUpdated }}>
      {children}
    </GraphContext.Provider>
  );
}

export function useGraph() {
  const value = useContext(GraphContext);
  if (!value) throw new Error("Mapa indisponível fora do provedor.");
  return value;
}
