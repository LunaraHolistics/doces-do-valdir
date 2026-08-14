import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  BarChart3,
  Calendar,
  Check,
  ClipboardList,
  ChevronRight,
  HeartHandshake,
  LayoutDashboard,
  MapPin,
  Package,
  Pencil,
  Plus,
  Settings,
  ShoppingCart,
  Truck,
  Users,
  WalletCards,
  X,
  UserRound,
  Store,
  Zap,
} from "lucide-react";
import { supabase, hasSupabase } from "../lib/supabase";
import {
  useOrders,
  useProducts,
  useSettings,
  useSchedules,
  WEEKDAYS,
} from "../lib/hooks";
import {
  money,
  moneyFromCents,
  orderTotal,
  orderLabel,
  orderName,
  payLabel,
  dateBR,
  uploadToBucket,
  openWhatsApp,
  ALL_STATUSES,
  CATNAMES,
  statusIdx,
} from "../lib/helpers";
import { RP_REGIONS, ORDERED_CITIES } from "../data/rpZones";
import { Button, Header, Metric } from "../ui/components";
import { IMG } from "../data/mock";
import { triggerInstall } from "./Home";

export default function ManagerApp({
  tab,
  setTab,
  onSignOut,
}: {
  tab: string;
  setTab: (s: string) => void;
  onSignOut: () => void;
}) {
  const { orders, patch } = useOrders();
  const { prods, patchProd, insertProd } = useProducts();
  const { schedules, upsert, remove } = useSchedules();
  const [schDraft, setSchDraft] = useState<any>({
    weekday: 1,
    city: "Ribeirão Preto",
    region: "",
  });
  const { settings, saveSettings } = useSettings();
  const [edit, setEdit] = useState<any | null>(null);
  const [editPhoto, setEditPhoto] = useState<{
    file: File;
    preview: string;
  } | null>(null);
  const [form, setForm] = useState<any>(null);
  const [fStatus, setFStatus] = useState("TODOS");
  const [fUrgent, setFUrgent] = useState(false);
  const [exp, setExp] = useState<string | null>(null);
  const [expItems, setExpItems] = useState<any[]>([]);
  const [allItems, setAllItems] = useState<any[]>([]);
  const [canInstall, setCanInstall] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const isPwa = window.matchMedia("(display-mode: standalone)").matches;
    setInstalled(isPwa);
    setCanInstall(
      !isPwa && typeof (window as any).beforeinstallprompt !== "undefined",
    );
    const handler = () => setCanInstall(true);
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  useEffect(() => {
    if (settings && !form) setForm({ ...settings });
  }, [settings, form]);

  useEffect(() => {
    if (hasSupabase)
      supabase
        .from("order_items")
        .select("*")
        .then(({ data }) => setAllItems(data || []));
  }, [orders.length]);

  useEffect(() => {
    if (exp && hasSupabase)
      supabase
        .from("order_items")
        .select("*")
        .eq("order_id", exp)
        .then(({ data }) => setExpItems(data || []));
    else setExpItems([]);
  }, [exp]);

  const items = [
    { id: "dashboard", label: "Visão geral", icon: <LayoutDashboard /> },
    { id: "products", label: "Produtos", icon: <Package /> },
    { id: "stock", label: "Estoque", icon: <ClipboardList /> },
    { id: "orders", label: "Pedidos", icon: <ShoppingCart /> },
    { id: "clients", label: "Clientes", icon: <Users /> },
    { id: "reports", label: "Relatórios", icon: <BarChart3 /> },
    { id: "routes", label: "Rotas", icon: <Truck /> },
    { id: "agenda", label: "Agenda", icon: <Calendar /> },
    { id: "araraquara", label: "Araraquara", icon: <MapPin /> },
    { id: "settings", label: "Configurações", icon: <Settings /> },
  ];

  const title = items.find((i) => i.id === tab)?.label || "Dashboard";

  const totalVendas = orders.reduce((s, o) => s + orderTotal(o), 0);
  const novosCount = orders.filter((o) => o.status === "NOVO").length;
  const urgentCount = orders.filter((o) => o.urgent).length;
  const pendCount = orders.filter(
    (o) => o.status === "PENDENTE DE ENTREGA",
  ).length;
  const lowStock = prods.filter((p) => p.stock < 10).length;

  const week = (() => {
    const days = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
    const vals = [0, 0, 0, 0, 0, 0, 0];
    orders.forEach((o) => {
      const d = new Date(o.created_at || Date.now());
      vals[d.getDay()] += orderTotal(o);
    });
    const max = Math.max(...vals, 1);
    return days.map((d, i) => ({ d, h: Math.round((vals[i] / max) * 100) }));
  })();

  const prodById = (id: string) => prods.find((p) => p.id === id);
  const revenue =
    allItems.reduce((s, it) => s + (it.unit_price_cents || 0) * it.qty, 0) /
    100;
  const cost =
    allItems.reduce(
      (s, it) => s + (prodById(it.product_id)?.cost_cents || 0) * it.qty,
      0,
    ) / 100;
  const profit = revenue - cost;
  const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
  const byProd = (() => {
    const m: Record<
      string,
      { name: string; qty: number; profit: number; cat: number }
    > = {};
    allItems.forEach((it) => {
      const p = prodById(it.product_id);
      const key = it.product_name;
      m[key] = m[key] || {
        name: key,
        qty: 0,
        profit: 0,
        cat: p?.category_id || 0,
      };
      m[key].qty += it.qty;
      m[key].profit +=
        ((it.unit_price_cents - (p?.cost_cents || 0)) / 100) * it.qty;
    });
    return Object.values(m);
  })();
  const topSold = [...byProd].sort((a, b) => b.qty - a.qty).slice(0, 5);
  const topProfit = [...byProd].sort((a, b) => b.profit - a.profit).slice(0, 5);
  const byCat = (() => {
    const m: Record<number, number> = {};
    byProd.forEach((b) => {
      m[b.cat] = (m[b.cat] || 0) + b.profit + 0;
    });
    return m;
  })();

  const clients = (() => {
    const m: Record<string, any> = {};
    orders.forEach((o) => {
      const key = `${o.customer_name}|${o.customer_phone || ""}`;
      m[key] = m[key] || {
        name: o.customer_name,
        phone: o.customer_phone || "",
        count: 0,
        total: 0,
        last: o.created_at,
      };
      m[key].count++;
      m[key].total += orderTotal(o);
      if ((o.created_at || "") > (m[key].last || ""))
        m[key].last = o.created_at;
    });
    return Object.values(m).sort((a, b) => b.total - a.total);
  })();

  const filteredOrders = orders.filter(
    (o) =>
      (fStatus === "TODOS" || o.status === fStatus) && (!fUrgent || o.urgent),
  );

  const ready = orders.filter(
    (o) => o.status === "PRONTO PARA ROTA" && o.city !== "Araraquara",
  );
  const regions = [
    ...new Set(ready.map((o) => o.region || "Centro")),
  ] as string[];
  const pendentes = orders.filter((o) => o.status === "PENDENTE DE ENTREGA");
  const araraquara = orders.filter(
    (o) => o.city === "Araraquara" || o.delivery_mode === "ENCOMENDA",
  );

  const uploadPhoto = async (
    photo: { file: File; preview: string } | null,
    prefix: string,
  ) => {
    if (!photo) return null;
    try {
      return await uploadToBucket(
        "product-photos",
        `${prefix}-${Date.now()}.jpg`,
        photo.file,
      );
    } catch {
      toast.error("Falha no upload da foto.");
      return null;
    }
  };

  const saveEdit = async () => {
    const uploaded = await uploadPhoto(
      editPhoto,
      edit.isNew ? "prod" : `prod-${edit.id}`,
    );
    const payload = {
      name: edit.name,
      description: edit.description || "",
      price_cents: Math.round(parseFloat(edit.price || "0") * 100),
      cost_cents: Math.round(parseFloat(edit.cost || "0") * 100),
      stock: parseInt(edit.stock || "0", 10),
      image_url: uploaded || edit.image_url,
      category_id: parseInt(edit.category_id || "1", 10),
      active: edit.active !== false,
    };
    if (edit.isNew) {
      await insertProd(payload);
      toast.success("Produto criado");
    } else {
      await patchProd(edit.id, payload);
      toast.success("Produto atualizado");
    }
    setEdit(null);
    setEditPhoto(null);
  };

  return (
    <div className="app-shell manager">
      <Header
        title={title}
        subtitle="Painel gestor"
        onLogo={() => setTab("dashboard")}
      />
      <main className="page manager-page">
        {tab === "dashboard" && (
          <>
            <div className="manager-welcome">
              <div>
                <span>
                  {new Date().toLocaleDateString("pt-BR", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}
                </span>
                <h1>Bom dia, gestor.</h1>
              </div>
              <div className="avatar orange">V</div>
            </div>
            {canInstall && !installed && (
              <Button
                variant="soft"
                onClick={async () => {
                  const ok = await triggerInstall();
                  if (ok) {
                    toast.success(
                      "App instalado! Agora você pode abrir como app nativo.",
                    );
                    setInstalled(true);
                    setCanInstall(false);
                  }
                }}
                style={{ marginBottom: 14 }}
              >
                <Zap size={16} /> Instalar painel como app
              </Button>
            )}
            {installed && (
              <div
                style={{
                  background: "#e2f0e7",
                  padding: "10px 14px",
                  borderRadius: 10,
                  fontSize: 12,
                  color: "#235842",
                  marginBottom: 14,
                }}
              >
                ✓ App instalado e pronto para uso offline.
              </div>
            )}
            <div className="metric-grid">
              <Metric
                label="Vendas (pedidos)"
                value={money(totalVendas)}
                trend={`${orders.length} pedidos`}
              />
              <Metric
                label="Pedidos novos"
                value={String(novosCount)}
                trend={`${urgentCount} urgentes`}
              />
              <Metric
                label="Lucro (itens)"
                value={money(profit)}
                trend={`${margin.toFixed(1)}% margem`}
              />
              <Metric
                label="Estoque baixo"
                value={String(lowStock)}
                trend="ver produtos"
                alert={lowStock > 0}
              />
            </div>
            <div className="dashboard-card">
              <div className="section-head">
                <h2>Vendas por semana</h2>
                <span className="muted">por dia</span>
              </div>
              <div className="bars">
                {week.map((w, i) => (
                  <i key={i} style={{ height: `${Math.max(w.h, 6)}%` }} />
                ))}
              </div>
              <div className="days">
                {week.map((w) => (
                  <span key={w.d}>{w.d}</span>
                ))}
              </div>
            </div>
            <div className="split-cards">
              <div>
                <X />
                <b>{urgentCount} urgentes</b>
                <span>pedidos para olhar</span>
              </div>
              <div>
                <Truck />
                <b>{pendCount} pendência(s)</b>
                <span>de entrega</span>
              </div>
            </div>
          </>
        )}

        {tab === "products" && (
          <>
            <div className="list-head">
              <div>
                <span className="eyebrow">gestão</span>
                <h1>Produtos</h1>
                <p>{prods.filter((p) => p.active !== false).length} ativos</p>
              </div>
              <Button
                onClick={() => {
                  setEdit({
                    isNew: true,
                    name: "",
                    description: "",
                    price: "",
                    cost: "",
                    stock: "0",
                    image_url: IMG.doces,
                    category_id: 1,
                    active: true,
                  });
                  setEditPhoto(null);
                }}
              >
                <Plus size={16} /> Novo produto
              </Button>
            </div>
            <div className="manager-list">
              {prods.map((p) => (
                <div className="manager-row" key={p.id}>
                  <div className="mini-avatar">{p.name[0]}</div>
                  <div>
                    <b>
                      {p.name}
                      {p.active === false ? " (inativo)" : ""}
                    </b>
                    <span>
                      {p.stock} un · {CATNAMES[p.category_id] || "Outros"}
                    </span>
                  </div>
                  <strong>{moneyFromCents(p.price_cents)}</strong>
                  <button
                    className="icon-btn"
                    style={{ width: 32, height: 32 }}
                    onClick={() => {
                      setEdit({
                        ...p,
                        price: (p.price_cents / 100).toFixed(2),
                        cost: (p.cost_cents / 100).toFixed(2),
                        stock: String(p.stock),
                      });
                      setEditPhoto(null);
                    }}
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    className="icon-btn"
                    style={{ width: 32, height: 32, color: "#bd463b" }}
                    onClick={() => {
                      if (window.confirm(`Desativar ${p.name}?`)) {
                        patchProd(p.id, { active: false });
                        toast.success("Desativado");
                      }
                    }}
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
            {edit && (
              <div className="settings-card" style={{ marginTop: 14 }}>
                <span className="eyebrow">
                  {edit.isNew ? "novo produto" : "editar produto"}
                </span>
                <div className="crop-preview">
                  <img src={editPhoto?.preview || edit.image_url} />
                  <span>foto atual / nova foto</span>
                </div>
                <div className="proof-pickers">
                  <label>
                    <CameraIcon
                      onPick={(f, p) => setEditPhoto({ file: f, preview: p })}
                    />
                  </label>
                </div>
                <label>
                  Nome
                  <input
                    value={edit.name}
                    onChange={(e) => setEdit({ ...edit, name: e.target.value })}
                  />
                </label>
                <label>
                  Descrição
                  <input
                    value={edit.description}
                    onChange={(e) =>
                      setEdit({ ...edit, description: e.target.value })
                    }
                  />
                </label>
                <div className="two-cols">
                  <label>
                    Preço (R$)
                    <input
                      value={edit.price}
                      onChange={(e) =>
                        setEdit({ ...edit, price: e.target.value })
                      }
                    />
                  </label>
                  <label>
                    Custo (R$)
                    <input
                      value={edit.cost}
                      onChange={(e) =>
                        setEdit({ ...edit, cost: e.target.value })
                      }
                    />
                  </label>
                </div>
                <div className="two-cols">
                  <label>
                    Estoque
                    <input
                      value={edit.stock}
                      onChange={(e) =>
                        setEdit({ ...edit, stock: e.target.value })
                      }
                    />
                  </label>
                  <label>
                    Categoria
                    <select
                      value={edit.category_id}
                      onChange={(e) =>
                        setEdit({ ...edit, category_id: e.target.value })
                      }
                    >
                      {[1, 2, 3, 4].map((i) => (
                        <option key={i} value={i}>
                          {CATNAMES[i]}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <label
                  style={{ display: "flex", alignItems: "center", gap: 8 }}
                >
                  <input
                    type="checkbox"
                    style={{ width: "auto", height: "auto" }}
                    checked={edit.active !== false}
                    onChange={(e) =>
                      setEdit({ ...edit, active: e.target.checked })
                    }
                  />
                  Ativo no catálogo
                </label>
                <Button onClick={saveEdit}>
                  Salvar <Check size={16} />
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setEdit(null);
                    setEditPhoto(null);
                  }}
                >
                  Cancelar
                </Button>
              </div>
            )}
          </>
        )}

        {tab === "stock" && (
          <div className="manager-list">
            {prods
              .filter((p) => p.active !== false)
              .map((p) => (
                <div className="manager-row" key={p.id}>
                  <div className="mini-avatar">{p.name[0]}</div>
                  <div>
                    <b>{p.name}</b>
                    <span>mínimo 10 unidades</span>
                  </div>
                  <strong className={p.stock < 10 ? "red" : ""}>
                    {p.stock} un.
                  </strong>
                  <button
                    className="icon-btn"
                    style={{ width: 32, height: 32 }}
                    onClick={() =>
                      patchProd(p.id, { stock: Math.max(0, p.stock - 1) })
                    }
                  >
                    −
                  </button>
                  <button
                    className="icon-btn"
                    style={{ width: 32, height: 32 }}
                    onClick={() => patchProd(p.id, { stock: p.stock + 1 })}
                  >
                    +
                  </button>
                </div>
              ))}
          </div>
        )}

        {tab === "orders" && (
          <>
            <div className="list-head">
              <div>
                <span className="eyebrow">gestão</span>
                <h1>Pedidos</h1>
                <p>
                  {filteredOrders.length} de {orders.length}
                </p>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <select
                  style={{ height: 38, fontSize: 12 }}
                  value={fStatus}
                  onChange={(e) => setFStatus(e.target.value)}
                >
                  <option value="TODOS">Todos status</option>
                  {ALL_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <button
                  className={`btn ${fUrgent ? "btn-primary" : "btn-soft"}`}
                  style={{
                    width: "auto",
                    minHeight: 38,
                    padding: "0 10px",
                    fontSize: 11,
                  }}
                  onClick={() => setFUrgent((v) => !v)}
                >
                  🚨
                </button>
              </div>
            </div>
            <div className="manager-list">
              {filteredOrders.map((o) => (
                <div key={o.id}>
                  <div className="manager-row">
                    <div className="mini-avatar">{orderName(o)[0]}</div>
                    <div
                      onClick={() => setExp(exp === o.id ? null : o.id)}
                      style={{ cursor: "pointer" }}
                    >
                      <b>
                        {orderLabel(o)} · {orderName(o)}
                        {o.urgent ? " 🚨" : ""}
                      </b>
                      <span>
                        {o.city} · {payLabel(o)} · {money(orderTotal(o))}
                      </span>
                    </div>
                    <select
                      style={{ height: 34, fontSize: 11, width: 160 }}
                      value={o.status}
                      onChange={(e) => {
                        patch(o.id, { status: e.target.value });
                        toast.success(`Status → ${e.target.value}`);
                      }}
                    >
                      {ALL_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                  {exp === o.id && (
                    <div
                      className="settings-card"
                      style={{ margin: "6px 0 10px" }}
                    >
                      <span className="eyebrow">itens do pedido</span>
                      {expItems.length === 0 && (
                        <p className="muted">Sem itens detalhados.</p>
                      )}
                      {expItems.map((it) => (
                        <p
                          key={it.id}
                          style={{ fontSize: 12, margin: "4px 0" }}
                        >
                          {it.qty}x {it.product_name} —{" "}
                          {moneyFromCents(it.unit_price_cents * it.qty)}
                        </p>
                      ))}
                      {o.proof_url && (
                        <div className="proof-preview">
                          <img src={o.proof_url} />
                          <span>comprovante do cliente</span>
                        </div>
                      )}
                      <p className="muted">{o.address_text}</p>
                      <Button
                        variant="whatsapp"
                        onClick={() => {
                          const msg = `Olá, ${orderName(o)}! Sobre o pedido ${orderLabel(o)}.`;
                          if (!openWhatsApp(o.customer_phone, msg))
                            toast.success("Sem telefone", { description: msg });
                        }}
                      >
                        <HeartHandshake size={16} /> Falar com cliente
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {tab === "clients" && (
          <div className="manager-list">
            {clients.length === 0 && (
              <p className="muted">Sem clientes ainda.</p>
            )}
            {clients.map((c: any, i: number) => (
              <div className="manager-row" key={i}>
                <div className="mini-avatar">{(c.name || "C")[0]}</div>
                <div>
                  <b>{c.name}</b>
                  <span>
                    {c.phone || "sem telefone"} · {c.count} pedido(s) · último{" "}
                    {dateBR(c.last)}
                  </span>
                </div>
                <strong>{money(c.total)}</strong>
              </div>
            ))}
          </div>
        )}

        {tab === "reports" && (
          <>
            <div className="report-big">
              <span>Faturamento (itens)</span>
              <b>{money(revenue)}</b>
              <small>
                Custo {money(cost)} · Lucro {money(profit)} · Margem{" "}
                {margin.toFixed(1)}%
              </small>
            </div>
            <Button
              variant="soft"
              onClick={() => window.print()}
              style={{ marginTop: 12 }}
            >
              Exportar PDF <BarChart3 size={16} />
            </Button>
            <p className="muted">
              Na janela de impressão, escolha "Salvar como PDF".
            </p>
            <div className="report-card">
              <b>Mais vendidos (qtd)</b>
              {topSold.map((t) => (
                <span key={t.name}>
                  {t.name} <strong>{t.qty}x</strong>
                </span>
              ))}
            </div>
            <div className="report-card">
              <b>Mais lucrativos (R$)</b>
              {topProfit.map((t) => (
                <span key={t.name}>
                  {t.name} <strong>{money(t.profit)}</strong>
                </span>
              ))}
            </div>
            <div className="report-card">
              <b>Lucro por categoria</b>
              {Object.entries(byCat).map(([cat, v]) => (
                <span key={cat}>
                  {CATNAMES[Number(cat)] || "Outros"}{" "}
                  <strong>{money(v)}</strong>
                </span>
              ))}
            </div>
          </>
        )}

        {tab === "routes" && (
          <>
            {regions.map((r) => (
              <div className="route-card" key={r} style={{ marginBottom: 10 }}>
                <div className="route-title">
                  <Truck />
                  <div>
                    <b>Rota {r}</b>
                    <span>
                      {ready.filter((o) => (o.region || "Centro") === r).length}{" "}
                      prontos
                    </span>
                  </div>
                  <span className="status-pill green">aguardando Valdir</span>
                </div>
              </div>
            ))}
            {pendentes.map((o) => (
              <div className="pending-card" key={o.id}>
                <span className="urgent-label">PENDENTE</span>
                <b>
                  {orderName(o)} · {orderLabel(o)}
                </b>
                <span>{o.notes || ""}</span>
              </div>
            ))}
          </>
        )}

        {tab === "agenda" && (
          <>
            <div className="list-head">
              <div>
                <span className="eyebrow">rotas semanais</span>
                <h1>Agenda do Valdir</h1>
                <p>Dias em que o Valdir atende cada cidade/região.</p>
              </div>
            </div>

            <div className="settings-card" style={{ marginBottom: 16 }}>
              <span className="eyebrow">adicionar rota</span>
              <div className="two-cols">
                <label>
                  Dia da semana
                  <select
                    value={schDraft.weekday}
                    onChange={(e) =>
                      setSchDraft({
                        ...schDraft,
                        weekday: parseInt(e.target.value),
                      })
                    }
                  >
                    {WEEKDAYS.map((d, i) => (
                      <option key={i} value={i}>
                        {d}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Cidade
                  <select
                    value={schDraft.city}
                    onChange={(e) =>
                      setSchDraft({ ...schDraft, city: e.target.value, region: "" })
                    }
                  >
                    <option>Ribeirão Preto</option>
                    {ORDERED_CITIES.filter((c) => c !== "Araraquara").map(
                      (c) => (
                        <option key={c}>{c}</option>
                      ),
                    )}
                  </select>
                </label>
              </div>
              {schDraft.city === "Ribeirão Preto" && (
                <label>
                  Zona (opcional — deixe vazio para atender RP inteira)
                  <select
                    value={schDraft.region}
                    onChange={(e) =>
                      setSchDraft({ ...schDraft, region: e.target.value })
                    }
                  >
                    <option value="">Toda Ribeirão Preto</option>
                    {RP_REGIONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              {schDraft.city !== "Ribeirão Preto" && (
                <p className="muted">
                  Cidade inteira — o Valdir passa o dia todo por lá.
                </p>
              )}
              <Button
                onClick={async () => {
                  await upsert({
                    weekday: schDraft.weekday,
                    city: schDraft.city,
                    region: schDraft.region || null,
                  });
                  toast.success("Rota adicionada");
                }}
              >
                <Plus size={16} /> Adicionar à agenda
              </Button>
            </div>

            <div className="list-head">
              <h2 style={{ fontSize: 20 }}>Rotas cadastradas</h2>
            </div>
            {schedules.length === 0 && (
              <p className="muted">Nenhuma rota cadastrada ainda.</p>
            )}
            <div className="manager-list">
              {schedules
                .sort(
                  (a, b) => a.weekday - b.weekday || a.city.localeCompare(b.city),
                )
                .map((s) => (
                  <div className="manager-row" key={s.id}>
                    <div
                      className="mini-avatar"
                      style={{ background: "#e2f0e7", color: "#235842" }}
                    >
                      {WEEKDAYS[s.weekday][0]}
                    </div>
                    <div>
                      <b>{WEEKDAYS[s.weekday]}</b>
                      <span>
                        {s.city}
                        {s.city === "Ribeirão Preto" && s.region
                          ? ` · ${s.region}`
                          : ""}
                        {s.city === "Ribeirão Preto" && !s.region
                          ? " (cidade inteira)"
                          : ""}
                      </span>
                    </div>
                    <button
                      className="icon-btn"
                      style={{ width: 32, height: 32, color: "#bd463b" }}
                      onClick={async () => {
                        if (
                          window.confirm(
                            `Remover ${WEEKDAYS[s.weekday]} — ${s.city}?`,
                          )
                        ) {
                          await remove(s.id);
                          toast.success("Rota removida");
                        }
                      }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
            </div>

            <div className="notice" style={{ marginTop: 20 }}>
              <MapPin />
              <b>Araraquara é encomenda fixa</b>
              <span>
                Atendida fora da agenda do Valdir — a data é controlada em
                Configurações.
              </span>
            </div>
          </>
        )}

        {tab === "araraquara" && (
          <div className="settings-card">
            <span className="eyebrow">encomendas</span>
            <h1>Araraquara</h1>
            <div className="date-box">
              <MapPin />
              <b>{dateBR(settings?.araraquara_next_date) || "15/08/2026"}</b>
              <span>próxima encomenda</span>
            </div>
            {araraquara.map((o) => (
              <div
                className="manager-row"
                key={o.id}
                style={{ marginBottom: 6 }}
              >
                <div className="mini-avatar">{orderName(o)[0]}</div>
                <div>
                  <b>{orderName(o)}</b>
                  <span>
                    {orderLabel(o)} · {payLabel(o)}
                  </span>
                </div>
                <strong>{money(orderTotal(o))}</strong>
              </div>
            ))}
            {araraquara.length === 0 && (
              <p className="muted">Nenhuma encomenda aberta.</p>
            )}
            <Button onClick={() => setTab("settings")}>
              Alterar data <Pencil size={16} />
            </Button>
          </div>
        )}

        {tab === "settings" && form && (
          <div className="settings-card">
            <span className="eyebrow">administração</span>
            <h1>Configurações</h1>
            <label>
              Chave PIX
              <input
                value={form.pix_key || ""}
                onChange={(e) => setForm({ ...form, pix_key: e.target.value })}
              />
            </label>
            <label>
              Nome do titular
              <input
                value={form.pix_holder || ""}
                onChange={(e) =>
                  setForm({ ...form, pix_holder: e.target.value })
                }
              />
            </label>
            <label>
              WhatsApp do Valdir (com DDD)
              <input
                value={form.whatsapp_number || ""}
                onChange={(e) =>
                  setForm({ ...form, whatsapp_number: e.target.value })
                }
                placeholder="16 99999-9999"
              />
            </label>
            <label>
              Endereço de retirada
              <input
                value={form.pickup_address || ""}
                onChange={(e) =>
                  setForm({ ...form, pickup_address: e.target.value })
                }
              />
            </label>
            <div className="two-cols">
              <label>
                Entrada PIX (0–1)
                <input
                  type="number"
                  step="0.05"
                  min="0"
                  max="1"
                  value={form.entry_pct_pix ?? 0.5}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      entry_pct_pix: parseFloat(e.target.value),
                    })
                  }
                />
              </label>
              <label>
                Entrada cartão (0–1)
                <input
                  type="number"
                  step="0.05"
                  min="0"
                  max="1"
                  value={form.entry_pct_card ?? 0.5}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      entry_pct_card: parseFloat(e.target.value),
                    })
                  }
                />
              </label>
            </div>
            <label>
              Regra do dinheiro
              <select
                value={form.cash_rule || "TOTAL_NA_ENTREGA"}
                onChange={(e) =>
                  setForm({ ...form, cash_rule: e.target.value })
                }
              >
                <option value="TOTAL_NA_ENTREGA">
                  Total na entrega/retirada
                </option>
                <option value="ENTRADA_50">Exigir entrada de 50%</option>
              </select>
            </label>
            <label>
              Próxima data Araraquara
              <input
                type="date"
                value={form.araraquara_next_date || ""}
                onChange={(e) =>
                  setForm({ ...form, araraquara_next_date: e.target.value })
                }
              />
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="checkbox"
                style={{ width: "auto", height: "auto" }}
                checked={form.pickup_enabled !== false}
                onChange={(e) =>
                  setForm({ ...form, pickup_enabled: e.target.checked })
                }
              />
              Retirada habilitada
            </label>
            <Button
              onClick={async () => {
                await saveSettings(form);
                toast.success("Configurações salvas");
              }}
            >
              Salvar configurações <Check size={16} />
            </Button>
          </div>
        )}

        {/* Relatório imprimível (Exportar PDF) */}
        <div id="print-report">
          <h1>Amado Armazém — Relatório</h1>
          <p>
            Gerado em {new Date().toLocaleDateString("pt-BR")} · todos os
            pedidos
          </p>
          <h2>Vendas</h2>
          <p>
            Pedidos: {orders.length} · Faturamento: {money(totalVendas)} ·
            Lucro: {money(profit)} · Margem: {margin.toFixed(1)}%
          </p>
          <h2>Mais vendidos</h2>
          <table>
            <thead>
              <tr>
                <th>Produto</th>
                <th>Qtd</th>
                <th>Lucro</th>
              </tr>
            </thead>
            <tbody>
              {topSold.map((t) => (
                <tr key={t.name}>
                  <td>{t.name}</td>
                  <td>{t.qty}</td>
                  <td>{money(t.profit)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <h2>Estoque baixo (&lt; 10 un.)</h2>
          <table>
            <thead>
              <tr>
                <th>Produto</th>
                <th>Estoque</th>
              </tr>
            </thead>
            <tbody>
              {prods
                .filter((p) => p.stock < 10 && p.active !== false)
                .map((p) => (
                  <tr key={p.id}>
                    <td>{p.name}</td>
                    <td>{p.stock}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </main>
      <nav className="manager-nav">
        {items.map((i) => (
          <button
            key={i.id}
            className={tab === i.id ? "active" : ""}
            onClick={() => setTab(i.id)}
          >
            {i.icon}
            <span>{i.label}</span>
          </button>
        ))}
        <button onClick={onSignOut}>
          <X />
          <span>Sair</span>
        </button>
      </nav>
    </div>
  );
}

function CameraIcon({
  onPick,
}: {
  onPick: (f: File, preview: string) => void;
}) {
  return (
    <>
      <input
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: "none" }}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          const r = new FileReader();
          r.onload = () => onPick(f, String(r.result));
          r.readAsDataURL(f);
        }}
      />
      <span style={{ fontSize: 12 }}>📷 tirar foto / galeria</span>
    </>
  );
}