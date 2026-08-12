import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  Check,
  Copy,
  CreditCard,
  DollarSign,
  HeartHandshake,
  Home as HomeIcon,
  MapPin,
  Search,
  ShoppingCart,
  Store,
  Trash2,
  Truck,
  UserRound,
  WalletCards,
  Zap,
  Image as ImageIcon,
  Plus,
  X,
} from "lucide-react";
import { supabase, hasSupabase } from "../lib/supabase";
import {
  currentSession,
  onAuthChange,
  signInWithGoogle,
  signOut,
  ensureCustomer,
} from "../lib/auth";
import { useCatalog, useSettings } from "../lib/hooks";
import {
  money,
  moneyFromCents,
  openWhatsApp,
  uploadToBucket,
  STATUS_SEQ,
  orderTotal,
  orderLabel,
  dateBR,
} from "../lib/helpers";
import { ALL_RP_DISTRICTS, RP_REGIONS, zoneForDistrict } from "../data/rpZones";
import {
  Button,
  Header,
  Stepper,
  BottomNav,
  Empty,
  WhatsAppBtn,
} from "../ui/components";
import { IMG } from "../data/mock";

export default function ClientApp() {
  const { products, categories, loading } = useCatalog();
  const { settings } = useSettings();

  const [uid, setUid] = useState<string | null>(null);
  const [customer, setCustomer] = useState<any>(null);
  const [myAddresses, setMyAddresses] = useState<any[]>([]);
  const [screen, setScreen] = useState("home");
  const [selected, setSelected] = useState<any | null>(null);
  const [category, setCategory] = useState("Todos");
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState<Record<string, number>>({});
  const [checkoutStep, setCheckoutStep] = useState(1);
  const [orderDetails, setOrderDetails] = useState<any | null>(null);
  const [myOrders, setMyOrders] = useState<any[]>([]);

  useEffect(() => {
    if (!hasSupabase) return;
    const init = async () => setUid((await currentSession())?.user?.id || null);
    init();
    const sub = onAuthChange(setUid);
    return () => sub.data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (uid) ensureCustomer().then(setCustomer);
    else setCustomer(null);
  }, [uid]);

  useEffect(() => {
    if (!customer?.id) {
      setMyAddresses([]);
      return;
    }
    supabase
      .from("addresses")
      .select("*")
      .eq("customer_id", customer.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => setMyAddresses(data || []));
  }, [customer?.id]);

  useEffect(() => {
    if (!hasSupabase || !customer) {
      setMyOrders([]);
      return;
    }
    supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("customer_id", customer.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => setMyOrders(data || []));
  }, [customer]);

  const cartItems = useMemo(
    () =>
      Object.entries(cart)
        .filter(([, q]) => q > 0)
        .map(([id, q]) => ({ p: products.find((p) => p.id === id), q }))
        .filter(({ p }) => p),
    [cart, products],
  );

  const cartTotal =
    cartItems.reduce((s, { p, q }) => s + (p?.price_cents || 0) * q, 0) / 100;

  const add = (id: string) =>
    setCart((c) => ({ ...c, [id]: (c[id] || 0) + 1 }));
  const remove = (id: string) =>
    setCart((c) => ({ ...c, [id]: Math.max(0, (c[id] || 0) - 1) }));
  const clear = (id: string) =>
    setCart((c) => {
      const n = { ...c };
      delete n[id];
      return n;
    });

  const go = (s: string) => {
    setScreen(s);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const repeat = (o: any) => {
    const c: Record<string, number> = {};
    (o.order_items || o.items || []).forEach((it: any) => {
      const pid = it.product_id || it.id;
      if (products.some((p) => p.id === pid)) c[pid] = it.qty;
    });
    setCart(c);
    toast.success("Pedido copiado para o carrinho com preços atuais.");
    go("cart");
  };

  if (loading) {
    return (
      <div
        className="app-shell"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
        }}
      >
        <p style={{ color: "#66564e" }}>Carregando catálogo...</p>
      </div>
    );
  }

  const nav = (
    <BottomNav
      items={[
        { id: "home", label: "Início", icon: <HomeIcon size={19} /> },
        { id: "cart", label: "Carrinho", icon: <ShoppingCart size={19} /> },
        { id: "account", label: "Conta", icon: <UserRound size={19} /> },
      ]}
      active={screen}
      onSelect={(id) => go(id)}
    />
  );

  if (screen === "product" && selected) {
    const catName = categories.find(
      (c: any) => c.id === selected.category_id,
    )?.name;
    return (
      <div className="app-shell">
        <Header
          back
          onBack={() => go("home")}
          cart={Object.values(cart).reduce<number>((a, b) => a + Number(b), 0)}
          goCart={() => go("cart")}
          onLogo={() => go("home")}
        />
        <main className="page">
          <img
            className="product-hero"
            src={selected.image_url}
            loading="eager"
            decoding="async"
            alt={selected.name}
          />
          <div className="product-detail">
            <span className="eyebrow">
              {catName} ·{" "}
              {selected.stock > 0
                ? `${selected.stock} disponíveis`
                : "sob encomenda"}
            </span>
            <h1>{selected.name}</h1>
            <p>{selected.description}</p>
            <strong className="price-lg">
              {moneyFromCents(selected.price_cents)}
            </strong>
            <div className="qty-line">
              <span>Quantidade</span>
              <div className="qty">
                <button onClick={() => remove(selected.id)}>−</button>
                <b>{cart[selected.id] || 0}</b>
                <button onClick={() => add(selected.id)}>+</button>
              </div>
            </div>
            <Button
              onClick={() => {
                add(selected.id);
                toast.success("Produto adicionado ao carrinho");
              }}
            >
              Adicionar ao carrinho <ArrowRight size={17} />
            </Button>
            <WhatsAppBtn
              number={settings?.whatsapp_number}
              text={`Olá, Valdir! Tenho uma dúvida sobre ${selected.name}.`}
            />
          </div>
        </main>
      </div>
    );
  }

  if (screen === "cart") {
    return (
      <div className="app-shell">
        <Header
          title="Meu carrinho"
          back
          onBack={() => go("home")}
          onLogo={() => go("home")}
        />
        <main className="page">
          <Stepper current={1} />
          <h1>Seu carrinho</h1>
          {cartItems.length === 0 ? (
            <Empty
              title="Seu carrinho está vazio"
              text="Escolha um doce para começar."
              action={() => go("home")}
            />
          ) : (
            <>
              <div className="cart-list">
                {cartItems.map(({ p, q }: any) => (
                  <div className="cart-row" key={p.id}>
                    <img
                      src={p.image_url}
                      loading="lazy"
                      decoding="async"
                      alt={p.name}
                    />
                    <div>
                      <b>{p.name}</b>
                      <span>{moneyFromCents(p.price_cents)} cada</span>
                      <div className="qty">
                        <button onClick={() => remove(p.id)}>−</button>
                        <b>{q}</b>
                        <button onClick={() => add(p.id)}>+</button>
                        <button
                          className="trash"
                          title="Remover"
                          onClick={() => clear(p.id)}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                    <strong>{money((p.price_cents * q) / 100)}</strong>
                  </div>
                ))}
              </div>
              <div className="summary">
                <span>Subtotal</span>
                <b>{money(cartTotal)}</b>
                <span>Entrega</span>
                <b className="muted">a combinar</b>
                <hr />
                <strong>Total</strong>
                <strong className="total">{money(cartTotal)}</strong>
              </div>
              <Button
                onClick={() => {
                  setCheckoutStep(1);
                  go("checkout");
                }}
              >
                Avançar para o pedido <ArrowRight size={18} />
              </Button>
              <WhatsAppBtn number={settings?.whatsapp_number} />
            </>
          )}
          <button className="link-btn" onClick={() => go("home")}>
            <ArrowLeft size={16} /> Continuar comprando
          </button>
        </main>
        {nav}
      </div>
    );
  }

  if (screen === "checkout") {
    return (
      <CheckoutPage
        cartItems={cartItems}
        cartTotal={cartTotal}
        step={checkoutStep}
        setStep={setCheckoutStep}
        settings={settings}
        customer={customer}
        uid={uid}
        addresses={myAddresses}
        onBack={() =>
          checkoutStep === 1 ? go("cart") : setCheckoutStep(checkoutStep - 1)
        }
        onDone={(od: any) => {
          setOrderDetails(od);
          go("order");
        }}
        decrementStock={async (items: any[]) => {
          if (!hasSupabase) return;
          for (const { p, q } of items) {
            await supabase
              .from("products")
              .update({ stock: Math.max(0, (p.stock || 0) - q) })
              .eq("id", p.id);
          }
        }}
      />
    );
  }

  if (screen === "order" && orderDetails) {
    return (
      <StatusView
        order={orderDetails}
        setOrder={setOrderDetails}
        settings={settings}
        go={go}
      />
    );
  }

  if (screen === "track") {
    return <TrackPage settings={settings} go={go} />;
  }

  if (screen === "account") {
    return (
      <AccountPage
        uid={uid}
        customer={customer}
        setCustomer={setCustomer}
        myOrders={myOrders}
        myAddresses={myAddresses}
        setMyAddresses={setMyAddresses}
        go={go}
        repeat={repeat}
      />
    );
  }

  // HOME
  const cats = ["Todos", ...categories.map((c: any) => c.name)];
  const filtered = products.filter((p: any) => {
    const catName =
      categories.find((c: any) => c.id === p.category_id)?.name || "Outros";
    return (
      (category === "Todos" || catName === category) &&
      p.name.toLowerCase().includes(query.toLowerCase())
    );
  });

  return (
    <div className="app-shell">
      <header className="client-hero">
        <div className="hero-top" style={{ justifyContent: "flex-end" }}>
          <button
            className="account-btn"
            onClick={() => go("account")}
            aria-label="Minha conta"
          >
            <UserRound size={19} />
          </button>
        </div>
        <img
          className="hero-banner"
          src="/og-image.png"
          alt="Produtos do Valdir — doces, balas e utilidades do balcão para sua casa"
        />
      </header>
      <main className="page catalog-page" id="main-content">
        <div className="searchbox">
          <Search size={18} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar um doce, uma pilha..."
          />
        </div>
        <div className="catalog-actions">
          <WhatsAppBtn number={settings?.whatsapp_number} />
          <button
            className="install"
            onClick={() =>
              toast.success("No celular, use 'Adicionar à tela inicial'")
            }
          >
            <Zap size={16} /> instalar loja
          </button>
        </div>
        <div className="section-head">
          <div>
            <span className="eyebrow">do balcão para sua casa</span>
            <h2>O que você procura?</h2>
          </div>
          <button className="link-btn" onClick={() => setCategory("Todos")}>
            ver tudo <ArrowRight size={15} />
          </button>
        </div>
        <div className="chips">
          {cats.map((c) => (
            <button
              key={c}
              className={category === c ? "selected" : ""}
              onClick={() => setCategory(c)}
            >
              {c}
            </button>
          ))}
        </div>
        {products[0] && (
          <div
            className="featured"
            onClick={() => {
              setSelected(products[0]);
              go("product");
            }}
          >
            <img
              src={products[0].image_url}
              loading="eager"
              decoding="async"
              alt={products[0].name}
            />
            <div>
              <span className="tag">favorito da casa</span>
              <h2>{products[0].name}</h2>
              <p>{products[0].description}</p>
              <b>{moneyFromCents(products[0].price_cents)}</b>
            </div>
            <ArrowRight />
          </div>
        )}
        <div className="section-head">
          <h2>Mais pedidos</h2>
          <span className="muted">{filtered.length} produtos</span>
        </div>
        <div className="product-grid">
          {filtered.map((p: any) => (
            <article
              className="product-card"
              key={p.id}
              onClick={() => {
                setSelected(p);
                go("product");
              }}
            >
              <div className="product-img">
                <img
                  src={p.image_url}
                  loading="lazy"
                  decoding="async"
                  alt={p.name}
                />
                {p.id === "p1" && <span className="tag">favorito da casa</span>}
              </div>
              <div className="product-info">
                <h3>{p.name}</h3>
                {p.stock > 0 ? (
                  <span className="stock">{p.stock} disponíveis</span>
                ) : (
                  <span className="stock encomenda">sob encomenda</span>
                )}
                <strong>{moneyFromCents(p.price_cents)}</strong>
                <div
                  className="card-action"
                  onClick={(e) => {
                    e.stopPropagation();
                    add(p.id);
                    toast.success(`${p.name} foi para o carrinho`);
                  }}
                >
                  {(cart[p.id] || 0) > 0 ? (
                    <>
                      <button onClick={(e) => e.stopPropagation()}>-</button>
                      <b>{cart[p.id]}</b>
                      <button onClick={(e) => e.stopPropagation()}>+</button>
                    </>
                  ) : (
                    <>
                      <Plus size={17} /> adicionar
                    </>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
        <button
          className="link-btn"
          style={{ margin: "18px auto", display: "flex" }}
          onClick={() => go("track")}
        >
          Acompanhar pedido pelo código <ArrowRight size={15} />
        </button>
        <div className="legal-links">
          <a href="/privacidade">Política de Privacidade</a>
          <span>·</span>
          <a href="/termos">Termos de Uso</a>
        </div>
      </main>
      {nav}
    </div>
  );
}

/* ============ CONTA ============ */
function AccountPage({
  uid,
  customer,
  setCustomer,
  myOrders,
  myAddresses,
  setMyAddresses,
  go,
  repeat,
}: any) {
  const [profile, setProfile] = useState<any>(null);
  const [newAddr, setNewAddr] = useState<any>({
    place_name: "",
    street: "",
    number: "",
    district: "",
    region: "Centro",
  });

  useEffect(() => {
    if (customer)
      setProfile({
        name: customer.name || "",
        phone: customer.phone || "",
        business_name: customer.business_name || "",
        notes: customer.notes || "",
      });
  }, [customer]);

  const saveProfile = async () => {
    if (!customer?.id) return;
    await supabase.from("customers").update(profile).eq("id", customer.id);
    setCustomer({ ...customer, ...profile });
    toast.success("Dados salvos! Eles preenchem seus pedidos automaticamente.");
  };

  const onDistrict = (v: string) => {
    const z = zoneForDistrict(v);
    setNewAddr((a: any) => ({ ...a, district: v, region: z || a.region }));
  };

  const addAddress = async () => {
    if (!customer?.id || !newAddr.street) {
      toast.error("Informe ao menos a rua.");
      return;
    }
    const { data } = await supabase
      .from("addresses")
      .insert({ ...newAddr, city: "Ribeirão Preto", customer_id: customer.id })
      .select()
      .single();
    if (data) setMyAddresses([data, ...myAddresses]);
    setNewAddr({
      place_name: "",
      street: "",
      number: "",
      district: "",
      region: "Centro",
    });
    toast.success("Endereço salvo!");
  };

  const delAddress = async (id: string) => {
    await supabase.from("addresses").delete().eq("id", id);
    setMyAddresses(myAddresses.filter((a: any) => a.id !== id));
    toast.success("Endereço removido.");
  };

  return (
    <div className="app-shell">
      <Header
        title="Minha conta"
        back
        onBack={() => go("home")}
        onLogo={() => go("home")}
      />
      <main className="page">
        {uid ? (
          <>
            <div className="account-card">
              <div className="avatar">{(customer?.name || "C")[0]}</div>
              <div>
                <b>{customer?.name || "Cliente"}</b>
                <span>conectado com Google</span>
              </div>
              <Check />
            </div>

            <div className="settings-card" style={{ marginBottom: 16 }}>
              <span className="eyebrow">meus dados</span>
              <h2
                style={{
                  fontFamily: "Fraunces",
                  fontSize: 20,
                  margin: "4px 0 10px",
                }}
              >
                Preencha uma vez, use sempre
              </h2>
              <label>
                Nome do responsável
                <input
                  value={profile?.name || ""}
                  onChange={(e) =>
                    setProfile({ ...profile, name: e.target.value })
                  }
                />
              </label>
              <label>
                Nome do estabelecimento (se comercial)
                <input
                  value={profile?.business_name || ""}
                  onChange={(e) =>
                    setProfile({ ...profile, business_name: e.target.value })
                  }
                  placeholder="Ex.: Bar do Zé"
                />
              </label>
              <label>
                WhatsApp
                <input
                  value={profile?.phone || ""}
                  onChange={(e) =>
                    setProfile({ ...profile, phone: e.target.value })
                  }
                  placeholder="16 99999-9999"
                />
              </label>
              <label>
                Recado / ponto de referência
                <textarea
                  value={profile?.notes || ""}
                  onChange={(e) =>
                    setProfile({ ...profile, notes: e.target.value })
                  }
                  placeholder="Ex.: portão verde, deixar com a recepcionista"
                  style={{
                    minHeight: 60,
                    padding: 10,
                    borderRadius: 12,
                    border: "1px solid #d6c8bb",
                    background: "#fffdf8",
                    width: "100%",
                  }}
                />
              </label>
              <Button onClick={saveProfile}>
                Salvar meus dados <Check size={16} />
              </Button>
            </div>

            <div className="settings-card" style={{ marginBottom: 16 }}>
              <span className="eyebrow">meus endereços</span>
              {myAddresses.map((a: any) => (
                <div
                  className="manager-row"
                  key={a.id}
                  style={{ margin: "8px 0" }}
                >
                  <div className="mini-avatar">
                    <MapPin size={14} />
                  </div>
                  <div>
                    <b>{a.place_name || "Endereço"}</b>
                    <span>
                      {a.street}, {a.number} · {a.district} · {a.region}
                    </span>
                  </div>
                  <button
                    className="icon-btn"
                    style={{ width: 32, height: 32, color: "#bd463b" }}
                    onClick={() => delAddress(a.id)}
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
              <label>
                Apelido do local
                <input
                  value={newAddr.place_name}
                  onChange={(e) =>
                    setNewAddr({ ...newAddr, place_name: e.target.value })
                  }
                  placeholder="Ex.: Casa, Bar, Escritório"
                />
              </label>
              <label>
                Rua
                <input
                  value={newAddr.street}
                  onChange={(e) =>
                    setNewAddr({ ...newAddr, street: e.target.value })
                  }
                />
              </label>
              <div className="two-cols">
                <label>
                  Número
                  <input
                    value={newAddr.number}
                    onChange={(e) =>
                      setNewAddr({ ...newAddr, number: e.target.value })
                    }
                  />
                </label>
                <label>
                  Bairro
                  <input
                    list="rp-bairros-conta"
                    value={newAddr.district}
                    onChange={(e) => onDistrict(e.target.value)}
                    placeholder="Digite o bairro"
                  />
                </label>
              </div>
              <datalist id="rp-bairros-conta">
                {ALL_RP_DISTRICTS.map((b) => (
                  <option key={b} value={b} />
                ))}
              </datalist>
              <label>
                Zona (automática pelo bairro)
                <select
                  value={newAddr.region}
                  onChange={(e) =>
                    setNewAddr({ ...newAddr, region: e.target.value })
                  }
                >
                  {RP_REGIONS.map((r) => (
                    <option key={r}>{r}</option>
                  ))}
                </select>
              </label>
              <Button variant="soft" onClick={addAddress}>
                <Plus size={16} /> Adicionar endereço
              </Button>
            </div>

            <div className="section-head">
              <h2>Seus pedidos</h2>
              <button className="link-btn" onClick={() => go("track")}>
                acompanhar por código <ArrowRight size={15} />
              </button>
            </div>
            {myOrders.length === 0 && (
              <p className="muted">Você ainda não tem pedidos.</p>
            )}
            {myOrders.map((o: any) => (
              <div className="order-card" key={o.id}>
                <div>
                  <span className="eyebrow">
                    {dateBR(o.created_at)} · {orderLabel(o)}
                  </span>
                  <b>{money(orderTotal(o))}</b>
                  <span>
                    {(o.order_items || [])
                      .map((it: any) => `${it.qty}x ${it.product_name}`)
                      .join(", ")}
                  </span>
                </div>
                <span className="status-pill green">{o.status}</span>
                <Button
                  variant="soft"
                  onClick={() => {
                    setOrderDetails(normalize(o));
                    go("order");
                  }}
                >
                  Ver pedido <ArrowRight size={15} />
                </Button>
                <Button variant="ghost" onClick={() => repeat(o)}>
                  🔄 Repetir pedido
                </Button>
              </div>
            ))}
            <Button
              variant="ghost"
              onClick={async () => {
                await signOut();
                toast.success("Você saiu.");
              }}
            >
              Sair da conta
            </Button>
          </>
        ) : (
          <>
            <div className="account-card">
              <div className="avatar">?</div>
              <div>
                <b>Entrar para ver seu histórico</b>
                <span>ou acompanhe um pedido pelo código</span>
              </div>
            </div>
            <Button variant="google" onClick={() => signInWithGoogle()}>
              G <span>Entrar com Google</span>
            </Button>
            <Button variant="soft" onClick={() => go("track")}>
              Acompanhar pedido por código <ArrowRight size={15} />
            </Button>
            <p className="muted">Você também pode comprar sem cadastro.</p>
          </>
        )}
      </main>
      <BottomNav
        items={[
          { id: "home", label: "Início", icon: <HomeIcon size={19} /> },
          { id: "cart", label: "Carrinho", icon: <ShoppingCart size={19} /> },
          { id: "account", label: "Conta", icon: <UserRound size={19} /> },
        ]}
        active="account"
        onSelect={(id) => go(id)}
      />
    </div>
  );
}

/* ============ CHECKOUT ============ */
function CheckoutPage({
  cartItems,
  cartTotal,
  step,
  setStep,
  settings,
  customer,
  uid,
  addresses,
  onBack,
  onDone,
  decrementStock,
}: any) {
  const [city, setCity] = useState("Ribeirão Preto");
  const [delivery, setDelivery] = useState("Entrega");
  const [urgent, setUrgent] = useState(false);
  const [payment, setPayment] = useState("PIX");
  const [payFull, setPayFull] = useState(false);
  const [pixCopied, setPixCopied] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [business, setBusiness] = useState("");
  const [notes, setNotes] = useState("");
  const [localName, setLocalName] = useState("");
  const [addr, setAddr] = useState("");
  const [num, setNum] = useState("");
  const [district, setDistrict] = useState("");
  const [region, setRegion] = useState("Zona Norte");
  const [submitting, setSubmitting] = useState(false);
  const [previewNumber] = useState(
    "DV-" + Math.floor(1000 + Math.random() * 9000),
  );

  useEffect(() => {
    if (customer) {
      setName(customer.name || "");
      setPhone(customer.phone || "");
      setBusiness(customer.business_name || "");
      setNotes(customer.notes || "");
    }
  }, [customer]);

  const pixKey = settings?.pix_key || "doces.valdir@demo.com";
  const pixHolder = settings?.pix_holder || "Valdir";
  const pickupEnabled = !settings || settings.pickup_enabled !== false;
  const whatsNumber = settings?.whatsapp_number;
  const pct =
    payment === "PIX"
      ? Number(settings?.entry_pct_pix ?? 0.5)
      : Number(settings?.entry_pct_card ?? 0.5);
  const araraquaraDate = dateBR(settings?.araraquara_next_date) || "15/08/2026";

  const entry = cartTotal * pct;
  const needsEntry = payment !== "Dinheiro" && !payFull;
  const amountToPay = needsEntry ? entry : cartTotal;

  const isAraraquara = city === "Araraquara";
  const addressLine = isAraraquara
    ? "Encomenda — combinação de retirada/envio"
    : delivery === "Retirada"
      ? "Retirada no balcão do Valdir"
      : `${addr || "Rua..."}, ${num || "s/n"} – ${district || "Centro"}`;

  const useSavedAddress = (a: any) => {
    setLocalName(a.place_name || "");
    setAddr(a.street);
    setNum(a.number);
    setDistrict(a.district);
    setRegion(a.region);
  };

  const onDistrictChange = (v: string) => {
    setDistrict(v);
    const z = zoneForDistrict(v);
    if (z) setRegion(z);
  };

  const buildMsg = (
    orderNumber: string,
  ) => `🧾 Pedido ${orderNumber} · Produtos do Valdir
Cliente: ${name || "Visitante"}
${business ? `Estabelecimento: ${business}\n` : ""}Telefone: ${phone || "não informado"}
Cidade: ${city}
Modalidade: ${isAraraquara ? "Encomenda" : delivery}
Local: ${localName || "—"}
Endereço: ${addressLine}
${!isAraraquara && delivery === "Entrega" ? `Região: ${region}\n` : ""}Itens:
${cartItems.map(({ p, q }: any) => `• ${q}x ${p.name} — ${money((p.price_cents * q) / 100)}`).join("\n")}
Total: ${money(cartTotal)}
Pagamento: ${payment}
Valor a pagar: ${money(amountToPay)} (${payFull && payment !== "Dinheiro" ? "integral" : needsEntry ? `entrada ${Math.round(pct * 100)}%` : "total na entrega/retirada"})
${needsEntry ? `Saldo: ${money(cartTotal - entry)}` : ""}Urgente: ${urgent ? "🚨 SIM — o quanto antes" : "não"}
Recado: ${notes || "—"}`;

  const submitOrder = async () => {
    setSubmitting(true);
    try {
      let accessCode = null;
      let savedId = null;
      let orderNumber = previewNumber;

      if (hasSupabase) {
        try {
          const { data: seq } = await supabase.rpc("next_order_number");
          if (seq) orderNumber = seq;
        } catch (e) {
          /* mantém número de prévia */
        }

        const { data: order, error } = await supabase
          .from("orders")
          .insert({
            number: orderNumber,
            customer_id: customer?.id || null,
            customer_name: name || "Visitante",
            customer_phone: phone || "",
            business_name: business || "",
            notes: notes || "",
            city,
            delivery_mode: isAraraquara
              ? "ENCOMENDA"
              : delivery === "Retirada"
                ? "RETIRADA"
                : "ENTREGA",
            address_text: addressLine,
            region: isAraraquara ? "Encomenda" : region,
            urgent,
            payment_method:
              payment === "Cartão" ? "CARTAO" : payment.toUpperCase(),
            entry_pct: needsEntry ? pct : 1,
            total_cents: Math.round(cartTotal * 100),
            entry_cents: Math.round(amountToPay * 100),
            balance_cents: Math.round((cartTotal - amountToPay) * 100),
          })
          .select()
          .single();
        if (error) throw error;
        accessCode = order.access_code;
        savedId = order.id;
        const items = cartItems.map(({ p, q }: any) => ({
          order_id: order.id,
          product_id: p.id,
          product_name: p.name,
          qty: q,
          unit_price_cents: p.price_cents,
        }));
        const { error: itemsErr } = await supabase
          .from("order_items")
          .insert(items);
        if (itemsErr) throw itemsErr;
        await decrementStock(cartItems);
      }

      const whatsMsg = buildMsg(orderNumber);
      if (!openWhatsApp(whatsNumber, whatsMsg)) {
        toast.success("Pedido enviado no WhatsApp (simulado)", {
          description: whatsMsg,
        });
      }
      onDone({
        id: orderNumber,
        dbId: savedId,
        accessCode,
        payment,
        delivery,
        city,
        region,
        urgent,
        customer: name || "Visitante",
        phone,
        payFull,
        confirmed: false,
        proof: null,
        total: cartTotal,
      });
    } catch (err: any) {
      toast.error("Erro ao salvar pedido: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="app-shell">
      <Header title="Fechar pedido" back onBack={onBack} />
      <main className="page">
        <Stepper current={step === 1 ? 2 : 3} />
        {step === 1 && (
          <>
            <span className="eyebrow">etapa 2 de 3 · entrega</span>
            <h1>Como você recebe?</h1>
            <label>
              Nome do responsável
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex.: Maria de Souza"
              />
            </label>
            <label>
              Estabelecimento (se comercial)
              <input
                value={business}
                onChange={(e) => setBusiness(e.target.value)}
                placeholder="Ex.: Bar do Zé"
              />
            </label>
            <label>
              WhatsApp
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="16 99999-9999"
              />
            </label>
            {!uid && (
              <Button variant="google" onClick={() => signInWithGoogle()}>
                G <span>Entrar com Google</span>
              </Button>
            )}
            <p className="muted">Você pode comprar sem cadastro.</p>
            <label>
              Localização
              <select value={city} onChange={(e) => setCity(e.target.value)}>
                <option>Ribeirão Preto</option>
                <option>Araraquara</option>
              </select>
            </label>

            {isAraraquara ? (
              <div className="notice">
                <MapPin />
                <b>Encomenda para Araraquara</b>
                <span>
                  Próxima encomenda: <strong>{araraquaraDate}</strong>. Só a
                  cidade já basta — o resto combinamos por WhatsApp.
                </span>
              </div>
            ) : (
              <>
                <div className="choice-row">
                  <button
                    className={delivery === "Entrega" ? "chosen" : ""}
                    onClick={() => setDelivery("Entrega")}
                  >
                    <Truck />
                    <b>Entrega</b>
                    <span>Organizamos por região</span>
                  </button>
                  {pickupEnabled && (
                    <button
                      className={delivery === "Retirada" ? "chosen" : ""}
                      onClick={() => setDelivery("Retirada")}
                    >
                      <Store />
                      <b>Retirada</b>
                      <span>opção habilitada</span>
                    </button>
                  )}
                </div>

                {delivery === "Entrega" && (
                  <>
                    {uid && addresses?.length > 0 && (
                      <label>
                        Usar endereço salvo
                        <select
                          defaultValue=""
                          onChange={(e) => {
                            const a = addresses.find(
                              (x: any) => x.id === e.target.value,
                            );
                            if (a) useSavedAddress(a);
                          }}
                        >
                          <option value="">— digitar novo endereço —</option>
                          {addresses.map((a: any) => (
                            <option key={a.id} value={a.id}>
                              {a.place_name || a.street}, {a.number} ·{" "}
                              {a.district}
                            </option>
                          ))}
                        </select>
                      </label>
                    )}
                    <label>
                      Nome do local
                      <input
                        value={localName}
                        onChange={(e) => setLocalName(e.target.value)}
                        placeholder="Casa da Maria"
                      />
                    </label>
                    <label>
                      Endereço
                      <input
                        value={addr}
                        onChange={(e) => setAddr(e.target.value)}
                        placeholder="Rua, avenida..."
                      />
                    </label>
                    <div className="two-cols">
                      <label>
                        Número
                        <input
                          value={num}
                          onChange={(e) => setNum(e.target.value)}
                          placeholder="123"
                        />
                      </label>
                      <label>
                        Bairro
                        <input
                          list="rp-bairros"
                          value={district}
                          onChange={(e) => onDistrictChange(e.target.value)}
                          placeholder="Digite o bairro"
                        />
                      </label>
                    </div>
                    <datalist id="rp-bairros">
                      {ALL_RP_DISTRICTS.map((b) => (
                        <option key={b} value={b} />
                      ))}
                    </datalist>
                    <label>
                      Zona da cidade (automática pelo bairro)
                      <select
                        value={region}
                        onChange={(e) => setRegion(e.target.value)}
                      >
                        {RP_REGIONS.map((r) => (
                          <option key={r}>{r}</option>
                        ))}
                      </select>
                    </label>
                  </>
                )}

                {delivery === "Retirada" && (
                  <div className="notice">
                    <Store />
                    <b>Retirada no balcão</b>
                    <span>
                      {settings?.pickup_address ||
                        "Rua dos Doces, 123 — referência: praça central."}
                    </span>
                  </div>
                )}
              </>
            )}

            <label>
              Recado / ponto de referência
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex.: portão verde, deixar com a recepcionista"
                style={{
                  minHeight: 60,
                  padding: 10,
                  borderRadius: 12,
                  border: "1px solid #d6c8bb",
                  background: "#fffdf8",
                  width: "100%",
                }}
              />
            </label>

            <div className="urgency">
              <div>
                <Zap />
                <b>Quando você precisa receber?</b>
              </div>
              <button
                className={!urgent ? "chosen" : ""}
                onClick={() => setUrgent(false)}
              >
                Posso aguardar a rota normal
              </button>
              <button
                className={urgent ? "urgent chosen" : ""}
                onClick={() => setUrgent(true)}
              >
                🚨 URGENTE — preciso o quanto antes
              </button>
              <small>
                Urgente sinaliza prioridade ao vendedor, não promete entrega
                imediata.
              </small>
            </div>
            <Button onClick={() => setStep(2)}>
              Ir para pagamento <ArrowRight size={17} />
            </Button>
          </>
        )}
        {step === 2 && (
          <>
            <span className="eyebrow">etapa 3 de 3 · pagamento</span>
            <h1>Como você paga?</h1>
            <div className="pay-options">
              {["PIX", "Cartão", "Dinheiro"].map((p) => (
                <button
                  className={payment === p ? "chosen" : ""}
                  key={p}
                  onClick={() => {
                    setPayment(p);
                    setPayFull(false);
                  }}
                >
                  {p === "PIX" ? (
                    <WalletCards />
                  ) : p === "Cartão" ? (
                    <CreditCard />
                  ) : (
                    <DollarSign />
                  )}
                  <b>{p}</b>
                  <span>
                    {p === "Dinheiro" ? "a combinar" : "escolha abaixo"}
                  </span>
                </button>
              ))}
            </div>
            {payment !== "Dinheiro" && (
              <div className="choice-row" style={{ marginTop: 20 }}>
                <button
                  className={!payFull ? "chosen" : ""}
                  onClick={() => setPayFull(false)}
                >
                  <b>Entrada {Math.round(pct * 100)}%</b>
                  <span>
                    {money(entry)} agora, {money(cartTotal - entry)} na entrega
                  </span>
                </button>
                <button
                  className={payFull ? "chosen" : ""}
                  onClick={() => setPayFull(true)}
                >
                  <b>Pagar integral</b>
                  <span>{money(cartTotal)} agora</span>
                </button>
              </div>
            )}
            <div className="summary">
              <span>Total do pedido</span>
              <b>{money(cartTotal)}</b>
              <span>A pagar agora</span>
              <b>{payment === "Dinheiro" ? "—" : money(amountToPay)}</b>
              {needsEntry && (
                <>
                  <span>Saldo na entrega</span>
                  <b>{money(cartTotal - entry)}</b>
                </>
              )}
            </div>
            {payment === "PIX" && (
              <div className="pix-box">
                <span>chave PIX</span>
                <b>{pixKey}</b>
                <small>Titular: {pixHolder}</small>
                <button
                  className={pixCopied ? "copied" : ""}
                  onClick={() => {
                    navigator.clipboard?.writeText(pixKey);
                    setPixCopied(true);
                  }}
                >
                  {pixCopied ? (
                    <>
                      <Check size={15} /> chave copiada
                    </>
                  ) : (
                    <>
                      <Copy size={15} /> copiar chave PIX
                    </>
                  )}
                </button>
                <small>
                  Após pagar, volte ao status do pedido para enviar o
                  comprovante.
                </small>
              </div>
            )}
            {payment === "Cartão" && (
              <div className="pix-box">
                <span>
                  cartão ·{" "}
                  {payFull ? "integral" : `entrada ${Math.round(pct * 100)}%`}
                </span>
                <small>
                  Os dados do cartão serão combinados com Valdir após a
                  confirmação.
                </small>
              </div>
            )}
            <Button onClick={() => setStep(3)}>
              Revisar pedido <ArrowRight size={17} />
            </Button>
          </>
        )}
        {step === 3 && (
          <>
            <span className="eyebrow">revisão final</span>
            <h1>Revise e envie</h1>
            <div className="summary">
              <span>Cliente</span>
              <b>{name || "Visitante"}</b>
              {business && (
                <>
                  <span>Estabelecimento</span>
                  <b>{business}</b>
                </>
              )}
              <span>Recebe</span>
              <b>
                {isAraraquara
                  ? "Encomenda Araraquara"
                  : `${delivery} · ${region}`}
              </b>
              <span>Endereço</span>
              <b>{addressLine}</b>
              <span>Pagamento</span>
              <b>
                {payment} ·{" "}
                {payment === "Dinheiro"
                  ? "total na entrega/retirada"
                  : payFull
                    ? "integral"
                    : `entrada ${Math.round(pct * 100)}%`}
              </b>
              {urgent && (
                <>
                  <span>Prioridade</span>
                  <b>🚨 URGENTE</b>
                </>
              )}
            </div>
            <div className="summary">
              {cartItems.map(({ p, q }: any) => (
                <span key={p.id}>
                  {q}x {p.name} — {money((p.price_cents * q) / 100)}
                </span>
              ))}
              <hr />
              <strong>Total</strong>
              <strong className="total">{money(cartTotal)}</strong>
              {payment !== "Dinheiro" && (
                <>
                  <strong>A pagar agora</strong>
                  <strong className="total">{money(amountToPay)}</strong>
                </>
              )}
            </div>
            <div className="pix-box">
              <span>mensagem que será enviada no WhatsApp</span>
              <pre style={{ whiteSpace: "pre-wrap", margin: 0, fontSize: 12 }}>
                {buildMsg(previewNumber)}
              </pre>
            </div>
            <Button onClick={submitOrder} disabled={submitting}>
              {submitting ? "Enviando..." : "Enviar pedido no WhatsApp"}{" "}
              <ArrowRight size={17} />
            </Button>
          </>
        )}
      </main>
    </div>
  );
}

/* ============ STATUS / TRACK ============ */
function StatusView({ order, setOrder, settings, go }: any) {
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [sent, setSent] = useState(Boolean(order.proof_url || order.proof));
  const [sending, setSending] = useState(false);

  const total = order.total || 0;
  const entry = order.entry_cents != null ? order.entry_cents / 100 : total / 2;
  const isCash = order.payment === "Dinheiro";
  const needsEntry = !isCash && !order.payFull;
  const proofNeeded =
    needsEntry && !order.confirmed && !order.payment_confirmed;
  const idx = order.payment_confirmed || order.confirmed ? 3 : isCash ? 1 : 2;

  const handleFile = (file?: File) => {
    if (!file) return;
    setProofFile(file);
    const reader = new FileReader();
    reader.onload = () => setProofPreview(String(reader.result));
    reader.readAsDataURL(file);
  };

  const sendProof = async () => {
    if (!proofPreview) return;
    setSending(true);
    let url = proofPreview;
    try {
      if (hasSupabase && order.accessCode && proofFile) {
        url = await uploadToBucket(
          "proofs",
          `${order.accessCode}-${Date.now()}.jpg`,
          proofFile,
        );
        await supabase.rpc("attach_proof", {
          code: order.accessCode,
          proof_url: url,
        });
      }
    } catch (e) {
      console.error(e);
    }
    setOrder((c: any) => ({ ...c, proof: url, proof_url: url }));
    setSent(true);
    setSending(false);
    const msg = `📎 Comprovante de pagamento — Pedido ${order.id} · Cliente: ${order.customer} · Valor: ${money(needsEntry ? entry : total)} · Forma: ${order.payment}`;
    if (!openWhatsApp(settings?.whatsapp_number, msg))
      toast.success("Comprovante enviado (simulado)", { description: msg });
  };

  return (
    <div className="app-shell">
      <Header title="Status do pedido" onLogo={() => go("home")} />
      <main className="page success-page">
        <div className="success-icon">
          <Check size={32} />
        </div>
        <span className="eyebrow">Pedido {order.id}</span>
        {order.accessCode && (
          <div
            style={{
              background: "#e2f0e7",
              padding: "12px",
              borderRadius: "10px",
              margin: "10px 0",
              textAlign: "center",
            }}
          >
            <strong style={{ color: "#235842", fontSize: "14px" }}>
              Código de acesso:{" "}
              <span style={{ fontSize: "18px" }}>{order.accessCode}</span>
            </strong>
            <p
              style={{ margin: "5px 0 0", fontSize: "11px", color: "#66564e" }}
            >
              Guarde para acompanhar depois, em Conta → Acompanhar por código.
            </p>
          </div>
        )}
        <h1>
          {sent ? "Comprovante enviado." : "Pedido recebido com carinho."}
        </h1>
        <div className="order-status">
          <b>
            {order.payment_confirmed || order.confirmed
              ? "PAGAMENTO CONFIRMADO"
              : isCash
                ? "PEDIDO CONFIRMADO"
                : "AGUARDANDO CONFIRMAÇÃO DO PAGAMENTO"}
          </b>
          <span>Cliente: {order.customer}</span>
          <div className="status-summary">
            <span>Total</span>
            <strong>{money(total)}</strong>
            <span>
              {order.payFull && !isCash
                ? "PAGO"
                : needsEntry
                  ? "Entrada"
                  : "A pagar"}
            </span>
            <strong>{isCash ? "—" : money(needsEntry ? entry : total)}</strong>
            {needsEntry && (
              <>
                <span>Saldo</span>
                <strong>{money(entry)}</strong>
              </>
            )}
          </div>
          <div className="status-line">
            {STATUS_SEQ.map((s, i) => (
              <i key={s} className={i <= idx ? "on" : ""} />
            ))}
          </div>
          <small>Status atual: {STATUS_SEQ[idx]}.</small>
        </div>
        {proofNeeded && !sent && (
          <div className="proof-card">
            <div>
              <span className="eyebrow">
                {order.payFull ? "pagamento integral" : "entrada"} ·{" "}
                {order.payment}
              </span>
              <h2>Envie o comprovante</h2>
              <p>
                Escolha uma foto da câmera ou da galeria. Você verá a imagem
                antes de enviar.
              </p>
            </div>
            <div className="proof-pickers">
              <label>
                <Camera size={18} /> Tirar foto
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => handleFile(e.target.files?.[0])}
                />
              </label>
              <label>
                <ImageIcon size={18} /> Escolher da galeria
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFile(e.target.files?.[0])}
                />
              </label>
            </div>
            {proofPreview && (
              <div className="proof-preview">
                <img src={proofPreview} />
                <span>Pré-visualização do comprovante</span>
                <Button
                  variant="whatsapp"
                  onClick={sendProof}
                  disabled={sending}
                >
                  <HeartHandshake size={17} />{" "}
                  {sending ? "Enviando..." : "Enviar comprovante pelo WhatsApp"}
                </Button>
              </div>
            )}
          </div>
        )}
        {!proofNeeded && isCash && (
          <div className="cash-note">
            <DollarSign size={20} />
            <b>
              Pagamento: dinheiro na{" "}
              {order.delivery === "Retirada" ? "retirada" : "entrega"}
            </b>
            <span>Não é necessário enviar comprovante.</span>
          </div>
        )}
        <WhatsAppBtn
          number={settings?.whatsapp_number}
          text={`Pedido ${order.id} · ${order.customer}`}
        />
        <Button onClick={() => go("home")}>Voltar ao catálogo</Button>
      </main>
    </div>
  );
}

function TrackPage({ settings, go }: any) {
  const [code, setCode] = useState("");
  const [order, setOrder] = useState<any | null>(null);

  const lookup = async () => {
    if (!hasSupabase) {
      toast.error("Disponível apenas com Supabase configurado.");
      return;
    }
    const { data } = await supabase.rpc("get_order_by_access_code", {
      code: code.trim().toUpperCase(),
    });
    if (data && data.length) setOrder(normalize(data[0]));
    else toast.error("Código não encontrado.");
  };

  return (
    <div className="app-shell">
      <Header
        title="Acompanhar pedido"
        back
        onBack={() => go("home")}
        onLogo={() => go("home")}
      />
      <main className="page">
        {!order ? (
          <>
            <h1>Tem um código?</h1>
            <p className="muted">
              Digite o código de acesso que apareceu ao finalizar o pedido.
            </p>
            <label>
              Código
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Ex.: A1B2C3"
              />
            </label>
            <Button onClick={lookup}>
              Ver status <ArrowRight size={16} />
            </Button>
          </>
        ) : (
          <StatusView
            order={order}
            setOrder={setOrder}
            settings={settings}
            go={go}
          />
        )}
      </main>
    </div>
  );
}

function normalize(o: any) {
  return {
    ...o,
    payment:
      o.payment_method === "CARTAO"
        ? "Cartão"
        : o.payment_method === "PIX"
          ? "PIX"
          : "Dinheiro",
    payFull: o.entry_pct === 1,
    customer: o.customer_name,
    delivery: o.delivery_mode === "RETIRADA" ? "Retirada" : "Entrega",
    total: orderTotal(o),
  };
}
