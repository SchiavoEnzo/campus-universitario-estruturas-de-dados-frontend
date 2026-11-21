import React, { useState, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import paths from "./icons.json";
import { AuthProvider, useAuth, AccountPanel } from "./auth.jsx";
import { GraphProvider, useGraph, request } from "./graph.jsx";
import "./styles.css";

const userPages = [
  ["routes", "Planejar rota", "route", "Rotas"],
  ["places", "Explorar locais", "pin", "Locais"],
  ["access", "Acessibilidade", "access", "Acessibilidade"],
  ["favorites", "Meus favoritos", "star", "Favoritos"],
];
const adminPages = [
  ["overview", "Visão geral", "home"],
  ["manage", "Locais e conexões", "graph"],
  ["alerts", "Interdições", "alert"],
  ["users", "Administração", "home"],
];
const titles = {
  routes: [
    "VÁ DO SEU JEITO",
    "Seu próximo destino começa aqui.",
    "Encontre seu caminho e aproveite cada momento no campus.",
  ],
  places: [
    "DESCUBRA O CAMPUS",
    "Um lugar para cada momento.",
    "Espaços para aprender, se encontrar e ir além.",
  ],
  access: [
    "MOBILIDADE PARA TODOS",
    "Caminhos que incluem.",
    "Mais autonomia para viver o campus do seu jeito.",
  ],
  favorites: [
    "SEUS LUGARES",
    "Sempre por perto.",
    "Seus pontos de encontro, estudo e convivência.",
  ],
  overview: [
    "GESTÃO DO CAMPUS",
    "Seu campus, conectado.",
    "Uma visão dos espaços e caminhos do campus universitário.",
  ],
  manage: [
    "GESTÃO DA REDE",
    "Cada conexão faz a diferença.",
    "Organize os locais e as conexões do campus.",
  ],
  alerts: [
    "CAMPUS EM MOVIMENTO",
    "Antecipe mudanças no caminho.",
    "Interface de acompanhamento de interdições e manutenção.",
  ],
  users: [
    "ADMINISTRAÇÃO",
    "Um campus bem cuidado.",
    "Gerencie os perfis e as configurações da instituição.",
  ],
};
function Icon({ name }) {
  return (
    <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d={paths[name] || paths.pin} />
    </svg>
  );
}
function Button({ children, onClick, primary = false, ...props }) {
  return (
    <button
      className={`btn ${primary ? "primary" : ""}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
}
function useMobile() {
  const [mobile, setMobile] = useState(
    () => window.matchMedia("(max-width: 767px)").matches,
  );
  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)");
    const change = () => setMobile(media.matches);
    media.addEventListener("change", change);
    return () => media.removeEventListener("change", change);
  }, []);
  return mobile;
}
const MapIndex = globalThis.Map;
function Map({ route = [], graph }) {
  const { nodes, edges } = graph;
  const byId = new MapIndex(nodes.map((n) => [n.id, n]));
  return (
    <div className="campus-map">
      <span className="map-tag">
        <span className="status-dot" />
        Campus universitário
      </span>
      <svg
        viewBox="0 0 830 560"
        role="img"
        aria-label="Mapa esquemático do campus"
      >
        <defs>
          <pattern
            id="dots"
            width="24"
            height="24"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="3" cy="3" r="1" fill="#cedbce" />
          </pattern>
        </defs>
        <rect width="830" height="560" fill="#eaf0e9" />
        <rect width="830" height="560" fill="url(#dots)" />
        <path
          d="M0 80Q140 10 240 190T580 550"
          stroke="#dae6d5"
          strokeWidth="50"
          fill="none"
        />
        <path
          d="M745 0Q640 130 735 260T750 560"
          stroke="#d2e5ec"
          strokeWidth="36"
          fill="none"
        />
        <path
          d="M20 0V540H830M0 20H810V560"
          stroke="#d3dcd5"
          strokeWidth="20"
          fill="none"
        />
        {edges.map((e) => {
          const a = byId.get(e.from),
            b = byId.get(e.to);
          if (!a || !b) return null;
          return (
            <line
              key={e.id}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke={e.blocked ? "#ba5347" : "white"}
              strokeWidth="11"
            />
          );
        })}
        {Array.from({ length: 20 }, (_, i) => (
          <circle
            key={i}
            cx={((i * 113 + 42) % 790) + 20}
            cy={((i * 79 + 24) % 500) + 25}
            r={8 + (i % 6)}
            fill="#c5dabb"
            opacity=".7"
          />
        ))}
        {route.length > 1 && (
          <polyline
            points={route.map((n) => `${n.x},${n.y}`).join(" ")}
            stroke="#338bbd"
            strokeWidth="7"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        )}
        {nodes.map((n, i) => {
          const c =
            n.category === "Convivência"
              ? "#679679"
              : n.category === "Alimentação"
                ? "#c0a276"
                : "#79a2b4";
          return (
            <g key={n.id}>
              <rect
                x={n.x - 28}
                y={n.y - 29}
                width="55"
                height="36"
                rx="4"
                fill={c}
                opacity=".5"
                transform={`rotate(${i % 2 ? 0 : -6} ${n.x} ${n.y})`}
              />
              <circle
                cx={n.x}
                cy={n.y}
                r="7"
                fill={route.some((p) => p.id === n.id) ? "#3184b7" : c}
                stroke="white"
                strokeWidth="3"
              />
              <text
                x={n.x}
                y={n.y + 24}
                textAnchor="middle"
                fontSize="10"
                fontFamily="Arial"
                fill="#4a6b60"
                paintOrder="stroke"
                stroke="#edf2ed"
                strokeWidth="3"
              >
                {n.id}
              </text>
            </g>
          );
        })}
        <text x="778" y="60" fill="#72877a" fontSize="13">
          N ↑
        </text>
      </svg>
      <span className="map-scale">MAPA ESQUEMÁTICO · SEM ESCALA</span>
    </div>
  );
}
function Legend() {
  return (
    <div className="legend">
      <span>
        <i />
        Acadêmico
      </span>
      <span>
        <i className="green" />
        Convivência
      </span>
      <span>
        <i className="orange" />
        Alimentação
      </span>
    </div>
  );
}
function Stats() {
  const {
    graph: { nodes, edges },
  } = useGraph();
  const accessible = edges.filter(
    (e) => e.accessible === true && !e.blocked,
  ).length;
  return (
    <div className="stats">
      {[
        ["pin", nodes.length, "Locais mapeados"],
        ["graph", edges.length, "Conexões direcionadas"],
        [
          "access",
          edges.length
            ? `${Math.round((accessible / edges.length) * 100)}%`
            : "—",
          "Conexões acessíveis e livres",
        ],
        ["alert", edges.filter((e) => e.blocked).length, "Conexões bloqueadas"],
      ].map(([icon, n, label]) => (
        <div className="stat" key={label}>
          <div className="stat-icon">
            <Icon name={icon} />
          </div>
          <div>
            <strong>{n}</strong>
            <small>{label}</small>
          </div>
        </div>
      ))}
    </div>
  );
}
function Modal({ title, children, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    ref.current.showModal();
    return () => ref.current?.close();
  }, []);
  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      <button className="close" onClick={onClose} aria-label="Fechar">
        ×
      </button>
      <div className="eyebrow">CAMPUS VIVA</div>
      <h2 className="dialog-title">{title}</h2>
      {children}
    </dialog>
  );
}
function PlaceCard({ n, onDetail, favorite = false }) {
  return (
    <article className="place">
      <div className="place-icon">
        <Icon
          name={
            n.category === "Acadêmico"
              ? "book"
              : n.category === "Convivência"
                ? "leaf"
                : "pin"
          }
        />
      </div>
      <h3>{n.name}</h3>
      <p>
        {n.category} · {n.id}
      </p>
      <div className="place-foot">
        <span>● Ponto mapeado</span>
        <button className="text-link" onClick={() => onDetail(n)}>
          Ver local →
        </button>
      </div>
    </article>
  );
}
function Routes() {
  const { graph, refresh } = useGraph();
  const [route, setRoute] = useState(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const snapshot = JSON.stringify(graph);
  const visibleRoute = route?.snapshot === snapshot ? route.result : null;
  async function calculate(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setRoute(null);
    const f = new FormData(e.currentTarget);
    try {
      const result = await request("routes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          origin: f.get("origin"),
          destination: f.get("destination"),
          criterion: f.get("criterion"),
          accessible: f.has("accessible"),
        }),
      });
      if (result.revision !== graph.revision) {
        await refresh();
        throw new Error(
          "O mapa mudou durante a consulta. Calcule novamente com os dados atualizados.",
        );
      }
      setRoute({ result, snapshot });
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  const options = graph?.nodes ?? [];
  return (
    <div className="route-layout">
      <section className="panel planner">
        <h2>Para onde vamos?</h2>
        {
          <form
            onSubmit={calculate}
            onChange={() => {
              setRoute(null);
              setError("");
            }}
          >
            <fieldset
              disabled={busy || !options.length}
              style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}
            >
              <label htmlFor="origin">Origem</label>
              <select id="origin" name="origin">
                {options.map((n) => (
                  <option value={n.id} key={n.id}>
                    {n.name}
                  </option>
                ))}
              </select>
              <label htmlFor="destination">Destino</label>
              <select
                id="destination"
                name="destination"
                defaultValue={options[1]?.id}
              >
                {options.map((n) => (
                  <option value={n.id} key={n.id}>
                    {n.name}
                  </option>
                ))}
              </select>
              <label htmlFor="criterion">Prioridade</label>
              <select id="criterion" name="criterion">
                <option value="distance">Menor distância</option>
                {graph.edges.some((e) => e.time != null && !e.blocked) && (
                  <option value="time">Menor tempo</option>
                )}
              </select>
              <label className="check">
                <input type="checkbox" name="accessible" /> Somente trechos
                acessíveis
              </label>
              <button className="btn primary full" type="submit">
                {busy ? "Calculando…" : "Calcular rota"}
              </button>
            </fieldset>
            {!options.length && <p>O mapa não tem locais cadastrados.</p>}
            {error && <p role="alert">{error}</p>}
          </form>
        }
      </section>
      <div className="route-map">
        {graph && (
          <section className="panel">
            <div className="panel-head">
              <h2>Mapa do campus</h2>
              <span className="badge">{options.length} locais</span>
            </div>
            <Map graph={graph} route={visibleRoute?.path ?? []} />
            <Legend />
          </section>
        )}
        {visibleRoute && (
          <section className="panel padded example-result" aria-live="polite">
            {visibleRoute.found ? (
              <>
                <h2>Rota calculada</h2>
                <p>
                  {visibleRoute.distance.toLocaleString("pt-BR")} m
                  {visibleRoute.time != null &&
                    ` · ${visibleRoute.time.toLocaleString("pt-BR")} min`}
                </p>
                <ol>
                  {visibleRoute.path.map((n) => (
                    <li key={n.id}>{n.name}</li>
                  ))}
                </ol>
              </>
            ) : (
              <p>
                Não existe rota entre os pontos escolhidos com esses filtros.
              </p>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
function Places({ favorites = false, onDetail }) {
  const {
    graph: { nodes },
  } = useGraph();
  const [category, setCategory] = useState("Todos"),
    [query, setQuery] = useState("");
  const base = favorites ? [] : nodes;
  const visible = base.filter(
    (n) =>
      (category === "Todos" || n.category === category) &&
      n.name.toLocaleLowerCase().includes(query.toLocaleLowerCase()),
  );
  return (
    <>
      {favorites && (
        <div className="saved-intro">
          <Icon name="star" />
          <div>
            <b>Seus lugares de sempre, em um só lugar.</b>
            <p className="sub">
              Favoritos pessoais ainda não estão disponíveis. Explore os locais
              cadastrados na aba Locais.
            </p>
          </div>
        </div>
      )}
      <div className="filters">
        <label className="sr" htmlFor="search">
          Buscar um local
        </label>
        <input
          id="search"
          type="text"
          placeholder="Buscar um lugar no campus…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <span className="sub">{visible.length} locais</span>
      </div>
      <div className="chips category-chips">
        {["Todos", ...new Set(nodes.map((n) => n.category))].map((c) => (
          <button
            key={c}
            className={`chip ${category === c ? "active" : ""}`}
            onClick={() => setCategory(c)}
          >
            {c}
          </button>
        ))}
      </div>
      <div className="places">
        {visible.map((n) => (
          <PlaceCard
            key={n.id}
            n={n}
            onDetail={onDetail}
            favorite={favorites}
          />
        ))}
      </div>
      {!visible.length && <div className="empty">Nenhum local encontrado.</div>}
    </>
  );
}
function Access({ navigate }) {
  const { graph } = useGraph();
  const names = new MapIndex(graph.nodes.map((n) => [n.id, n.name]));
  const edges = graph.edges.filter((e) => e.accessible === true && !e.blocked);
  return (
    <>
      <Stats />
      <section className="panel padded">
        <h2>Caminhos acessíveis disponíveis</h2>
        <p>
          Conexões cadastradas como acessíveis e sem bloqueio. No planejamento,
          selecione “Somente trechos acessíveis”.
        </p>
        <Button primary onClick={() => navigate("routes")}>
          Planejar meu caminho →
        </Button>
        <ul>
          {edges.map((e) => (
            <li key={e.id}>
              {names.get(e.from)} → {names.get(e.to)} · {e.distance} m
            </li>
          ))}
        </ul>
        {!edges.length && <p>Nenhuma conexão acessível disponível.</p>}
      </section>
    </>
  );
}
function Overview({ navigate }) {
  const { graph } = useGraph();
  return (
    <>
      <div className="hero">
        <div className="eyebrow">CADA CAMINHO, UMA POSSIBILIDADE</div>
        <h2 style={{ marginTop: 12 }}>
          Um campus inteiro.
          <br />
          Uma experiência conectada.
        </h2>
        <p>Cuide dos espaços que conectam a comunidade.</p>
        <Button primary onClick={() => navigate("manage")}>
          Explorar a gestão <Icon name="arrow" />
        </Button>
      </div>
      <Stats />
      <div className="grid-main">
        <section className="panel">
          <div className="panel-head">
            <h2>Visão do campus</h2>
            <span className="badge">Mapa cadastrado</span>
          </div>
          <Map graph={graph} />
          <Legend />
        </section>
        <section className="panel padded">
          <div className="eyebrow">ACESSO RÁPIDO</div>
          <h2 style={{ marginTop: 12 }}>Organize o campus</h2>
          {[
            [
              "manage",
              "Locais e conexões",
              `${graph.nodes.length} pontos de interesse`,
            ],
            [
              "alerts",
              "Interdições",
              `${graph.edges.filter((e) => e.blocked).length} conexões bloqueadas`,
            ],
            ["users", "Administração", "Perfis e configurações"],
          ].map(([id, t, d]) => (
            <button
              key={id}
              className="quick-link"
              onClick={() => navigate(id)}
            >
              <span>
                <b>{t}</b>
                <small>{d}</small>
              </span>
              <Icon name="arrow" />
            </button>
          ))}
          <div className="tip">
            Os dados são consultados no banco. Edições exigem uma credencial
            administrativa.
          </div>
        </section>
      </div>
    </>
  );
}
function Manage({ openEditor }) {
  const {
    graph: { nodes, edges },
  } = useGraph();
  const [tab, setTab] = useState("Locais");
  return (
    <>
      <Stats />
      <div className="section-title">
        <div className="chips">
          {["Locais", "Conexões"].map((t) => (
            <button
              key={t}
              className={`chip ${tab === t ? "active" : ""}`}
              onClick={() => setTab(t)}
            >
              {t}
            </button>
          ))}
        </div>
        <Button
          primary
          onClick={() =>
            openEditor(tab === "Locais" ? "Novo local" : "Nova conexão")
          }
        >
          + {tab === "Locais" ? "Novo local" : "Nova conexão"}
        </Button>
      </div>
      <div className="panel table-wrap">
        <table>
          <thead>
            <tr>
              {(tab === "Locais"
                ? ["Local", "Identificador", "Categoria", "Situação", "Ação"]
                : [
                    "Origem → destino",
                    "Distância",
                    "Tempo",
                    "Acessibilidade",
                    "Ação",
                  ]
              ).map((t) => (
                <th key={t}>{t}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tab === "Locais"
              ? nodes.map((n) => (
                  <tr key={n.id}>
                    <td>
                      <b>{n.name}</b>
                    </td>
                    <td>{n.id}</td>
                    <td>{n.category}</td>
                    <td>
                      <span className="badge">Mapeado</span>
                    </td>
                    <td>
                      <button
                        className="text-link"
                        onClick={() => openEditor("Editar local", n)}
                      >
                        Editar
                      </button>
                    </td>
                  </tr>
                ))
              : edges.map((e) => (
                  <tr key={e.id}>
                    <td>
                      {e.from} → {e.to}
                    </td>
                    <td>{e.distance} m</td>
                    <td>
                      {e.time == null ? "Não informado" : `${e.time} min`}
                    </td>
                    <td>
                      {e.blocked
                        ? "Bloqueada"
                        : e.accessible === true
                          ? "Acessível"
                          : e.accessible === false
                            ? "Com barreiras"
                            : "Não informado"}
                    </td>
                    <td>
                      <button
                        className="text-link"
                        onClick={() => openEditor("Editar conexão", e)}
                      >
                        Editar
                      </button>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
function Alerts({ openEditor }) {
  const { graph } = useGraph();
  const names = new MapIndex(graph.nodes.map((n) => [n.id, n.name]));
  const blocked = graph.edges.filter((e) => e.blocked);
  return (
    <>
      <Stats />
      <div className="two-col">
        {blocked.map((e) => (
          <section className="panel padded" key={e.id}>
            <h2>
              {names.get(e.from)} → {names.get(e.to)}
            </h2>
            <span className="badge orange">Conexão bloqueada</span>
            <p>Este trecho não participa do cálculo de rotas.</p>
            <Button onClick={() => openEditor("Editar conexão", e)}>
              Editar conexão
            </Button>
          </section>
        ))}
      </div>
      {!blocked.length && (
        <p className="empty">Nenhuma conexão bloqueada no mapa.</p>
      )}
    </>
  );
}
function Users() {
  const { user } = useAuth();
  return (
    <section className="panel padded">
      <h2>Administração</h2>
      <p>Conectado como {user?.name}, com perfil de administrador.</p>
      <p>
        Você pode criar, editar e excluir locais e conexões. Para alterar a
        senha ou encerrar a sessão, abra Minha conta.
      </p>
      <p>Favoritos pessoais ainda não estão disponíveis.</p>
    </section>
  );
}
function Editor({ title, data, onClose }) {
  const { mutate, isAdmin } = useAuth();
  const { graph, refresh } = useGraph();
  const connection = /conexão/.test(title);
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function submit(event, remove = false) {
    event.preventDefault();
    if (
      remove &&
      !window.confirm(
        connection
          ? "Excluir esta conexão?"
          : "Excluir este local e todas as conexões ligadas a ele?",
      )
    )
      return;
    const f = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    const path = connection
      ? `connections/${encodeURIComponent(data?.from || f.get("from"))}/${encodeURIComponent(data?.to || f.get("to"))}`
      : `points${data ? "/" + encodeURIComponent(data.id) : ""}`;
    const body = connection
      ? {
          distance: Number(f.get("distance")),
          time: f.get("time") === "" ? null : Number(f.get("time")),
          accessible:
            f.get("accessible") === "" ? null : f.get("accessible") === "true",
          blocked: f.has("blocked"),
        }
      : {
          name: f.get("name"),
          category: f.get("category"),
          x: Number(f.get("x")),
          y: Number(f.get("y")),
        };
    try {
      await mutate(path, {
        method: remove ? "DELETE" : connection || data ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        ...(remove ? {} : { body: JSON.stringify(body) }),
      });
      await refresh();
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  const current =
    data &&
    (connection
      ? graph.edges.find((e) => e.from === data.from && e.to === data.to)
      : graph.nodes.find((n) => n.id === data.id));
  const changed =
    data && current && JSON.stringify(current) !== JSON.stringify(data);
  const exists =
    !data ||
    (connection
      ? graph.edges.some((e) => e.from === data.from && e.to === data.to)
      : graph.nodes.some((n) => n.id === data.id));
  return (
    <Modal title={title} onClose={busy ? () => {} : onClose}>
      <form
        onSubmit={(e) => submit(e, e.nativeEvent.submitter?.value === "delete")}
      >
        {!exists && (
          <p role="alert">
            Este registro foi removido. Feche o formulário e atualize o mapa.
          </p>
        )}
        {changed && (
          <p role="alert">
            Este registro mudou no banco. Feche e abra novamente para editar a
            versão atual.
          </p>
        )}
        <fieldset
          disabled={busy || !exists || changed}
          style={{ border: 0, padding: 0 }}
        >
          {connection ? (
            <>
              <label htmlFor="edit-from">Origem</label>
              <select
                id="edit-from"
                name="from"
                defaultValue={data?.from}
                disabled={!!data}
                required
              >
                {graph.nodes.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.name}
                  </option>
                ))}
              </select>
              <label htmlFor="edit-to">Destino</label>
              <select
                id="edit-to"
                name="to"
                defaultValue={data?.to}
                disabled={!!data}
                required
              >
                {graph.nodes.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.name}
                  </option>
                ))}
              </select>
              <label htmlFor="edit-distance">Distância (m)</label>
              <input
                id="edit-distance"
                name="distance"
                type="number"
                min="0"
                max="10000000"
                step="any"
                defaultValue={data?.distance ?? 0}
                required
              />
              <label htmlFor="edit-time">Tempo (min, opcional)</label>
              <input
                id="edit-time"
                name="time"
                type="number"
                min="0"
                max="10000000"
                step="any"
                defaultValue={data?.time ?? ""}
              />
              <label htmlFor="edit-accessible">Acessibilidade</label>
              <select
                id="edit-accessible"
                name="accessible"
                defaultValue={
                  data?.accessible == null ? "" : String(data.accessible)
                }
              >
                <option value="">Não informada</option>
                <option value="true">Acessível</option>
                <option value="false">Com barreiras</option>
              </select>
              <label className="check">
                <input
                  name="blocked"
                  type="checkbox"
                  defaultChecked={data?.blocked ?? false}
                />{" "}
                Conexão bloqueada
              </label>
            </>
          ) : (
            <>
              <label htmlFor="edit-name">Nome</label>
              <input
                id="edit-name"
                name="name"
                maxLength="120"
                defaultValue={data?.name ?? ""}
                required
              />
              <label htmlFor="edit-category">Categoria</label>
              <input
                id="edit-category"
                name="category"
                maxLength="120"
                defaultValue={data?.category ?? "Serviços"}
                required
              />
              {["x", "y"].map((axis) => (
                <React.Fragment key={axis}>
                  <label htmlFor={"edit-" + axis}>
                    Posição {axis.toUpperCase()} no mapa
                  </label>
                  <input
                    id={"edit-" + axis}
                    name={axis}
                    type="number"
                    min="0"
                    max={axis === "x" ? 830 : 560}
                    step="any"
                    defaultValue={data?.[axis] ?? (axis === "x" ? 415 : 280)}
                    required
                  />
                </React.Fragment>
              ))}
            </>
          )}
          {error && <p role="alert">{error}</p>}
          <button
            className="btn primary full"
            disabled={!isAdmin || (connection && !graph.nodes.length)}
          >
            {busy ? "Salvando…" : "Salvar no banco"}
          </button>
          {data && (
            <button
              className="btn full"
              type="submit"
              value="delete"
              formNoValidate
              disabled={!isAdmin}
            >
              Excluir do banco
            </button>
          )}
        </fieldset>
        <Button type="button" disabled={busy} onClick={onClose}>
          Fechar
        </Button>
      </form>
    </Modal>
  );
}
function App() {
  const { user, isAdmin, loading: authLoading, error: authError } = useAuth();
  const [accountOpen, setAccountOpen] = useState(false);
  const { graph, refresh, lastUpdated } = useGraph();
  const mobile = useMobile();
  const [page, setPage] = useState("routes");
  const [detailId, setDetailId] = useState(null);
  const detail = graph.nodes.find((n) => n.id === detailId);
  const setDetail = (n) => setDetailId(n?.id ?? null);
  const [editor, setEditor] = useState(null);
  const safePage =
    adminPages.some((p) => p[0] === page) && !isAdmin ? "routes" : page;
  useEffect(() => {
    if (!isAdmin) setEditor(null);
  }, [isAdmin]);
  function navigate(p) {
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  useEffect(() => {
    refresh().catch(() => {});
  }, [safePage, refresh]);
  const title = titles[safePage];
  return (
    <>
      <aside>
        <div className="brand">
          <div className="logo">⌁</div>
          <div>
            campus<span style={{ color: "#398a72" }}>viva</span>
            <small>CONECTE SEU CAMINHO</small>
          </div>
        </div>
        <div className="nav-label">EXPLORE O CAMPUS</div>
        <nav>
          {userPages.map(([id, t, i]) => (
            <button
              key={id}
              className={safePage === id ? "active" : ""}
              onClick={() => navigate(id)}
              aria-current={safePage === id ? "page" : undefined}
            >
              <Icon name={i} />
              {t}
            </button>
          ))}
        </nav>
        {isAdmin && <div className="nav-label admin-label">ÁREA DE GESTÃO</div>}
        <nav>
          {(isAdmin ? adminPages : []).map(([id, t, i]) => (
            <button
              key={id}
              className={safePage === id ? "active" : ""}
              onClick={() => navigate(id)}
              aria-current={safePage === id ? "page" : undefined}
            >
              <Icon name={i} />
              {t}
            </button>
          ))}
        </nav>
        <div className="side-foot">
          <span className="status-dot" />
          Dados do campus
          <br />
          Campus universitário · React
        </div>
      </aside>
      <main>
        <header>
          <div className="crumb">
            Campus Viva <span style={{ padding: "0 13px" }}>/</span>
            <b>
              {[...userPages, ...adminPages].find((p) => p[0] === safePage)[1]}
            </b>
          </div>
          <div className="mobile-brand">
            campus<span>viva</span>
          </div>
          <div className="header-right">
            <span className="campus-pill">
              <span className="status-dot" />
              Campus universitário
            </span>
            <button
              className="btn"
              disabled={authLoading}
              onClick={() => setAccountOpen(true)}
            >
              {authLoading ? "Verificando…" : user ? "Minha conta" : "Entrar"}
            </button>
          </div>
        </header>
        <div className="content">
          {authError && <p role="alert">{authError}</p>}
          {user && (
            <p className="sub">
              Conectado como {user.name} ·{" "}
              {isAdmin
                ? "Administrador"
                : user.must_change_password
                  ? "Troca de senha necessária"
                  : "Consulta"}
            </p>
          )}
          {mobile && isAdmin && (
            <nav className="admin-mobile" aria-label="Gestão">
              <button onClick={() => navigate("routes")}>Mapa</button>
              {adminPages.map(([id, label]) => (
                <button key={id} onClick={() => navigate(id)}>
                  {label}
                </button>
              ))}
            </nav>
          )}

          <div className="heading">
            <div>
              <div className="eyebrow">{title[0]}</div>
              <h1>{title[1]}</h1>
              <p className="sub">{title[2]}</p>
            </div>
            <span className="prototype-pill">MAPA CONECTADO</span>
          </div>
          <div className="section-title">
            <span role="status">
              Última consulta: {lastUpdated?.toLocaleTimeString("pt-BR")} ·
              atualização a cada 15 s
            </span>
            <Button onClick={() => refresh().catch(() => {})}>
              Atualizar dados
            </Button>
          </div>
          {safePage === "routes" ? (
            <Routes />
          ) : safePage === "places" ? (
            <Places onDetail={setDetail} />
          ) : safePage === "favorites" ? (
            <Places key="favorites" favorites onDetail={setDetail} />
          ) : safePage === "access" ? (
            <Access navigate={navigate} />
          ) : safePage === "overview" ? (
            <Overview navigate={navigate} />
          ) : safePage === "manage" ? (
            <Manage openEditor={(title, data) => setEditor({ title, data })} />
          ) : safePage === "alerts" ? (
            <Alerts openEditor={(title, data) => setEditor({ title, data })} />
          ) : (
            <Users openEditor={(title, data) => setEditor({ title, data })} />
          )}
          <footer className="bottom-note">
            <span>Campus Viva © 2026 · Conecte seu caminho.</span>
            <span>Dados consultados no banco</span>
          </footer>
        </div>
      </main>
      <nav className="bottom-nav" aria-label="Navegação mobile">
        {userPages.map(([id, t, i, short]) => (
          <button
            key={id}
            onClick={() => navigate(id)}
            className={safePage === id ? "active" : ""}
            aria-current={safePage === id ? "page" : undefined}
          >
            <Icon name={i} />
            <span>{short}</span>
          </button>
        ))}
      </nav>
      {(accountOpen || user?.must_change_password) && (
        <AccountPanel onClose={() => setAccountOpen(false)} />
      )}
      {detail && (
        <Modal title={detail.name} onClose={() => setDetail(null)}>
          <p>
            {detail.category} · {detail.id}
          </p>
          <div className="place-icon" style={{ marginTop: 20 }}>
            <Icon name="pin" />
          </div>
          <p>Um ponto de interesse da comunidade universitária.</p>
          <span className="badge">Local cadastrado</span>
          <p className="sub" style={{ marginTop: 16 }}>
            As informações deste local são carregadas do cadastro do campus.
          </p>
          <button
            className="btn primary full"
            onClick={() => {
              setDetail(null);
              navigate("routes");
            }}
          >
            Abrir planejamento de rotas →
          </button>
        </Modal>
      )}
      {editor && isAdmin && (
        <Editor {...editor} onClose={() => setEditor(null)} />
      )}
    </>
  );
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <GraphProvider>
        <App />
      </GraphProvider>
    </AuthProvider>
  </React.StrictMode>,
);
