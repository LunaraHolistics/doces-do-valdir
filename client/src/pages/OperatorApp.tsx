import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Check, ClipboardList, HeartHandshake, Home as HomeIcon, Package, Pencil, Plus,
  Truck, X, Zap, ArrowLeft
} from "lucide-react";
import { hasSupabase } from "../lib/supabase";
import { useOrders, useProducts } from "../lib/hooks";
import {
  money, moneyFromCents, orderTotal, orderEntry, orderBalance, orderLabel, orderName,
  statusIdx, payLabel, uploadToBucket, openWhatsApp, REASONS, STATUS_SEQ, CATNAMES
} from "../lib/helpers";
import { Button, Header, BottomNav, PhotoPicker } from "../ui/components";
import { IMG } from "../data/mock";
import { triggerInstall } from "./Home";

export default function OperatorApp({ screen, setScreen, onExit, onSignOut }: {
  screen: string; setScreen: (s: string) => void; onExit: () => void; onSignOut: () => void;
}) {
  const { orders, patch } = useOrders();
  const { prods, patchProd, insertProd } = useProducts();
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [editP, setEditP] = useState<any | null>(null);
  const [editPhoto, setEditPhoto] = useState<{ file: File; preview: string } | null>(null);
  const [npPhoto, setNpPhoto] = useState<{ file: File; preview: string } | null>(null);
  const [np, setNp] = useState<any>({ name: "", description: "", price: "", cost: "", stock: "0", category_id: 1, image_url: IMG.doces });

  // PWA
  const [canInstall, setCanInstall] = useState(false);
  const [installed, setInstalled] = useState(false);

  // rotas reais
  const [routeRegion, setRouteRegion] = useState<string | null>(null);
  const [stage, setStage] = useState<"list" | "ask" | "pending" | "done">("list");
  const [pend, setPend] = useState<Record<string, boolean>>({});
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [doneSummary, setDoneSummary] = useState("");

  useEffect(() => {
    const isPwa = window.matchMedia("(display-mode: standalone)").matches;
    setInstalled(isPwa);
    setCanInstall(!isPwa && typeof (window as any).beforeinstallprompt !== "undefined");
    const handler = () => setCanInstall(true);
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const opNav = [
    { id: "home", label: "Início", icon: <HomeIcon size={19} /> },
    { id: "orders", label: "Pedidos", icon: <ClipboardList size={19} /> },
    { id: "routes", label: "Entregas", icon: <Truck size={19} /> }
  ];

  const novos = orders.filter(o => o.status === "NOVO").length;
  const andamento = orders.filter(o => ["CONFIRMADO", "AGUARDANDO PAGAMENTO", "SEPARANDO"].includes(o.status)).length;
  const urgentCount = orders.filter(o => o.urgent).length;

  const ready = orders.filter(o => o.status === "PRONTO PARA ROTA" && o.city !== "Araraquara");
  const regions = [...new Set(ready.map(o => o.region || "Centro"))] as string[];
  const regionOrders = (r: string) => ready.filter(o => (o.region || "Centro") === r);
  const pendentes = orders.filter(o => o.status === "PENDENTE DE ENTREGA");

  const finishYes = async (r: string) => {
    for (const o of regionOrders(r)) await patch(o.id, { status: "CONCLUÍDO" });
    setDoneSummary(`Rota ${r} finalizada. Todos os pedidos concluídos.`);
    setStage("done");
    toast.success("Rota finalizada em lote");
  };

  const finishNo = async (r: string) => {
    let pCount = 0;
    for (const o of regionOrders(r)) {
      if (pend[o.id]) {
        pCount++;
        await patch(o.id, { status: "PENDENTE DE ENTREGA", notes: reasons[o.id] || REASONS[0] });
      } else {
        await patch(o.id, { status: "CONCLUÍDO" });
      }
    }
    setDoneSummary(`Rota ${r} finalizada. ${regionOrders(r).length - pCount} concluídos, ${pCount} pendentes.`);
    setStage("done");
    toast.success("Rota finalizada em lote");
  };

  const uploadPhoto = async (photo: { file: File; preview: string } | null, prefix: string) => {
    if (!photo) return null;
    try {
      return await uploadToBucket("product-photos", `${prefix}-${Date.now()}.jpg`, photo.file);
    } catch (e) {
      toast.error("Não consegui enviar a foto; usando imagem padrão.");
      return null;
    }
  };

  const saveNewProduct = async () => {
    if (!np.name) { toast.error("Dê um nome para o produto."); return; }
    const uploaded = await uploadPhoto(npPhoto, "prod");
    await insertProd({
      name: np.name, description: np.description || "",
      price_cents: Math.round(parseFloat(np.price || "0") * 100),
      cost_cents: Math.round(parseFloat(np.cost || "0") * 100),
      stock: parseInt(np.stock || "0", 10),
      category_id: Number(np.category_id),
      image_url: uploaded || np.image_url, active: true
    });
    toast.success("Produto cadastrado na loja!");
    setNp({ name: "", description: "", price: "", cost: "", stock: "0", category_id: 1, image_url: IMG.doces });
    setNpPhoto(null);
    setScreen("products");
  };

  const saveEditProduct = async () => {
    const uploaded = await uploadPhoto(editPhoto, `prod-${editP.id}`);
    await patchProd(editP.id, {
      name: editP.name, description: editP.description || "",
      price_cents: Math.round(parseFloat(editP.price || "0") * 100),
      cost_cents: Math.round(parseFloat(editP.cost || "0") * 100),
      stock: parseInt(editP.stock || "0", 10),
      category_id: Number(editP.category_id),
      image_url: uploaded || editP.image_url
    });
    toast.success("Produto atualizado!");
    setEditP(null); setEditPhoto(null);
  };

  if (screen === "product") {
    return (
      <div className="app-shell operator">
        <Header title="Novo produto" back onBack={() => setScreen("home")} onLogo={() => setScreen("home")} />
        <main className="page">
          <span className="eyebrow">cadastro rápido</span>
          <h1>Vamos colocar um produto na loja?</h1>
          {npPhoto ? (
            <div className="crop-preview"><img src={npPhoto.preview} /><span>enquadramento automático</span></div>
          ) : (
            <div className="photo-capture"><Plus size={30} /><b>Tirar foto</b><span>ou escolher da galeria</span></div>
          )}
          <PhotoPicker onPick={(f, p) => setNpPhoto({ file: f, preview: p })} />
          {npPhoto && <button className="link-btn" style={{ margin: "8px 0" }} onClick={() => setNpPhoto(null)}>remover foto</button>}
          <label>Nome do produto<input value={np.name} onChange={e => setNp({ ...np, name: e.target.value })} placeholder="Ex.: Doce de leite" /></label>
          <label>Descrição curta<input value={np.description} onChange={e => setNp({ ...np, description: e.target.value })} placeholder="Ex.: Pote 400g" /></label>
          <div className="two-cols">
            <label>Preço de venda (R$)<input value={np.price} onChange={e => setNp({ ...np, price: e.target.value })} placeholder="0,00" /></label>
            <label>Valor de custo (R$)<input value={np.cost} onChange={e => setNp({ ...np, cost: e.target.value })} placeholder="0,00" /></label>
          </div>
          <div className="two-cols">
            <label>Quantidade<input value={np.stock} onChange={e => setNp({ ...np, stock: e.target.value })} placeholder="0" /></label>
            <label>Categoria
              <select value={np.category_id} onChange={e => setNp({ ...np, category_id: e.target.value })}>
                {[1, 2, 3, 4].map(i => <option key={i} value={i}>{CATNAMES[i]}</option>)}
              </select>
            </label>
          </div>
          {!npPhoto && (
            <label>Imagem da prateleira
              <select value={np.image_url} onChange={e => setNp({ ...np, image_url: e.target.value })}>
                <option value={IMG.doces}>Doces</option><option value={IMG.balas}>Balas</option>
                <option value={IMG.lanches}>Lanches</option><option value={IMG.utilidades}>Utilidades</option>
              </select>
            </label>
          )}
          <Button onClick={saveNewProduct}>Salvar produto <Check size={17} /></Button>
        </main>
      </div>
    );
  }

  if (screen === "products") {
    return (
      <div className="app-shell operator">
        <Header title="Meus produtos" subtitle={`${prods.filter(p => p.active !== false).length} na loja`} back onBack={() => setScreen("home")} onLogo={() => setScreen("home")} />
        <main className="page">
          <div className="manager-list">
            {prods.filter(p => p.active !== false).map(p => (
              <div className="manager-row" key={p.id}>
                <div className="mini-avatar">{p.name[0]}</div>
                <div><b>{p.name}</b><span>{moneyFromCents(p.price_cents)} · {p.stock} un.</span></div>
                <button className="icon-btn" style={{ width: 32, height: 32 }} onClick={() => patchProd(p.id, { stock: Math.max(0, p.stock - 1) })}>−</button>
                <button className="icon-btn" style={{ width: 32, height: 32 }} onClick={() => patchProd(p.id, { stock: p.stock + 1 })}>+</button>
                <button className="icon-btn" style={{ width: 32, height: 32 }} onClick={() => {
                  setEditP({ ...p, price: (p.price_cents / 100).toFixed(2), cost: (p.cost_cents / 100).toFixed(2), stock: String(p.stock) });
                  setEditPhoto(null);
                }}><Pencil size={14} /></button>
              </div>
            ))}
          </div>
          {editP && (
            <div className="settings-card" style={{ marginTop: 14 }}>
              <span className="eyebrow">corrigir produto</span>
              <div className="crop-preview"><img src={editPhoto?.preview || editP.image_url} /><span>foto atual / nova foto</span></div>
              <PhotoPicker onPick={(f, p) => setEditPhoto({ file: f, preview: p })} />
              <label>Nome<input value={editP.name} onChange={e => setEditP({ ...editP, name: e.target.value })} /></label>
              <label>Descrição<input value={editP.description} onChange={e => setEditP({ ...editP, description: e.target.value })} /></label>
              <div className="two-cols">
                <label>Preço (R$)<input value={editP.price} onChange={e => setEditP({ ...editP, price: e.target.value })} /></label>
                <label>Custo (R$)<input value={editP.cost} onChange={e => setEditP({ ...editP, cost: e.target.value })} /></label>
              </div>
              <div className="two-cols">
                <label>Quantidade<input value={editP.stock} onChange={e => setEditP({ ...editP, stock: e.target.value })} /></label>
                <label>Categoria
                  <select value={editP.category_id} onChange={e => setEditP({ ...editP, category_id: e.target.value })}>
                    {[1, 2, 3, 4].map(i => <option key={i} value={i}>{CATNAMES[i]}</option>)}
                  </select>
                </label>
              </div>
              <Button onClick={saveEditProduct}>Salvar <Check size={16} /></Button>
              <Button variant="ghost" onClick={() => { setEditP(null); setEditPhoto(null); }}>Cancelar</Button>
            </div>
          )}
          <Button variant="soft" onClick={() => setScreen("product")}><Plus size={16} /> Novo produto</Button>
        </main>
        <BottomNav items={opNav} active="home" onSelect={setScreen} />
      </div>
    );
  }

  if (screen === "orders") {
    return (
      <div className="app-shell operator">
        <Header title="Pedidos do dia" subtitle="Tudo em um só lugar" back onBack={() => setScreen("home")} onLogo={() => setScreen("home")} />
        <main className="page">
          <div className="urgent-banner"><Zap /><div><b>{urgentCount} pedidos urgentes</b><span>Olhe primeiro para eles</span></div></div>
          <div className="status-tabs">
            <b>NOVOS <i>{novos}</i></b>
            <span>EM ANDAMENTO <i>{andamento}</i></span>
            <span>PRONTOS <i>{orders.filter(o => o.status === "PRONTO PARA ROTA").length}</i></span>
          </div>
          {orders.slice(0, 10).map(o => (
            <div key={o.id} className={`op-order ${o.urgent ? "urgent-order" : ""}`} onClick={() => { setSelectedOrder(o); setScreen("order"); }}>
              {o.urgent && <span className="urgent-label">🚨 URGENTE</span>}
              <div><b>{orderName(o)}</b><span>{orderLabel(o)} · {o.region}</span></div>
              <div><strong>{money(orderTotal(o))}</strong><span className="status-pill">{o.status}</span></div>
            </div>
          ))}
        </main>
        <BottomNav items={opNav} active="orders" onSelect={setScreen} />
      </div>
    );
  }

  if (screen === "order" && selectedOrder) {
    const o = selectedOrder;
    const idx = Math.max(0, statusIdx(o.status));
    return (
      <div className="app-shell operator">
        <Header title={orderLabel(o)} back onBack={() => setScreen("orders")} onLogo={() => setScreen("home")} />
        <main className="page">
          <div className="op-detail-head">
            {o.urgent && <span className="urgent-label">🚨 PEDIDO URGENTE</span>}
            {o.status === "PENDENTE DE ENTREGA" && <span className="urgent-label">PENDENTE DE ENTREGA{o.notes ? ` — ${o.notes}` : ""}</span>}
            <h1>{orderName(o)}</h1>
            <span>{o.city} · {o.region}{o.address_text ? ` · ${o.address_text}` : ""}</span>
          </div>
          <div className="summary">
            <span>Total</span><b>{money(orderTotal(o))}</b>
            <span>Entrada</span><b>{money(orderEntry(o))}</b>
            <span>Saldo</span><b>{money(orderBalance(o))}</b>
            <span>Pagamento</span><b>{payLabel(o)}</b>
          </div>
          {o.proof_url && (
            <div className="proof-preview">
              <img src={o.proof_url} />
              <span>Comprovante enviado pelo cliente</span>
            </div>
          )}
          <div className="timeline">
            <b>Fluxo do pedido</b>
            {STATUS_SEQ.map((s, i) => (
              <div className={i < idx ? "done" : i === idx ? "current" : ""} key={s}>
                <i>{i < idx ? <Check size={13} /> : i + 1}</i><span>{s}</span>
              </div>
            ))}
          </div>
          {statusIdx(o.status) < 3 && (
            <Button onClick={async () => {
              await patch(o.id, { status: "SEPARANDO", payment_confirmed: true });
              setSelectedOrder({ ...o, status: "SEPARANDO", payment_confirmed: true });
              toast.success("Entrada confirmada", { description: "Pedido avançou para SEPARANDO" });
            }}>Confirmar entrada 50%</Button>
          )}
          <Button variant="soft" onClick={async () => {
            const st = statusIdx(o.status) < 3 ? "SEPARANDO" : o.status;
            await patch(o.id, { status: st, payment_confirmed: true, balance_cents: 0 });
            setSelectedOrder({ ...o, status: st, payment_confirmed: true, balance_cents: 0 });
            toast.success("Pagamento total confirmado");
          }}>Confirmar pagamento total</Button>
          <Button variant="whatsapp" onClick={() => {
            const msg = `Olá, ${orderName(o)}! Aqui é o Valdir, sobre o pedido ${orderLabel(o)}.`;
            if (!openWhatsApp(o.customer_phone, msg)) toast.success("Sem telefone do cliente", { description: msg });
          }}><HeartHandshake size={17} /> Falar com cliente</Button>
        </main>
      </div>
    );
  }

  if (screen === "routes") {
    return (
      <div className="app-shell operator">
        <Header title="Entregas" subtitle="Rotas por região" back onBack={() => setScreen("home")} onLogo={() => setScreen("home")} />
        <main className="page">
          {stage === "list" && regions.length === 0 && (
            <p className="muted">Nenhum pedido PRONTO PARA ROTA agora.</p>
          )}
          {stage === "list" && regions.map(r => (
            <div className="route-card" key={r} style={{ marginBottom: 12 }}>
              <div className="route-title">
                <Truck />
                <div><b>Rota {r}</b><span>{regionOrders(r).length} pedidos · {regionOrders(r).filter(o => o.urgent).length} urgentes</span></div>
                <span className="status-pill green">pronta</span>
              </div>
              <Button onClick={() => { setRouteRegion(r); setStage("ask"); }}>Finalizar rota <Check size={17} /></Button>
            </div>
          ))}

          {stage === "ask" && routeRegion && (
            <div className="route-card">
              <p><b>Você conseguiu entregar todos os pedidos da rota {routeRegion}?</b></p>
              <Button onClick={() => finishYes(routeRegion)}>SIM, entreguei tudo <Check size={17} /></Button>
              <Button variant="soft" onClick={() => setStage("pending")}>NÃO, alguns ficaram pendentes</Button>
            </div>
          )}

          {stage === "pending" && routeRegion && (
            <>
              <p className="muted">Marque o que ficou pendente e o motivo:</p>
              {regionOrders(routeRegion).map(o => (
                <div className="op-order" key={o.id}>
                  <div>
                    <b>{orderName(o)}</b><span>{orderLabel(o)} · {o.region}</span>
                    {pend[o.id] && (
                      <select value={reasons[o.id] || REASONS[0]} onChange={e => setReasons(r => ({ ...r, [o.id]: e.target.value }))}>
                        {REASONS.map(r => <option key={r}>{r}</option>)}
                      </select>
                    )}
                  </div>
                  <button className="btn btn-soft" style={{ width: "auto", minHeight: 40, padding: "0 12px" }} onClick={() => setPend(p => ({ ...p, [o.id]: !p[o.id] }))}>
                    {pend[o.id] ? "pendente" : "marcar pendente"}
                  </button>
                </div>
              ))}
              <Button onClick={() => finishNo(routeRegion)}>Concluir rota <Check size={17} /></Button>
            </>
          )}

          {stage === "done" && (
            <div className="route-card">
              <div className="route-progress"><div style={{ width: "100%" }} /></div>
              <p>{doneSummary}</p>
              <Button variant="soft" onClick={() => { setStage("list"); setPend({}); setRouteRegion(null); }}>Voltar</Button>
            </div>
          )}

          {pendentes.length > 0 && (
            <>
              <h2 style={{ fontFamily: "Fraunces", fontSize: 20, margin: "18px 0 8px" }}>Pendências de entrega</h2>
              {pendentes.map(o => (
                <div className="pending-card" key={o.id}>
                  <span className="urgent-label">PENDENTE DE ENTREGA</span>
                  <b>{orderName(o)} · {orderLabel(o)}</b>
                  <span>{o.notes || "Sem motivo registrado"}</span>
                  <div>
                    <Button variant="soft" onClick={async () => { await patch(o.id, { status: "PRONTO PARA ROTA", notes: "" }); toast.success("Reagendado para a próxima rota"); }}>Reagendar</Button>
                    <Button variant="ghost" onClick={() => {
                      const msg = `Olá, ${orderName(o)}! Aqui é o Valdir, sobre a entrega do pedido ${orderLabel(o)}.`;
                      if (!openWhatsApp(o.customer_phone, msg)) toast.success("Sem telefone", { description: msg });
                    }}>Falar com cliente</Button>
                  </div>
                </div>
              ))}
            </>
          )}
        </main>
        <BottomNav items={opNav} active="routes" onSelect={setScreen} />
      </div>
    );
  }

  return (
    <div className="app-shell operator">
      <Header onLogo={() => setScreen("home")} />
      <main className="page operator-home">
        <div className="hello"><span>painel do dia</span><h1>Olá, Valdir!</h1><p>Vamos deixar tudo pronto com calma.</p></div>
        {canInstall && !installed && (
          <Button
            variant="soft"
            onClick={async () => {
              const ok = await triggerInstall();
              if (ok) {
                toast.success("App instalado! Agora você pode abrir o painel como app no celular.");
                setInstalled(true);
                setCanInstall(false);
              }
            }}
            style={{ marginBottom: 12 }}
          >
            <Zap size={16} /> Instalar painel no celular
          </Button>
        )}
        {installed && (
          <div style={{ background: "#e2f0e7", padding: "10px 14px", borderRadius: 10, fontSize: 12, color: "#235842", marginBottom: 12 }}>
            ✓ Painel instalado. Use direto da tela inicial do celular.
          </div>
        )}
        <div className="op-grid">
          <button onClick={() => setScreen("product")}><Plus /><b>Novo produto</b><span>tirar foto e cadastrar</span></button>
          <button onClick={() => setScreen("products")}><Package /><b>Meus produtos</b><span>{prods.filter(p => p.active !== false).length} disponíveis</span></button>
          <button onClick={() => setScreen("orders")}><ClipboardList /><b>Pedidos</b><span>{novos + andamento} precisam de atenção</span></button>
          <button onClick={() => setScreen("routes")}><Truck /><b>Entregas</b><span>{ready.length} prontos p/ rota</span></button>
        </div>
        <div className="simple-banner">
          <HeartHandshake />
          <div><b>Ficou com dúvida?</b><span>Chame o gestor para ajudar.</span></div>
        </div>
        {!hasSupabase && <button className="exit-role" onClick={onExit}>Trocar experiência</button>}
        <button className="exit-role" onClick={onSignOut}>Sair da conta</button>
      </main>
      <BottomNav items={opNav} active="home" onSelect={setScreen} />
    </div>
  );
}