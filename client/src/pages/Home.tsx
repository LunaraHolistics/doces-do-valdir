/* Produtos do Valdir — Supabase real: catálogo, pedidos, operação, gestão, fotos e WhatsApp. */
import { useMemo, useState, useEffect } from "react";
import { toast } from "sonner";
import {
  ArrowLeft, ArrowRight, BarChart3, Camera, Check, ChevronRight, ClipboardList,
  Copy, CreditCard, DollarSign, HeartHandshake, Home as HomeIcon, Image as ImageIcon,
  LayoutDashboard, MapPin, Package, Pencil, Plus, Search, Settings, ShoppingBag,
  ShoppingCart, Store, Trash2, Truck, UserRound, Users, WalletCards, X, Zap
} from "lucide-react";
import { supabase, hasSupabase } from "../lib/supabase";
import { signIn, signOut, getRole, onAuthChange, currentSession } from "../lib/auth";

const IMG = {
  hero: "/manus-storage/hero-doces_8c4d1eff.jpg",
  snacks: "/manus-storage/snacks-doces_a4125768.jpg",
  utility: "/manus-storage/utilidades-balcao_63f266d3.jpg",
  logo: "/logo-valdir.png",
  doces: "/doces.svg",
  balas: "/balas.svg",
  lanches: "/lanches.svg",
  utilidades: "/utilidades.svg",
};

const LOGO_STYLE = {width: "auto", objectFit: "contain", borderRadius: 10} as const;

const money = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const moneyFromCents = (cents: number) => money(cents / 100);

const CATNAMES: Record<number, string> = {1: "Doces", 2: "Balas", 3: "Lanches", 4: "Utilidades"};

const MOCK_PRODUCTS = [
  {id:"p1",category_id:1,name:"Doce de leite cremoso",description:"Pote 400g, textura cremosa e sabor de fazenda.",price_cents:1290,cost_cents:700,stock:18,image_url:IMG.doces,active:true},
  {id:"p2",category_id:1,name:"Paçoca rolha",description:"Pacotinho com 6 unidades.",price_cents:750,cost_cents:400,stock:24,image_url:IMG.doces,active:true},
  {id:"p3",category_id:1,name:"Pé de moleque",description:"Crocante, feito com amendoim selecionado.",price_cents:890,cost_cents:480,stock:14,image_url:IMG.doces,active:true},
  {id:"p4",category_id:1,name:"Doce de amendoim",description:"Doce macio em embalagem individual.",price_cents:690,cost_cents:350,stock:21,image_url:IMG.doces,active:true},
  {id:"p5",category_id:2,name:"Bala sortida",description:"Mix colorido para adoçar o dia.",price_cents:500,cost_cents:250,stock:42,image_url:IMG.balas,active:true},
  {id:"p6",category_id:2,name:"Bala de goma",description:"Pacote 200g com sabores variados.",price_cents:650,cost_cents:320,stock:27,image_url:IMG.balas,active:true},
  {id:"p7",category_id:2,name:"Chiclete hortelã",description:"Cartela com 10 unidades.",price_cents:390,cost_cents:180,stock:36,image_url:IMG.balas,active:true},
  {id:"p8",category_id:2,name:"Pirulito coração",description:"Unidade, sabores sortidos.",price_cents:150,cost_cents:60,stock:56,image_url:IMG.balas,active:true},
  {id:"p9",category_id:3,name:"Salgadinho queijo",description:"Pacote crocante 90g.",price_cents:490,cost_cents:260,stock:33,image_url:IMG.lanches,active:true},
  {id:"p10",category_id:3,name:"Biscoito caseiro",description:"Pacote 250g.",price_cents:790,cost_cents:420,stock:16,image_url:IMG.lanches,active:true},
  {id:"p11",category_id:3,name:"Chocolate ao leite",description:"Barra 90g.",price_cents:690,cost_cents:380,stock:19,image_url:IMG.lanches,active:true},
  {id:"p12",category_id:3,name:"Suco em pó uva",description:"Rende 1 litro.",price_cents:199,cost_cents:90,stock:48,image_url:IMG.lanches,active:true},
  {id:"p13",category_id:4,name:"Pilha AA",description:"Cartela com 2 unidades.",price_cents:1200,cost_cents:700,stock:11,image_url:IMG.utilidades,active:true},
  {id:"p14",category_id:4,name:"Pilha AAA",description:"Cartela com 2 unidades.",price_cents:1200,cost_cents:700,stock:8,image_url:IMG.utilidades,active:true},
  {id:"p15",category_id:4,name:"Caixa de fósforos",description:"Caixa com 40 palitos.",price_cents:350,cost_cents:150,stock:17,image_url:IMG.utilidades,active:true},
  {id:"p16",category_id:4,name:"Vela de aniversário",description:"Kit com 10 unidades.",price_cents:400,cost_cents:180,stock:29,image_url:IMG.utilidades,active:true},
];

const MOCK_CATEGORIES = [
  {id:1,name:"Doces",sort:1},
  {id:2,name:"Balas",sort:2},
  {id:3,name:"Lanches",sort:3},
  {id:4,name:"Utilidades",sort:4},
];

const STATUS_SEQ = [
  "NOVO",
  "CONFIRMADO",
  "AGUARDANDO PAGAMENTO",
  "SEPARANDO",
  "PRONTO PARA ROTA",
  "CONCLUÍDO"
];

const ALL_STATUSES = [...STATUS_SEQ, "PENDENTE DE ENTREGA"];

const mockOrders = [
  {id:"DV-1048", number:"DV-1048", customer_name:"Dona Célia", city:"Ribeirão Preto", region:"Zona Norte", total_cents:8640, status:"NOVO", urgent:true, payment_method:"PIX", payment_confirmed:true, items:"Doce de leite, paçoca rolha"},
  {id:"DV-1047", number:"DV-1047", customer_name:"Marcos Lima", city:"Ribeirão Preto", region:"Centro", total_cents:4290, status:"CONFIRMADO", urgent:false, payment_method:"CARTAO", payment_confirmed:false, items:"Biscoito, chocolate"},
  {id:"DV-1046", number:"DV-1046", customer_name:"Ana Paula", city:"Ribeirão Preto", region:"Zona Sul", total_cents:12590, status:"AGUARDANDO PAGAMENTO", urgent:true, payment_method:"PIX", payment_confirmed:false, items:"Kit doces variados"},
  {id:"DV-1045", number:"DV-1045", customer_name:"João Ferreira", city:"Ribeirão Preto", region:"Zona Norte", total_cents:6450, status:"SEPARANDO", urgent:false, payment_method:"DINHEIRO", payment_confirmed:false, items:"Salgadinho, suco, bala"},
  {id:"DV-1044", number:"DV-1044", customer_name:"Lúcia Martins", city:"Ribeirão Preto", region:"Zona Leste", total_cents:9200, status:"PRONTO PARA ROTA", urgent:false, payment_method:"PIX", payment_confirmed:true, items:"Paçoca, doces"},
  {id:"DV-1043", number:"DV-1043", customer_name:"Rafael Souza", city:"Araraquara", region:"Encomenda", total_cents:15580, status:"PENDENTE DE ENTREGA", urgent:false, payment_method:"PIX", payment_confirmed:true, items:"Caixa festa"},
  {id:"DV-1042", number:"DV-1042", customer_name:"Bia Costa", city:"Ribeirão Preto", region:"Centro", total_cents:3850, status:"CONCLUÍDO", urgent:false, payment_method:"DINHEIRO", payment_confirmed:false, items:"Balas e chicletes"},
  {id:"DV-1041", number:"DV-1041", customer_name:"Carlos Nunes", city:"Ribeirão Preto", region:"Zona Sul", total_cents:7490, status:"CONCLUÍDO", urgent:false, payment_method:"CARTAO", payment_confirmed:true, items:"Chocolate, biscoito"},
];

const routeOrders = [
  {id:"DV-1048", name:"Dona Célia", urgent:true},
  {id:"DV-1045", name:"João Ferreira", urgent:false},
  {id:"DV-1050", name:"Zeca Neto", urgent:true},
  {id:"DV-1051", name:"Neide Alves", urgent:false},
  {id:"DV-1052", name:"Seu Antônio", urgent:false},
];

const REASONS = [
  "Não estava em casa",
  "Endereço errado",
  "Cliente pediu reagendamento",
  "Outro"
];

const mockHistory = [
  {
    id: "DV-1038",
    date: "08 ago 2026",
    status: "CONCLUÍDO",
    items: [
      {id:"p1", qty:2, price:12.9},
      {id:"p2", qty:2, price:7.5},
      {id:"p5", qty:4, price:5}
    ]
  },
  {
    id: "DV-0982",
    date: "22 jul 2026",
    status: "CONCLUÍDO",
    items: [
      {id:"p11", qty:3, price:6.9},
      {id:"p10", qty:2, price:7.9}
    ]
  },
];

const historyTotal = (o: any) =>
  o.items.reduce((s: number, it: any) => s + it.qty * it.price, 0);

const orderTotal = (o: any) => (o.total_cents != null ? o.total_cents / 100 : (o.total || 0));
const orderEntry = (o: any) => (o.entry_cents != null ? o.entry_cents / 100 : orderTotal(o) / 2);
const orderBalance = (o: any) => (o.balance_cents != null ? o.balance_cents / 100 : orderTotal(o) - orderEntry(o));
const orderLabel = (o: any) => o.number || o.id;
const orderName = (o: any) => o.customer_name || "Cliente";
const statusIdx = (s: string) => STATUS_SEQ.indexOf(s);
const payLabel = (o: any) => {
  const m = o.payment_method === "CARTAO" ? "Cartão" : o.payment_method === "PIX" ? "PIX" : "Dinheiro";
  if (o.payment_method === "DINHEIRO") return "Dinheiro";
  return o.payment_confirmed ? `${m} · pago/confirmado` : `${m} · aguardando`;
};

// ---------- Storage + WhatsApp ----------
async function uploadToBucket(bucket: string, path: string, file: File) {
  const { error } = await supabase.storage.from(bucket).upload(path, file, {upsert: true});
  if (error) throw error;
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

function waLink(number: string, text: string) {
  const digits = (number || "").replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

function openWhatsApp(number: string | undefined, text: string) {
  if (number && number.replace(/\D/g, "").length >= 10) {
    window.open(waLink(number, text), "_blank");
    return true;
  }
  return false;
}

function useOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  useEffect(() => {
    const load = async () => {
      if (!hasSupabase) { setOrders(mockOrders); return; }
      const { data } = await supabase.from("orders").select("*").order("created_at", {ascending: false});
      setOrders(data || []);
    };
    load();
  }, []);
  const patch = async (id: string, changes: any) => {
    if (hasSupabase) await supabase.from("orders").update(changes).eq("id", id);
    setOrders(os => os.map(o => (o.id === id ? {...o, ...changes} : o)));
  };
  return {orders, patch};
}

function useProducts() {
  const [prods, setProds] = useState<any[]>([]);
  useEffect(() => {
    const load = async () => {
      if (!hasSupabase) { setProds(MOCK_PRODUCTS); return; }
      const { data } = await supabase.from("products").select("*").order("name");
      setProds(data && data.length ? data : MOCK_PRODUCTS);
    };
    load();
  }, []);
  const patchProd = async (id: string, changes: any) => {
    if (hasSupabase) await supabase.from("products").update(changes).eq("id", id);
    setProds(ps => ps.map(p => (p.id === id ? {...p, ...changes} : p)));
  };
  const insertProd = async (obj: any) => {
    if (hasSupabase) {
      const { data } = await supabase.from("products").insert(obj).select().single();
      if (data) setProds(ps => [data, ...ps]);
    } else {
      setProds(ps => [{...obj, id: "p" + Date.now()}, ...ps]);
    }
  };
  return {prods, patchProd, insertProd};
}

function useSettings() {
  const [settings, setSettings] = useState<any>(null);
  useEffect(() => {
    if (!hasSupabase) return;
    supabase.from("settings").select("*").eq("id", 1).maybeSingle().then(({data}) => setSettings(data || null));
  }, []);
  const saveSettings = async (form: any) => {
    if (hasSupabase) await supabase.from("settings").update(form).eq("id", 1);
    setSettings((s: any) => ({...s, ...form}));
  };
  return {settings, saveSettings};
}

function Logo({small = false, onClick}: {small?: boolean; onClick?: () => void}) {
  const inner = (
    <>
      <img
        src={IMG.logo}
        alt="Produtos do Valdir"
        style={small
          ? {...LOGO_STYLE, height: 46, maxWidth: 74}
          : {...LOGO_STYLE, height: 58, maxWidth: 92}}
      />
      <div>
        <strong>Produtos do</strong>
        <b>Valdir</b>
      </div>
    </>
  );

  return onClick
    ? <button className="brand brand-btn" onClick={onClick} aria-label="Voltar para a página inicial">{inner}</button>
    : <div className="brand">{inner}</div>;
}

function Button({children, onClick, variant = "primary", className = "", disabled = false}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: string;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={`btn btn-${variant} ${className}`}
    >
      {children}
    </button>
  );
}

function Header({title, back, onBack, cart = 0, goCart, subtitle, onLogo}: {
  title?: string;
  back?: boolean;
  onBack?: () => void;
  cart?: number;
  goCart?: () => void;
  subtitle?: string;
  onLogo?: () => void;
}) {
  return (
    <header className="topbar">
      {back
        ? <button className="icon-btn" onClick={onBack} aria-label="Voltar">
            <ArrowLeft size={21}/>
          </button>
        : <Logo small onClick={onLogo}/>
      }
      <div className="head-title">
        {title && <strong>{title}</strong>}
        {subtitle && <span>{subtitle}</span>}
      </div>
      {goCart
        ? <button className="cart-icon" onClick={goCart} aria-label="Abrir carrinho">
            <ShoppingCart size={21}/>
            {cart > 0 && <i>{cart}</i>}
          </button>
        : <span className="icon-btn" aria-hidden="true"/>
      }
    </header>
  );
}

function Stepper({current}: {current: number}) {
  return (
    <div className="stepper">
      <span className={current > 1 ? "done" : current === 1 ? "current" : ""}>1</span>
      <i/>
      <span className={current > 2 ? "done" : current === 2 ? "current" : ""}>2</span>
      <i/>
      <span className={current > 3 ? "done" : current === 3 ? "current" : ""}>3</span>
    </div>
  );
}

function BottomNav({items, active, onSelect}: {
  items: {id: string; label: string; icon: any}[];
  active: string;
  onSelect: (id: string) => void;
}) {
  return (
    <nav className="bottom-nav">
      {items.map(i => (
        <button
          key={i.id}
          className={active === i.id ? "active" : ""}
          onClick={() => onSelect(i.id)}
        >
          <i>{i.icon}</i>
          <span>{i.label}</span>
        </button>
      ))}
    </nav>
  );
}

function WhatsApp({text, number}: {text?: string; number?: string}) {
  const msg = text || "Olá, Valdir! Estou vendo o catálogo da loja e gostaria de tirar uma dúvida.";
  return (
    <Button
      variant="whatsapp"
      onClick={() => {
        if (!openWhatsApp(number, msg)) {
          toast.success("WhatsApp simulado", {description: msg});
        }
      }}
    >
      <HeartHandshake size={18}/>
      Falar com Valdir
    </Button>
  );
}

function PhotoPicker({onPick}: {onPick: (file: File, preview: string) => void}) {
  const handle = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onPick(file, String(reader.result));
    reader.readAsDataURL(file);
  };
  return (
    <div className="proof-pickers">
      <label>
        <Camera size={18}/>
        Tirar foto
        <input type="file" accept="image/*" capture="environment" onChange={e => handle(e.target.files?.[0])}/>
      </label>
      <label>
        <ImageIcon size={18}/>
        Escolher da galeria
        <input type="file" accept="image/*" onChange={e => handle(e.target.files?.[0])}/>
      </label>
    </div>
  );
}

function ProductCard({p, qty, onAdd, onOpen}: {
  p: any;
  qty: number;
  onAdd: () => void;
  onOpen: () => void;
}) {
  return (
    <article className="product-card" onClick={onOpen}>
      <div className="product-img">
        <img src={p.image_url}/>
        {p.id === "p1" && <span className="tag">favorito da casa</span>}
      </div>
      <div className="product-info">
        <h3>{p.name}</h3>
        <span className="stock">{p.stock} disponíveis</span>
        <strong>{moneyFromCents(p.price_cents)}</strong>
        <div className="card-action" onClick={e => {e.stopPropagation(); onAdd()}}>
          {qty > 0 ? (
            <>
              <button onClick={e => {e.stopPropagation();}}>-</button>
              <b>{qty}</b>
              <button onClick={e => {e.stopPropagation(); onAdd()}}>+</button>
            </>
          ) : (
            <>
              <Plus size={17}/>
              adicionar
            </>
          )}
        </div>
      </div>
    </article>
  );
}

export default function Home() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const {settings} = useSettings();

  const [authUser, setAuthUser] = useState<string | null>(null);
  const [authRole, setAuthRole] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(!hasSupabase);

  useEffect(() => {
    if (!hasSupabase) {
      setAuthReady(true);
      return;
    }
    const init = async () => {
      const session = await currentSession();
      const uid = session?.user?.id || null;
      setAuthUser(uid);
      if (uid) setAuthRole(await getRole(uid));
      setAuthReady(true);
    };
    init();
    const sub = onAuthChange((uid) => {
      setAuthUser(uid);
      if (uid) getRole(uid).then(setAuthRole);
      else setAuthRole(null);
    });
    return () => sub.data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const load = async () => {
      if (!hasSupabase) {
        setProducts(MOCK_PRODUCTS);
        setCategories(MOCK_CATEGORIES);
        setLoading(false);
        return;
      }

      try {
        const [prodRes, catRes] = await Promise.all([
          supabase.from("products").select("*").eq("active", true).order("name"),
          supabase.from("categories").select("*").eq("active", true).order("sort")
        ]);

        if (prodRes.data && prodRes.data.length > 0) {
          setProducts(prodRes.data);
          setCategories(catRes.data || []);
        } else {
          setProducts(MOCK_PRODUCTS);
          setCategories(MOCK_CATEGORIES);
        }
      } catch (err) {
        console.error("Erro ao carregar do Supabase:", err);
        setProducts(MOCK_PRODUCTS);
        setCategories(MOCK_CATEGORIES);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const initialPath = typeof window !== "undefined" ? window.location.pathname : "/";
  const [experience, setExperience] = useState<"client" | "operator" | "manager">(
    initialPath.startsWith("/operacao") ? "operator" :
    initialPath.startsWith("/gestao") ? "manager" : "client"
  );
  const [accessGranted, setAccessGranted] = useState(false);
  const [clientScreen, setClientScreen] = useState("home");
  const [selected, setSelected] = useState<any | null>(null);
  const [category, setCategory] = useState("Todos");
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState<Record<string, number>>({p1: 1, p5: 2});
  const [checkoutStep, setCheckoutStep] = useState(1);
  const [orderSent, setOrderSent] = useState(false);
  const [orderDetails, setOrderDetails] = useState<any>({
    id: "DV-1048",
    payment: "PIX",
    delivery: "Entrega",
    customer: "João Silva",
    confirmed: false,
    proof: null,
    total: 0
  });
  const [clientAuth, setClientAuth] = useState(false);
  const [opScreen, setOpScreen] = useState("home");
  const [managerTab, setManagerTab] = useState("dashboard");
  const [toastText, setToastText] = useState("");

  useEffect(() => {
    if (!authReady) return;
    const ok = experience === "manager"
      ? authRole === "manager"
      : (authRole === "operator" || authRole === "manager");
    if (ok) setAccessGranted(true);
  }, [authReady, authRole, experience]);

  const cartItems = useMemo(() =>
    Object.entries(cart)
      .filter(([, q]) => q > 0)
      .map(([id, q]) => ({p: products.find(p => p.id === id), q}))
      .filter(({p}) => p),
    [cart, products]
  );

  const cartTotal = cartItems.reduce((s, {p, q}) =>
    s + (p?.price_cents || 0) * q, 0
  ) / 100;

  const add = (id: string) => setCart(c => ({...c, [id]: (c[id] || 0) + 1}));
  const remove = (id: string) => setCart(c => ({...c, [id]: Math.max(0, (c[id] || 0) - 1)}));
  const clear = (id: string) => setCart(c => {
    const n = {...c};
    delete n[id];
    return n;
  });

  const notify = (text: string) => {
    setToastText(text);
    setTimeout(() => setToastText(""), 2600);
  };

  const leaveProtectedArea = () => {
    window.history.pushState({}, "", "/");
    setAccessGranted(false);
    setExperience("client");
  };

  const signOutAndLeave = async () => {
    if (hasSupabase) await signOut();
    setAccessGranted(false);
    setAuthRole(null);
    leaveProtectedArea();
    toast.success("Você saiu da conta.");
  };

  if (loading) {
    return (
      <div className="app-shell" style={{display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh"}}>
        <div style={{textAlign: "center", color: "#66564e"}}>
          <p>Carregando catálogo...</p>
        </div>
      </div>
    );
  }

  if (experience === "client") {
    return (
      <ClientApp
        products={products}
        categories={categories}
        settings={settings}
        clientScreen={clientScreen}
        setClientScreen={setClientScreen}
        selected={selected}
        setSelected={setSelected}
        category={category}
        setCategory={setCategory}
        query={query}
        setQuery={setQuery}
        cart={cart}
        setCart={setCart}
        cartItems={cartItems}
        cartTotal={cartTotal}
        add={add}
        remove={remove}
        clear={clear}
        checkoutStep={checkoutStep}
        setCheckoutStep={setCheckoutStep}
        orderSent={orderSent}
        setOrderSent={setOrderSent}
        orderDetails={orderDetails}
        setOrderDetails={setOrderDetails}
        clientAuth={clientAuth}
        setClientAuth={setClientAuth}
        notify={notify}
        onExit={leaveProtectedArea}
      />
    );
  }

  if (!authReady) {
    return (
      <div className="app-shell" style={{display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh"}}>
        <p style={{color: "#66564e"}}>Verificando acesso...</p>
      </div>
    );
  }

  if (!accessGranted) {
    return (
      <ProtectedEntry
        kind={experience}
        onUnlock={() => setAccessGranted(true)}
        onBack={leaveProtectedArea}
      />
    );
  }

  if (experience === "operator") {
    return (
      <OperatorApp
        screen={opScreen}
        setScreen={setOpScreen}
        onExit={leaveProtectedArea}
        onSignOut={signOutAndLeave}
      />
    );
  }

  return (
    <ManagerApp
      tab={managerTab}
      setTab={setManagerTab}
      onExit={leaveProtectedArea}
      onSignOut={signOutAndLeave}
    />
  );
}

function ClientApp(props: any) {
  const {
    products, categories, settings, clientScreen, setClientScreen, selected, setSelected,
    category, setCategory, query, setQuery, cart, cartItems, cartTotal, add, remove, clear,
    clientAuth, setClientAuth, notify
  } = props;

  const whatsNumber = settings?.whatsapp_number;

  const cats = ["Todos", ...categories.map((c: any) => c.name)];
  const filtered = products.filter((p: any) => {
    const catName = categories.find((c: any) => c.id === p.category_id)?.name || "Outros";
    return (category === "Todos" || catName === category) &&
      p.name.toLowerCase().includes(query.toLowerCase());
  });

  const go = (s: string) => {
    setClientScreen(s);
    window.scrollTo({top: 0, behavior: "smooth"});
  };

  const nav = (
    <BottomNav
      items={[
        {id: "home", label: "Início", icon: <HomeIcon size={19}/>},
        {id: "cart", label: "Carrinho", icon: <ShoppingCart size={19}/>},
        {id: "account", label: "Conta", icon: <UserRound size={19}/>}
      ]}
      active={clientScreen}
      onSelect={(id) => go(id)}
    />
  );

  if (clientScreen === "product" && selected) {
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
          <img className="product-hero" src={selected.image_url}/>
          <div className="product-detail">
            <span className="eyebrow">{categories.find((c: any) => c.id === selected.category_id)?.name} · {selected.stock} disponíveis</span>
            <h1>{selected.name}</h1>
            <p>{selected.description}</p>
            <strong className="price-lg">{moneyFromCents(selected.price_cents)}</strong>
            <div className="qty-line">
              <span>Quantidade</span>
              <div className="qty">
                <button onClick={() => remove(selected.id)}>−</button>
                <b>{cart[selected.id] || 0}</b>
                <button onClick={() => add(selected.id)}>+</button>
              </div>
            </div>
            <Button onClick={() => {add(selected.id); notify("Produto adicionado ao carrinho");}}>
              Adicionar ao carrinho <ArrowRight size={17}/>
            </Button>
            <WhatsApp
              number={whatsNumber}
              text={`Olá, Valdir! Tenho uma dúvida sobre ${selected.name}.`}
            />
          </div>
        </main>
      </div>
    );
  }

  if (clientScreen === "cart") {
    return (
      <div className="app-shell">
        <Header title="Meu carrinho" back onBack={() => go("home")} onLogo={() => go("home")}/>
        <main className="page">
          <Stepper current={1}/>
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
                {cartItems.map(({p, q}: any) => (
                  <div className="cart-row" key={p.id}>
                    <img src={p.image_url}/>
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
                          <Trash2 size={15}/>
                        </button>
                      </div>
                    </div>
                    <strong>{money(p.price_cents * q / 100)}</strong>
                  </div>
                ))}
              </div>
              <div className="summary">
                <span>Subtotal</span>
                <b>{money(cartTotal)}</b>
                <span>Entrega</span>
                <b className="muted">a combinar</b>
                <hr/>
                <strong>Total</strong>
                <strong className="total">{money(cartTotal)}</strong>
              </div>
              <Button onClick={() => go("checkout")}>
                Avançar para o pedido <ArrowRight size={18}/>
              </Button>
              <WhatsApp number={whatsNumber}/>
            </>
          )}
          <button className="link-btn" onClick={() => go("home")}>
            <ArrowLeft size={16}/>
            Continuar comprando
          </button>
        </main>
        {nav}
      </div>
    );
  }

  if (clientScreen === "checkout") {
    return <Checkout {...props} go={go}/>;
  }

  if (clientScreen === "order") {
    return <OrderStatus {...props} go={go}/>;
  }

  if (clientScreen === "account" || clientScreen === "history" || clientScreen === "orderDetail") {
    return <Account {...props} go={go}/>;
  }

  return (
    <div className="app-shell">
      <header className="client-hero">
        <div className="hero-top">
          <Logo onClick={() => go("home")}/>
          <button
            className="account-btn"
            onClick={() => {setClientAuth(true); go("account")}}
            aria-label="Minha conta"
          >
            <UserRound size={19}/>
          </button>
        </div>
        <div className="hero-copy">
          <span>feito para adoçar seu dia</span>
          <h1>Escolha seus favoritos de hoje.</h1>
        </div>
        <img src={IMG.hero}/>
      </header>
      <main className="page catalog-page">
        <div className="searchbox">
          <Search size={18}/>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar um doce, uma pilha..."
          />
        </div>
        <div className="catalog-actions">
          <WhatsApp number={whatsNumber}/>
          <button
            className="install"
            onClick={() => notify("No celular, use 'Adicionar à tela inicial'")}
          >
            <Zap size={16}/>
            instalar loja
          </button>
        </div>
        <div className="section-head">
          <div>
            <span className="eyebrow">do balcão para sua casa</span>
            <h2>O que você procura?</h2>
          </div>
          <button className="link-btn" onClick={() => setCategory("Todos")}>
            ver tudo <ArrowRight size={15}/>
          </button>
        </div>
        <div className="chips">
          {cats.map(c => (
            <button
              key={c}
              className={category === c ? "selected" : ""}
              onClick={() => setCategory(c)}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="featured" onClick={() => {setSelected(products[0]); go("product")}}>
          <img src={products[0]?.image_url || IMG.doces}/>
          <div>
            <span className="tag">favorito da casa</span>
            <h2>{products[0]?.name || "Doce de leite cremoso"}</h2>
            <p>{products[0]?.description || "Uma colherada e você entende."}</p>
            <b>{moneyFromCents(products[0]?.price_cents || 1290)}</b>
          </div>
          <ArrowRight/>
        </div>
        <div className="section-head">
          <h2>Mais pedidos</h2>
          <span className="muted">{filtered.length} produtos</span>
        </div>
        <div className="product-grid">
          {filtered.map((p: any) => (
            <ProductCard
              key={p.id}
              p={p}
              qty={cart[p.id] || 0}
              onAdd={() => {add(p.id); notify(`${p.name} foi para o carrinho`)}}
              onOpen={() => {setSelected(p); go("product")}}
            />
          ))}
        </div>
      </main>
      {nav}
    </div>
  );
}

function Checkout({cartItems, cartTotal, checkoutStep, setCheckoutStep, setOrderSent, setOrderDetails, go, notify, settings}: any) {
  const [city, setCity] = useState("Ribeirão Preto");
  const [delivery, setDelivery] = useState("Entrega");
  const [urgent, setUrgent] = useState(false);
  const [payment, setPayment] = useState("PIX");
  const [payFull, setPayFull] = useState(false);
  const [pixCopied, setPixCopied] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [localName, setLocalName] = useState("");
  const [addr, setAddr] = useState("");
  const [num, setNum] = useState("");
  const [district, setDistrict] = useState("");
  const [region, setRegion] = useState("Zona Norte");
  const [submitting, setSubmitting] = useState(false);

  const pixKey = settings?.pix_key || "valdirjamado@gmail.com";
  const pixHolder = settings?.pix_holder || "Valdir J. Amado";
  const pickupEnabled = !settings || settings.pickup_enabled !== false;
  const whatsNumber = settings?.whatsapp_number;
  const pct = payment === "PIX"
    ? Number(settings?.entry_pct_pix ?? 0.5)
    : Number(settings?.entry_pct_card ?? 0.5);
  const araraquaraDate = settings?.araraquara_next_date
    ? String(settings.araraquara_next_date).split("-").reverse().join("/")
    : "15/08/2026";

  const entry = cartTotal * pct;
  const needsEntry = payment !== "Dinheiro" && !payFull;
  const amountToPay = needsEntry ? entry : cartTotal;
  const orderNumber = "DV-" + Math.floor(1000 + Math.random() * 9000);

  const addressLine = city === "Araraquara"
    ? "Encomenda — combinação de retirada/envio"
    : delivery === "Retirada"
    ? "Retirada no balcão do Valdir"
    : `${addr || "Rua..."}, ${num || "s/n"} – ${district || "Centro"}`;

  const whatsMsg = `🧾 Pedido ${orderNumber} · Produtos do Valdir
Cliente: ${name || "Visitante"}
Telefone: ${phone || "não informado"}
Cidade: ${city}
Modalidade: ${city === "Araraquara" ? "Encomenda" : delivery}
Local: ${localName || "—"}
Endereço: ${addressLine}
Região: ${city === "Araraquara" ? "Encomenda" : region}
Itens:
${cartItems.map(({p, q}: any) => `• ${q}x ${p.name} — ${money(p.price_cents * q / 100)}`).join("\n")}
Total: ${money(cartTotal)}
Pagamento: ${payment}
Valor a pagar: ${money(amountToPay)} (${payFull && payment !== "Dinheiro" ? "integral" : needsEntry ? `entrada ${Math.round(pct * 100)}%` : "total na entrega/retirada"})
${needsEntry ? `Saldo: ${money(cartTotal - entry)}` : ""}
Urgente: ${urgent ? "🚨 SIM — o quanto antes" : "não"}
Obs: —`;

  const submitOrder = async () => {
    setSubmitting(true);

    try {
      let accessCode = null;

      if (hasSupabase) {
        const orderData = {
          customer_name: name || "Visitante",
          customer_phone: phone || "",
          city,
          delivery_mode: city === "Araraquara" ? "ENCOMENDA" : delivery === "Retirada" ? "RETIRADA" : "ENTREGA",
          address_text: addressLine,
          region: city === "Araraquara" ? "Encomenda" : region,
          urgent,
          payment_method: payment === "Cartão" ? "CARTAO" : payment.toUpperCase(),
          entry_pct: needsEntry ? pct : 1,
          total_cents: Math.round(cartTotal * 100),
          entry_cents: Math.round(amountToPay * 100),
          balance_cents: Math.round((cartTotal - amountToPay) * 100),
        };

        const { data: order, error: orderErr } = await supabase
          .from("orders")
          .insert(orderData)
          .select()
          .single();

        if (orderErr) throw orderErr;

        accessCode = order.access_code;

        const items = cartItems.map(({p, q}: any) => ({
          order_id: order.id,
          product_id: p.id,
          product_name: p.name,
          qty: q,
          unit_price_cents: p.price_cents
        }));

        const { error: itemsErr } = await supabase.from("order_items").insert(items);
        if (itemsErr) throw itemsErr;
      }

      setOrderDetails({
        id: orderNumber,
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
        total: cartTotal
      });
      setOrderSent(true);

      if (!openWhatsApp(whatsNumber, whatsMsg)) {
        toast.success("Pedido enviado no WhatsApp (simulado)", {description: whatsMsg});
      }
      go("order");
    } catch (err: any) {
      console.error("Erro ao criar pedido:", err);
      toast.error("Erro ao salvar pedido: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="app-shell">
      <Header
        title="Fechar pedido"
        back
        onBack={() => checkoutStep === 1 ? go("cart") : setCheckoutStep(checkoutStep - 1)}
      />
      <main className="page">
        <Stepper current={checkoutStep === 1 ? 2 : 3}/>

        {checkoutStep === 1 && (
          <>
            <span className="eyebrow">etapa 2 de 3 · entrega</span>
            <h1>Como você recebe?</h1>
            <label>
              Nome
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Ex.: Maria de Souza"
              />
            </label>
            <label>
              Telefone
              <input
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="(16) 99999-9999"
              />
            </label>
            <Button
              variant="google"
              onClick={() => {setName("Maria de Souza"); notify("Login Google simulado: Maria de Souza")}}
            >
              G <span>Entrar com Google</span>
            </Button>
            <p className="muted">Você pode comprar sem cadastro.</p>
            <label>
              Localização
              <select value={city} onChange={e => setCity(e.target.value)}>
                <option>Ribeirão Preto</option>
                <option>Araraquara</option>
              </select>
            </label>

            {city === "Ribeirão Preto" ? (
              <div className="choice-row">
                <button
                  className={delivery === "Entrega" ? "chosen" : ""}
                  onClick={() => setDelivery("Entrega")}
                >
                  <Truck/>
                  <b>Entrega</b>
                  <span>Organizamos por região</span>
                </button>
                {pickupEnabled && (
                  <button
                    className={delivery === "Retirada" ? "chosen" : ""}
                    onClick={() => setDelivery("Retirada")}
                  >
                    <Store/>
                    <b>Retirada</b>
                    <span>opção habilitada</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="notice">
                <MapPin/>
                <b>Encomenda para Araraquara</b>
                <span>Próxima encomenda: <strong>{araraquaraDate}</strong></span>
              </div>
            )}

            {delivery === "Entrega" && city === "Ribeirão Preto" && (
              <>
                <label>
                  Nome do local
                  <input
                    value={localName}
                    onChange={e => setLocalName(e.target.value)}
                    placeholder="Casa da Maria"
                  />
                </label>
                <label>
                  Endereço
                  <input
                    value={addr}
                    onChange={e => setAddr(e.target.value)}
                    placeholder="Rua, avenida..."
                  />
                </label>
                <div className="two-cols">
                  <label>
                    Número
                    <input
                      value={num}
                      onChange={e => setNum(e.target.value)}
                      placeholder="123"
                    />
                  </label>
                  <label>
                    Bairro
                    <input
                      value={district}
                      onChange={e => setDistrict(e.target.value)}
                      placeholder="Centro"
                    />
                  </label>
                </div>
                <label>
                  Região
                  <select value={region} onChange={e => setRegion(e.target.value)}>
                    <option>Zona Norte</option>
                    <option>Centro</option>
                    <option>Zona Sul</option>
                    <option>Zona Leste</option>
                  </select>
                </label>
              </>
            )}

            {delivery === "Retirada" && city === "Ribeirão Preto" && (
              <div className="notice">
                <Store/>
                <b>Retirada no balcão</b>
                <span>{settings?.pickup_address || "Endereço de retirada: Rua dos Doces, 123 — referência: praça central."}</span>
              </div>
            )}

            <div className="urgency">
              <div>
                <Zap/>
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
              <small>Urgente sinaliza prioridade ao vendedor, não promete entrega imediata.</small>
            </div>

            <Button onClick={() => setCheckoutStep(2)}>
              Ir para pagamento <ArrowRight size={17}/>
            </Button>
          </>
        )}

        {checkoutStep === 2 && (
          <>
            <span className="eyebrow">etapa 3 de 3 · pagamento</span>
            <h1>Como você paga?</h1>
            <div className="pay-options">
              {["PIX", "Cartão", "Dinheiro"].map(p => (
                <button
                  className={payment === p ? "chosen" : ""}
                  onClick={() => {setPayment(p); setPayFull(false);}}
                  key={p}
                >
                  {p === "PIX" ? <WalletCards/> : p === "Cartão" ? <CreditCard/> : <DollarSign/>}
                  <b>{p}</b>
                  <span>{p === "Dinheiro" ? "a combinar" : "escolha abaixo"}</span>
                </button>
              ))}
            </div>

            {payment !== "Dinheiro" && (
              <div className="choice-row" style={{marginTop: 20}}>
                <button
                  className={!payFull ? "chosen" : ""}
                  onClick={() => setPayFull(false)}
                >
                  <b>Entrada {Math.round(pct * 100)}%</b>
                  <span>{money(entry)} agora, {money(cartTotal - entry)} na entrega</span>
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
                    notify("Chave PIX copiada com sucesso");
                  }}
                >
                  {pixCopied ? (
                    <>
                      <Check size={15}/>
                      chave copiada
                    </>
                  ) : (
                    <>
                      <Copy size={15}/>
                      copiar chave PIX
                    </>
                  )}
                </button>
                {pixCopied && (
                  <strong className="copy-success">
                    <Check size={14}/>
                    Pronto. A chave foi copiada para você colar no app do banco.
                  </strong>
                )}
                <small>Após pagar, volte ao status do pedido para enviar o comprovante.</small>
              </div>
            )}

            {payment === "Cartão" && (
              <div className="pix-box">
                <span>cartão · {payFull ? "integral" : `entrada ${Math.round(pct * 100)}%`}</span>
                <small>Os dados do cartão serão combinados com Valdir após a confirmação do pedido.</small>
              </div>
            )}

            <Button onClick={() => setCheckoutStep(3)}>
              Revisar pedido <ArrowRight size={17}/>
            </Button>
          </>
        )}

        {checkoutStep === 3 && (
          <>
            <span className="eyebrow">revisão final</span>
            <h1>Revise e envie</h1>
            <div className="summary">
              <span>Cliente</span>
              <b>{name || "Visitante"}</b>
              <span>Recebe</span>
              <b>{city === "Araraquara" ? "Encomenda Araraquara" : `${delivery} · ${region}`}</b>
              <span>Endereço</span>
              <b>{addressLine}</b>
              <span>Pagamento</span>
              <b>
                {payment} · {payment === "Dinheiro"
                  ? "total na entrega/retirada"
                  : payFull ? "integral" : `entrada ${Math.round(pct * 100)}%`}
              </b>
              {urgent && (
                <>
                  <span>Prioridade</span>
                  <b>🚨 URGENTE</b>
                </>
              )}
            </div>
            <div className="summary">
              {cartItems.map(({p, q}: any) => (
                <span key={p.id}>
                  {q}x {p.name} — {money(p.price_cents * q / 100)}
                </span>
              ))}
              <hr/>
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
              <pre style={{whiteSpace: "pre-wrap", margin: 0, fontSize: 12}}>
                {whatsMsg}
              </pre>
            </div>
            <Button onClick={submitOrder} disabled={submitting}>
              {submitting ? "Enviando..." : "Enviar pedido no WhatsApp"} <ArrowRight size={17}/>
            </Button>
          </>
        )}
      </main>
    </div>
  );
}

function OrderStatus({go, orderDetails, setOrderDetails, clientAuth, settings}: any) {
  const [proofPreview, setProofPreview] = useState<string | null>(orderDetails.proof);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [sent, setSent] = useState(Boolean(orderDetails.proof));
  const [sending, setSending] = useState(false);
  const total = orderDetails.total || 80;
  const entry = total / 2;
  const needsEntry = orderDetails.payment !== "Dinheiro" && !orderDetails.payFull;
  const proofNeeded = needsEntry && !orderDetails.confirmed;
  const idx = orderDetails.confirmed ? 3 : orderDetails.payment === "Dinheiro" ? 1 : 2;
  const whatsNumber = settings?.whatsapp_number;

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
      if (hasSupabase && orderDetails.accessCode && proofFile) {
        const path = `${orderDetails.accessCode}-${Date.now()}.jpg`;
        url = await uploadToBucket("proofs", path, proofFile);
        await supabase.rpc("attach_proof", {code: orderDetails.accessCode, proof_url: url});
      }
    } catch (e) {
      console.error("Falha no upload do comprovante:", e);
    }
    setOrderDetails((current: any) => ({...current, proof: url}));
    setSent(true);
    setSending(false);
    const msg = `📎 Comprovante de pagamento — Pedido ${orderDetails.id} · Cliente: ${orderDetails.customer} · Entrada: ${money(needsEntry ? entry : total)} · Forma: ${orderDetails.payment}`;
    if (!openWhatsApp(whatsNumber, msg)) {
      toast.success("Comprovante enviado pelo WhatsApp", {description: msg + " · imagem anexada"});
    }
  };

  return (
    <div className="app-shell">
      <Header title="Status do pedido" onLogo={() => go("home")}/>
      <main className="page success-page">
        <div className="success-icon">
          <Check size={32}/>
        </div>
        <span className="eyebrow">Pedido {orderDetails.id}</span>
        {orderDetails.accessCode && (
          <div style={{background: "#e2f0e7", padding: "12px", borderRadius: "10px", margin: "10px 0", textAlign: "center"}}>
            <strong style={{color: "#235842", fontSize: "14px"}}>
              Código de acesso: <span style={{fontSize: "18px"}}>{orderDetails.accessCode}</span>
            </strong>
            <p style={{margin: "5px 0 0", fontSize: "11px", color: "#66564e"}}>
              Use este código para acompanhar seu pedido
            </p>
          </div>
        )}
        <h1>{sent ? "Comprovante enviado." : "Pedido recebido com carinho."}</h1>
        <p>
          {sent
            ? "Valdir receberá a imagem com os dados desta entrada para conferir o pagamento."
            : "Acompanhe aqui a confirmação do seu pedido, sem precisar voltar ao catálogo."
          }
        </p>
        <div className="order-status">
          <b>
            {orderDetails.confirmed
              ? "PAGAMENTO CONFIRMADO"
              : orderDetails.payment === "Dinheiro"
              ? "PEDIDO CONFIRMADO"
              : "AGUARDANDO CONFIRMAÇÃO DO PAGAMENTO"
            }
          </b>
          <span>Cliente: {orderDetails.customer}</span>
          <div className="status-summary">
            <span>Total</span>
            <strong>{money(total)}</strong>
            <span>{orderDetails.payFull && orderDetails.payment !== "Dinheiro" ? "PAGO" : needsEntry ? "Entrada" : "A pagar"}</span>
            <strong>{orderDetails.payment === "Dinheiro" ? "—" : money(needsEntry ? entry : total)}</strong>
            {needsEntry && (
              <>
                <span>Saldo</span>
                <strong>{money(entry)}</strong>
              </>
            )}
          </div>
          <div className="status-line">
            {STATUS_SEQ.map((s, i) => (
              <i key={s} className={i <= idx ? "on" : ""}/>
            ))}
          </div>
          <small>
            Status atual: {STATUS_SEQ[idx]}.{" "}
            {orderDetails.confirmed
              ? "Valdir já confirmou a entrada. O pedido pode seguir para separação."
              : orderDetails.payment === "Dinheiro"
              ? `Pagamento: dinheiro na ${orderDetails.delivery.toLowerCase() === "retirada" ? "retirada" : "entrega"}.`
              : orderDetails.payFull
              ? "Pagamento integral ainda aguarda confirmação."
              : "A entrada ainda aguarda confirmação."
            }
          </small>
        </div>

        {proofNeeded && !sent && (
          <div className="proof-card">
            <div>
              <span className="eyebrow">{orderDetails.payFull ? "pagamento integral" : "entrada"} · {orderDetails.payment}</span>
              <h2>Envie o comprovante</h2>
              <p>Escolha uma foto da câmera ou da galeria. Você verá a imagem antes de enviar para Valdir.</p>
            </div>
            <div className="proof-pickers">
              <label htmlFor="proof-camera">
                <Camera size={18}/>
                Tirar foto
                <input
                  id="proof-camera"
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={e => handleFile(e.target.files?.[0])}
                />
              </label>
              <label htmlFor="proof-gallery">
                <ImageIcon size={18}/>
                Escolher da galeria
                <input
                  id="proof-gallery"
                  type="file"
                  accept="image/*"
                  onChange={e => handleFile(e.target.files?.[0])}
                />
              </label>
            </div>
            {proofPreview && (
              <div className="proof-preview">
                <img src={proofPreview}/>
                <span>Pré-visualização do comprovante</span>
                <Button variant="whatsapp" onClick={sendProof} disabled={sending}>
                  <HeartHandshake size={17}/>
                  {sending ? "Enviando..." : "Enviar comprovante pelo WhatsApp"}
                </Button>
              </div>
            )}
          </div>
        )}

        {!proofNeeded && orderDetails.payment === "Dinheiro" && (
          <div className="cash-note">
            <DollarSign size={20}/>
            <b>Pagamento: dinheiro na {orderDetails.delivery.toLowerCase() === "retirada" ? "retirada" : "entrega"}</b>
            <span>Não é necessário enviar comprovante.</span>
          </div>
        )}

        <Button
          variant="whatsapp"
          onClick={() => {
            const msg = `Pedido ${orderDetails.id} · ${orderDetails.customer}`;
            if (!openWhatsApp(whatsNumber, msg)) {
              toast.success("WhatsApp simulado aberto", {description: msg});
            }
          }}
        >
          <HeartHandshake size={17}/>
          Falar com Valdir
        </Button>
        <Button onClick={() => go("home")}>Voltar ao catálogo</Button>
        {clientAuth && (
          <Button variant="ghost" onClick={() => go("account")}>Ver minha conta</Button>
        )}
      </main>
      <BottomNav
        items={[
          {id: "home", label: "Início", icon: <HomeIcon size={19}/>},
          {id: "cart", label: "Carrinho", icon: <ShoppingCart size={19}/>},
          {id: "account", label: "Conta", icon: <UserRound size={19}/>}
        ]}
        active="home"
        onSelect={(id) => go(id)}
      />
    </div>
  );
}

function Account({go, clientAuth, clientScreen, setCart, notify, products}: any) {
  const repeat = (o: any) => {
    const c: Record<string, number> = {};
    o.items.forEach((it: any) => {
      c[it.id] = it.qty;
    });
    setCart(c);
    notify("Pedido copiado para o carrinho com preços atuais.");
    go("cart");
  };

  const [sel, setSel] = useState<any | null>(null);

  const nav = (
    <BottomNav
      items={[
        {id: "home", label: "Início", icon: <HomeIcon size={19}/>},
        {id: "cart", label: "Carrinho", icon: <ShoppingCart size={19}/>},
        {id: "account", label: "Conta", icon: <UserRound size={19}/>}
      ]}
      active="account"
      onSelect={id => go(id)}
    />
  );

  if (clientScreen === "orderDetail" && sel) {
    return (
      <div className="app-shell">
        <Header title="Detalhe do pedido" back onBack={() => go("account")} onLogo={() => go("home")}/>
        <main className="page">
          <div className="order-card">
            <div>
              <span className="eyebrow">{sel.date} · {sel.id}</span>
              <b>{money(historyTotal(sel))}</b>
            </div>
            <span className="status-pill green">{sel.status}</span>
          </div>
          <div className="summary">
            {sel.items.map((it: any) => {
              const prod = products.find((p: any) => p.id === it.id);
              return (
                <span key={it.id}>
                  {it.qty}x {prod?.name || it.id} — {money(it.qty * it.price)}
                </span>
              );
            })}
            <hr/>
            <strong>Total</strong>
            <strong className="total">{money(historyTotal(sel))}</strong>
          </div>
          <small className="muted">Preços praticados na data do pedido.</small>
          <Button onClick={() => repeat(sel)}>
            🔄 Repetir pedido <ArrowRight size={15}/>
          </Button>
          <Button variant="ghost" onClick={() => go("account")}>Voltar</Button>
        </main>
      </div>
    );
  }

  if (clientScreen === "history") {
    return (
      <div className="app-shell">
        <Header title="Histórico de pedidos" back onBack={() => go("account")} onLogo={() => go("home")}/>
        <main className="page">
          {mockHistory.map(o => (
            <div className="order-card" key={o.id}>
              <div>
                <span className="eyebrow">{o.date} · {o.id}</span>
                <b>{money(historyTotal(o))}</b>
                <span>
                  {o.items.map((it: any) => {
                    const prod = products.find((p: any) => p.id === it.id);
                    return `${it.qty}x ${prod?.name || it.id}`;
                  }).join(", ")}
                </span>
              </div>
              <span className="status-pill green">{o.status}</span>
              <Button variant="soft" onClick={() => {setSel(o); go("orderDetail")}}>
                Ver pedido <ArrowRight size={15}/>
              </Button>
              <Button variant="ghost" onClick={() => repeat(o)}>🔄 Repetir</Button>
            </div>
          ))}
        </main>
        {nav}
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Header title="Minha conta" back onBack={() => go("home")} onLogo={() => go("home")}/>
      <main className="page">
        <div className="account-card">
          <div className="avatar">M</div>
          <div>
            <b>Maria de Souza</b>
            <span>Cliente autenticada · Google simulado</span>
          </div>
          <Check/>
        </div>
        <div className="section-head">
          <h2>Seus pedidos</h2>
          <button className="link-btn" onClick={() => go("history")}>
            ver histórico <ArrowRight size={15}/>
          </button>
        </div>
        {mockHistory.map(o => (
          <div className="order-card" key={o.id}>
            <div>
              <span className="eyebrow">{o.date} · {o.id}</span>
              <b>{money(historyTotal(o))}</b>
              <span>
                {o.items.map((it: any) => {
                  const prod = products.find((p: any) => p.id === it.id);
                  return `${it.qty}x ${prod?.name || it.id}`;
                }).join(", ")}
              </span>
            </div>
            <span className="status-pill green">{o.status}</span>
            <Button variant="soft" onClick={() => {setSel(o); go("orderDetail")}}>
              Ver pedido <ArrowRight size={15}/>
            </Button>
            <Button variant="ghost" onClick={() => repeat(o)}>🔄 Repetir pedido</Button>
          </div>
        ))}
      </main>
      {nav}
    </div>
  );
}

function Empty({title, text, action}: {title: string; text: string; action: () => void}) {
  return (
    <div className="empty">
      <ShoppingBag size={32}/>
      <h2>{title}</h2>
      <p>{text}</p>
      <Button onClick={action}>Ver catálogo</Button>
    </div>
  );
}

function ProtectedEntry({kind, onUnlock, onBack}: {
  kind: "operator" | "manager";
  onUnlock: () => void;
  onBack: () => void;
}) {
  const manager = kind === "manager";
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const submit = async () => {
    setBusy(true);
    setErr("");
    try {
      if (!hasSupabase) {
        onUnlock();
        return;
      }
      const data = await signIn(email.trim(), pwd);
      const role = await getRole(data.user?.id);
      const ok = manager
        ? role === "manager"
        : (role === "operator" || role === "manager");
      if (!ok) {
        await signOut();
        setErr("Este usuário não tem acesso a esta área.");
        return;
      }
      onUnlock();
    } catch (e: any) {
      setErr("Não foi possível entrar. Verifique e-mail e senha.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`app-shell protected-entry ${manager ? "manager-entry" : "operator-entry"}`}>
      <div className="protected-mark">
        <img src={IMG.logo} alt="Produtos do Valdir" style={{...LOGO_STYLE, height: 56, maxWidth: 86}}/>
        <span>{manager ? "central do gestor" : "operação da loja"}</span>
      </div>
      <main className="page">
        <span className="eyebrow">acesso protegido</span>
        <h1>{manager ? "Olá, gestor." : "Olá, Valdir e família."}</h1>
        <p>
          {manager
            ? "Entre para acompanhar o movimento completo da loja Produtos do Valdir."
            : "Este espaço reúne os pedidos, produtos e entregas do dia."
          }
        </p>
        <label>
          E-mail
          <input
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="seu@email.com"
            autoComplete="username"
          />
        </label>
        <label>
          Senha
          <input
            type="password"
            value={pwd}
            onChange={e => setPwd(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
          />
        </label>
        {err && (
          <p style={{color: "#bd463b", fontSize: 12, margin: "8px 0"}}>{err}</p>
        )}
        <Button onClick={submit} disabled={busy}>
          {busy ? "Entrando..." : "Entrar no painel"} <ArrowRight size={17}/>
        </Button>
        <button className="link-btn protected-back" onClick={onBack}>
          <ArrowLeft size={16}/>
          voltar ao catálogo
        </button>
        <small className="demo-note">
          {hasSupabase
            ? "Acesso protegido com Supabase Auth."
            : "Autenticação simulada nesta etapa do protótipo."}
        </small>
      </main>
    </div>
  );
}

function OperatorApp({screen, setScreen, onExit, onSignOut}: {
  screen: string;
  setScreen: (s: string) => void;
  onExit: () => void;
  onSignOut: () => void;
}) {
  const {orders, patch} = useOrders();
  const {prods, patchProd, insertProd} = useProducts();
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [routeStage, setRouteStage] = useState<"before" | "ask" | "pending" | "done">("before");
  const [pend, setPend] = useState<Record<string, boolean>>({});
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [doneSummary, setDoneSummary] = useState("");
  const [editP, setEditP] = useState<any | null>(null);
  const [editPhoto, setEditPhoto] = useState<{file: File; preview: string} | null>(null);
  const [npPhoto, setNpPhoto] = useState<{file: File; preview: string} | null>(null);
  const [np, setNp] = useState<any>({
    name: "", description: "", price: "", cost: "", stock: "0",
    category_id: 1, image_url: IMG.doces
  });

  const opNav = [
    {id: "home", label: "Início", icon: <HomeIcon size={19}/>},
    {id: "orders", label: "Pedidos", icon: <ClipboardList size={19}/>},
    {id: "routes", label: "Entregas", icon: <Truck size={19}/>}
  ];

  const novos = orders.filter(o => o.status === "NOVO").length;
  const andamento = orders.filter(o =>
    ["CONFIRMADO", "AGUARDANDO PAGAMENTO", "SEPARANDO"].includes(o.status)
  ).length;
  const prontos = orders.filter(o => o.status === "PRONTO PARA ROTA").length;
  const urgentCount = orders.filter(o => o.urgent).length;
  const pendCount = routeOrders.filter(o => pend[o.id]).length;

  const applyPatch = async (o: any, changes: any) => {
    await patch(o.id, changes);
    setSelectedOrder(s => (s && s.id === o.id ? {...s, ...changes} : s));
  };

  const uploadPhoto = async (photo: {file: File; preview: string} | null, prefix: string) => {
    if (!photo) return null;
    try {
      return await uploadToBucket("product-photos", `${prefix}-${Date.now()}.jpg`, photo.file);
    } catch (e) {
      console.error("Falha no upload da foto:", e);
      toast.error("Não consegui enviar a foto; usando imagem padrão.");
      return null;
    }
  };

  const saveNewProduct = async () => {
    if (!np.name) {
      toast.error("Dê um nome para o produto.");
      return;
    }
    const uploaded = await uploadPhoto(npPhoto, "prod");
    await insertProd({
      name: np.name,
      description: np.description || "",
      price_cents: Math.round(parseFloat(np.price || "0") * 100),
      cost_cents: Math.round(parseFloat(np.cost || "0") * 100),
      stock: parseInt(np.stock || "0", 10),
      category_id: Number(np.category_id),
      image_url: uploaded || np.image_url,
      active: true
    });
    toast.success("Produto cadastrado na loja!");
    setNp({name: "", description: "", price: "", cost: "", stock: "0", category_id: 1, image_url: IMG.doces});
    setNpPhoto(null);
    setScreen("products");
  };

  const saveEditProduct = async () => {
    const uploaded = await uploadPhoto(editPhoto, `prod-${editP.id}`);
    await patchProd(editP.id, {
      name: editP.name,
      description: editP.description || "",
      price_cents: Math.round(parseFloat(editP.price || "0") * 100),
      cost_cents: Math.round(parseFloat(editP.cost || "0") * 100),
      stock: parseInt(editP.stock || "0", 10),
      category_id: Number(editP.category_id),
      image_url: uploaded || editP.image_url
    });
    toast.success("Produto atualizado!");
    setEditP(null);
    setEditPhoto(null);
  };

  if (screen === "product") {
    return (
      <div className="app-shell operator">
        <Header title="Novo produto" back onBack={() => setScreen("home")} onLogo={() => setScreen("home")}/>
        <main className="page">
          <span className="eyebrow">cadastro rápido</span>
          <h1>Vamos colocar um produto na loja?</h1>
          {npPhoto ? (
            <div className="crop-preview">
              <img src={npPhoto.preview}/>
              <span>enquadramento automático (corte central)</span>
            </div>
          ) : (
            <div className="photo-capture">
              <Plus size={30}/>
              <b>Tirar foto</b>
              <span>ou escolher da galeria</span>
            </div>
          )}
          <PhotoPicker onPick={(f, p) => setNpPhoto({file: f, preview: p})}/>
          {npPhoto && (
            <button className="link-btn" style={{margin: "8px 0"}} onClick={() => setNpPhoto(null)}>
              remover foto
            </button>
          )}
          <label>
            Nome do produto
            <input value={np.name} onChange={e => setNp({...np, name: e.target.value})} placeholder="Ex.: Doce de leite"/>
          </label>
          <label>
            Descrição curta
            <input value={np.description} onChange={e => setNp({...np, description: e.target.value})} placeholder="Ex.: Pote 400g"/>
          </label>
          <div className="two-cols">
            <label>
              Preço de venda (R$)
              <input value={np.price} onChange={e => setNp({...np, price: e.target.value})} placeholder="0,00"/>
            </label>
            <label>
              Valor de custo (R$)
              <input value={np.cost} onChange={e => setNp({...np, cost: e.target.value})} placeholder="0,00"/>
            </label>
          </div>
          <div className="two-cols">
            <label>
              Quantidade
              <input value={np.stock} onChange={e => setNp({...np, stock: e.target.value})} placeholder="0"/>
            </label>
            <label>
              Categoria
              <select value={np.category_id} onChange={e => setNp({...np, category_id: e.target.value})}>
                {[1, 2, 3, 4].map(i => <option key={i} value={i}>{CATNAMES[i]}</option>)}
              </select>
            </label>
          </div>
          {!npPhoto && (
            <label>
              Imagem da prateleira
              <select value={np.image_url} onChange={e => setNp({...np, image_url: e.target.value})}>
                <option value={IMG.doces}>Doces</option>
                <option value={IMG.balas}>Balas</option>
                <option value={IMG.lanches}>Lanches</option>
                <option value={IMG.utilidades}>Utilidades</option>
              </select>
            </label>
          )}
          <Button onClick={saveNewProduct}>
            Salvar produto <Check size={17}/>
          </Button>
        </main>
      </div>
    );
  }

  if (screen === "products") {
    return (
      <div className="app-shell operator">
        <Header title="Meus produtos" subtitle={`${prods.filter(p => p.active !== false).length} na loja`} back onBack={() => setScreen("home")} onLogo={() => setScreen("home")}/>
        <main className="page">
          <div className="manager-list">
            {prods.filter(p => p.active !== false).map(p => (
              <div className="manager-row" key={p.id}>
                <div className="mini-avatar">{p.name[0]}</div>
                <div>
                  <b>{p.name}</b>
                  <span>{moneyFromCents(p.price_cents)} · {p.stock} un.</span>
                </div>
                <button className="icon-btn" style={{width: 32, height: 32}} onClick={() => patchProd(p.id, {stock: Math.max(0, p.stock - 1)})}>−</button>
                <button className="icon-btn" style={{width: 32, height: 32}} onClick={() => patchProd(p.id, {stock: p.stock + 1})}>+</button>
                <button
                  className="icon-btn"
                  style={{width: 32, height: 32}}
                  title="Corrigir informações"
                  onClick={() => {
                    setEditP({
                      ...p,
                      price: (p.price_cents / 100).toFixed(2),
                      cost: (p.cost_cents / 100).toFixed(2),
                      stock: String(p.stock)
                    });
                    setEditPhoto(null);
                  }}
                >
                  <Pencil size={14}/>
                </button>
              </div>
            ))}
          </div>

          {editP && (
            <div className="settings-card" style={{marginTop: 14}}>
              <span className="eyebrow">corrigir produto</span>
              <div className="crop-preview">
                <img src={editPhoto?.preview || editP.image_url}/>
                <span>foto atual / nova foto</span>
              </div>
              <PhotoPicker onPick={(f, p) => setEditPhoto({file: f, preview: p})}/>
              <label>Nome<input value={editP.name} onChange={e => setEditP({...editP, name: e.target.value})}/></label>
              <label>Descrição<input value={editP.description} onChange={e => setEditP({...editP, description: e.target.value})}/></label>
              <div className="two-cols">
                <label>Preço (R$)<input value={editP.price} onChange={e => setEditP({...editP, price: e.target.value})}/></label>
                <label>Custo (R$)<input value={editP.cost} onChange={e => setEditP({...editP, cost: e.target.value})}/></label>
              </div>
              <div className="two-cols">
                <label>Quantidade<input value={editP.stock} onChange={e => setEditP({...editP, stock: e.target.value})}/></label>
                <label>
                  Categoria
                  <select value={editP.category_id} onChange={e => setEditP({...editP, category_id: e.target.value})}>
                    {[1, 2, 3, 4].map(i => <option key={i} value={i}>{CATNAMES[i]}</option>)}
                  </select>
                </label>
              </div>
              <Button onClick={saveEditProduct}>Salvar <Check size={16}/></Button>
              <Button variant="ghost" onClick={() => {setEditP(null); setEditPhoto(null);}}>Cancelar</Button>
            </div>
          )}

          <Button variant="soft" onClick={() => setScreen("product")}>
            <Plus size={16}/> Novo produto
          </Button>
        </main>
        <BottomNav items={opNav} active="home" onSelect={setScreen}/>
      </div>
    );
  }

  if (screen === "orders") {
    return (
      <div className="app-shell operator">
        <Header title="Pedidos do dia" subtitle="Tudo em um só lugar" back onBack={() => setScreen("home")} onLogo={() => setScreen("home")}/>
        <main className="page">
          <div className="urgent-banner">
            <Zap/>
            <div>
              <b>{urgentCount} pedidos urgentes</b>
              <span>Olhe primeiro para eles</span>
            </div>
          </div>
          <div className="status-tabs">
            <b>NOVOS <i>{novos}</i></b>
            <span>EM ANDAMENTO <i>{andamento}</i></span>
            <span>PRONTOS <i>{prontos}</i></span>
          </div>
          {orders.slice(0, 8).map(o => (
            <div
              key={o.id}
              className={`op-order ${o.urgent ? "urgent-order" : ""}`}
              onClick={() => {setSelectedOrder(o); setScreen("order")}}
            >
              {o.urgent && <span className="urgent-label">🚨 URGENTE</span>}
              <div>
                <b>{orderName(o)}</b>
                <span>{orderLabel(o)} · {o.region}</span>
                <small>{o.items || ""}</small>
              </div>
              <div>
                <strong>{money(orderTotal(o))}</strong>
                <span className="status-pill">{o.status}</span>
              </div>
            </div>
          ))}
        </main>
        <BottomNav items={opNav} active="orders" onSelect={setScreen}/>
      </div>
    );
  }

  if (screen === "order" && selectedOrder) {
    const o = selectedOrder;
    const idx = Math.max(0, statusIdx(o.status));
    const pending = o.status === "PENDENTE DE ENTREGA";
    return (
      <div className="app-shell operator">
        <Header title={orderLabel(o)} back onBack={() => setScreen("orders")} onLogo={() => setScreen("home")}/>
        <main className="page">
          <div className="op-detail-head">
            {o.urgent && <span className="urgent-label">🚨 PEDIDO URGENTE</span>}
            {pending && <span className="urgent-label">PENDENTE DE ENTREGA</span>}
            <h1>{orderName(o)}</h1>
            <span>{o.city} · {o.region}</span>
          </div>
          <div className="summary">
            <span>Total</span>
            <b>{money(orderTotal(o))}</b>
            <span>Entrada</span>
            <b>{money(orderEntry(o))}</b>
            <span>Saldo</span>
            <b>{money(orderBalance(o))}</b>
            <span>Pagamento</span>
            <b>{payLabel(o)}</b>
          </div>
          <div className="timeline">
            <b>Fluxo do pedido</b>
            {STATUS_SEQ.map((s, i) => (
              <div className={i < idx ? "done" : i === idx ? "current" : ""} key={s}>
                <i>{i < idx ? <Check size={13}/> : i + 1}</i>
                <span>{s}</span>
              </div>
            ))}
          </div>
          {statusIdx(o.status) < 3 && (
            <Button onClick={async () => {
              await applyPatch(o, {status: "SEPARANDO", payment_confirmed: true});
              toast.success("Entrada confirmada", {description: "Pedido avançou para SEPARANDO"});
            }}>
              Confirmar entrada 50%
            </Button>
          )}
          <Button variant="soft" onClick={async () => {
            await applyPatch(o, {
              status: statusIdx(o.status) < 3 ? "SEPARANDO" : o.status,
              payment_confirmed: true,
              balance_cents: 0
            });
            toast.success("Pagamento total confirmado");
          }}>
            Confirmar pagamento total
          </Button>
        </main>
      </div>
    );
  }

  if (screen === "routes") {
    return (
      <div className="app-shell operator">
        <Header title="Entregas" subtitle="Quarta-feira, 12 de agosto" back onBack={() => setScreen("home")} onLogo={() => setScreen("home")}/>
        <main className="page">
          <div className="route-card">
            <div className="route-title">
              <Truck/>
              <div>
                <b>Rota Zona Norte</b>
                <span>{routeOrders.length} pedidos · {routeOrders.filter(o => o.urgent).length} urgentes</span>
              </div>
              <span className="status-pill green">pronta</span>
            </div>
            <div className="route-progress">
              <div style={{width: routeStage === "done" ? "100%" : "0%"}}/>
            </div>
            <p>
              {routeStage === "done"
                ? doneSummary
                : "Valdir não precisa marcar pedido por pedido na rua."
            }
            </p>

            {routeStage === "before" && (
              <Button onClick={() => setRouteStage("ask")}>
                Finalizar rota <Check size={17}/>
              </Button>
            )}

            {routeStage === "ask" && (
              <>
                <p><b>Você conseguiu entregar todos os pedidos desta rota?</b></p>
                <Button onClick={() => {
                  setDoneSummary("Rota finalizada. Todos os pedidos foram concluídos.");
                  setRouteStage("done");
                  toast.success("Rota finalizada em lote");
                }}>
                  SIM, entreguei tudo <Check size={17}/>
                </Button>
                <Button variant="soft" onClick={() => setRouteStage("pending")}>
                  NÃO, alguns ficaram pendentes
                </Button>
              </>
            )}

            {routeStage === "pending" && (
              <>
                {routeOrders.map(o => (
                  <div className="op-order" key={o.id}>
                    <div>
                      <b>{o.name}</b>
                      <span>{o.id} · Zona Norte</span>
                      {pend[o.id] && (
                        <select
                          value={reasons[o.id] || REASONS[0]}
                          onChange={e => setReasons(r => ({...r, [o.id]: e.target.value}))}
                        >
                          {REASONS.map(r => <option key={r}>{r}</option>)}
                        </select>
                      )}
                    </div>
                    <button
                      className="btn btn-soft"
                      style={{width: "auto", minHeight: 40, padding: "0 12px"}}
                      onClick={() => setPend(p => ({...p, [o.id]: !p[o.id]}))}
                    >
                      {pend[o.id] ? "pendente" : "marcar pendente"}
                    </button>
                  </div>
                ))}
                <Button onClick={() => {
                  setDoneSummary(
                    `Rota finalizada. ${routeOrders.length - pendCount} concluídos, ${pendCount} pendentes.`
                  );
                  setRouteStage("done");
                  toast.success("Rota finalizada em lote");
                }}>
                  Concluir rota <Check size={17}/>
                </Button>
              </>
            )}
          </div>

          {routeStage === "done" && routeOrders.filter(o => pend[o.id]).map(o => (
            <div className="pending-card" key={o.id}>
              <span className="urgent-label">PENDENTE DE ENTREGA</span>
              <b>{o.name} · {o.id}</b>
              <span>{reasons[o.id] || REASONS[0]}</span>
              <div>
                <Button variant="soft" onClick={() => toast.success("Pendência reagendada")}>
                  Reagendar
                </Button>
                <Button variant="ghost" onClick={() => toast.success("Contato simulado")}>
                  Falar com cliente
                </Button>
              </div>
            </div>
          ))}
        </main>
        <BottomNav items={opNav} active="routes" onSelect={setScreen}/>
      </div>
    );
  }

  return (
    <div className="app-shell operator">
      <Header onLogo={() => setScreen("home")}/>
      <main className="page operator-home">
        <div className="hello">
          <span>painel do dia</span>
          <h1>Olá, Valdir!</h1>
          <p>Vamos deixar tudo pronto com calma.</p>
        </div>
        <div className="op-grid">
          <button onClick={() => setScreen("product")}>
            <Plus/>
            <b>Novo produto</b>
            <span>tirar foto e cadastrar</span>
          </button>
          <button onClick={() => setScreen("products")}>
            <Package/>
            <b>Meus produtos</b>
            <span>{prods.filter(p => p.active !== false).length} disponíveis</span>
          </button>
          <button onClick={() => setScreen("orders")}>
            <ClipboardList/>
            <b>Pedidos</b>
            <span>{novos + andamento} precisam de atenção</span>
          </button>
          <button onClick={() => setScreen("routes")}>
            <Truck/>
            <b>Entregas</b>
            <span>rota Zona Norte</span>
          </button>
        </div>
        <div className="simple-banner">
          <HeartHandshake/>
          <div>
            <b>Ficou com dúvida?</b>
            <span>Chame o gestor para ajudar.</span>
          </div>
        </div>
        {!hasSupabase && (
          <button className="exit-role" onClick={onExit}>Trocar experiência</button>
        )}
        <button className="exit-role" onClick={onSignOut}>Sair da conta</button>
      </main>
      <BottomNav items={opNav} active="home" onSelect={setScreen}/>
    </div>
  );
}

function ManagerApp({tab, setTab, onExit, onSignOut}: {
  tab: string;
  setTab: (s: string) => void;
  onExit: () => void;
  onSignOut: () => void;
}) {
  const {orders, patch} = useOrders();
  const {prods, patchProd, insertProd} = useProducts();
  const {settings, saveSettings} = useSettings();
  const [edit, setEdit] = useState<any | null>(null);
  const [editPhoto, setEditPhoto] = useState<{file: File; preview: string} | null>(null);
  const [form, setForm] = useState<any>(null);

  useEffect(() => {
    if (settings && !form) setForm({...settings});
  }, [settings, form]);

  const items = [
    {id: "dashboard", label: "Visão geral", icon: <LayoutDashboard/>},
    {id: "products", label: "Produtos", icon: <Package/>},
    {id: "stock", label: "Estoque", icon: <ClipboardList/>},
    {id: "orders", label: "Pedidos", icon: <ShoppingCart/>},
    {id: "clients", label: "Clientes", icon: <Users/>},
    {id: "reports", label: "Relatórios", icon: <BarChart3/>},
    {id: "routes", label: "Rotas", icon: <Truck/>},
    {id: "araraquara", label: "Araraquara", icon: <MapPin/>},
    {id: "settings", label: "Configurações", icon: <Settings/>}
  ];

  const title = items.find(i => i.id === tab)?.label || "Dashboard";

  const totalVendas = orders.reduce((s, o) => s + orderTotal(o), 0);
  const novosCount = orders.filter(o => o.status === "NOVO").length;
  const urgentCount = orders.filter(o => o.urgent).length;
  const pendCount = orders.filter(o => o.status === "PENDENTE DE ENTREGA").length;
  const lowStock = prods.filter(p => p.stock < 10).length;

  const uploadPhoto = async (photo: {file: File; preview: string} | null, prefix: string) => {
    if (!photo) return null;
    try {
      return await uploadToBucket("product-photos", `${prefix}-${Date.now()}.jpg`, photo.file);
    } catch (e) {
      console.error("Falha no upload da foto:", e);
      toast.error("Não consegui enviar a foto; mantendo imagem atual.");
      return null;
    }
  };

  const saveEdit = async () => {
    const uploaded = edit.isNew ? await uploadPhoto(editPhoto, "prod") : await uploadPhoto(editPhoto, `prod-${edit.id}`);
    const payload = {
      name: edit.name,
      description: edit.description || "",
      price_cents: Math.round(parseFloat(edit.price || "0") * 100),
      cost_cents: Math.round(parseFloat(edit.cost || "0") * 100),
      stock: parseInt(edit.stock || "0", 10),
      image_url: uploaded || edit.image_url,
      category_id: parseInt(edit.category_id || "1", 10),
      active: edit.active !== false
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
      <Header title={title} subtitle="Painel gestor" onLogo={() => setTab("dashboard")}/>
      <main className="page manager-page">
        {tab === "dashboard" && (
          <>
            <div className="manager-welcome">
              <div>
                <span>quarta-feira, 12 de agosto</span>
                <h1>Bom dia, gestor.</h1>
              </div>
              <div className="avatar orange">V</div>
            </div>
            <div className="metric-grid">
              <Metric label="Vendas (pedidos)" value={money(totalVendas)} trend={`${orders.length} pedidos`}/>
              <Metric label="Pedidos novos" value={String(novosCount)} trend={`${urgentCount} urgentes`}/>
              <Metric label="Lucro bruto" value="R$ 3.186" trend="37,8% margem"/>
              <Metric label="Estoque baixo" value={String(lowStock)} trend="ver produtos" alert={lowStock > 0}/>
            </div>
            <div className="split-cards">
              <div>
                <Zap/>
                <b>{urgentCount} urgentes</b>
                <span>pedidos para olhar</span>
              </div>
              <div>
                <Truck/>
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
                <p>{prods.filter(p => p.active !== false).length} ativos no catálogo</p>
              </div>
              <Button onClick={() => {
                setEdit({
                  isNew: true,
                  name: "",
                  description: "",
                  price: "",
                  cost: "",
                  stock: "0",
                  image_url: IMG.doces,
                  category_id: 1,
                  active: true
                });
                setEditPhoto(null);
              }}>
                <Plus size={16}/>
                Novo produto
              </Button>
            </div>
            <div className="manager-list">
              {prods.map(p => (
                <div className="manager-row" key={p.id}>
                  <div className="mini-avatar">{p.name[0]}</div>
                  <div>
                    <b>{p.name}{p.active === false ? " (inativo)" : ""}</b>
                    <span>{p.stock} un · {CATNAMES[p.category_id] || "Outros"}</span>
                  </div>
                  <strong>{moneyFromCents(p.price_cents)}</strong>
                  <button
                    className="icon-btn"
                    style={{width: 32, height: 32}}
                    title="Editar"
                    onClick={() => {
                      setEdit({
                        ...p,
                        price: (p.price_cents / 100).toFixed(2),
                        cost: (p.cost_cents / 100).toFixed(2),
                        stock: String(p.stock)
                      });
                      setEditPhoto(null);
                    }}
                  >
                    <Pencil size={14}/>
                  </button>
                  <button
                    className="icon-btn"
                    style={{width: 32, height: 32, color: "#bd463b"}}
                    title="Desativar"
                    onClick={() => {
                      if (window.confirm(`Desativar ${p.name} do catálogo?`)) {
                        patchProd(p.id, {active: false});
                        toast.success("Produto desativado");
                      }
                    }}
                  >
                    <X size={14}/>
                  </button>
                </div>
              ))}
            </div>

            {edit && (
              <div className="settings-card" style={{marginTop: 14}}>
                <span className="eyebrow">{edit.isNew ? "novo produto" : "editar produto"}</span>
                <div className="crop-preview">
                  <img src={editPhoto?.preview || edit.image_url}/>
                  <span>foto atual / nova foto</span>
                </div>
                <PhotoPicker onPick={(f, p) => setEditPhoto({file: f, preview: p})}/>
                <label>Nome<input value={edit.name} onChange={e => setEdit({...edit, name: e.target.value})}/></label>
                <label>Descrição<input value={edit.description} onChange={e => setEdit({...edit, description: e.target.value})}/></label>
                <div className="two-cols">
                  <label>Preço (R$)<input value={edit.price} onChange={e => setEdit({...edit, price: e.target.value})}/></label>
                  <label>Custo (R$)<input value={edit.cost} onChange={e => setEdit({...edit, cost: e.target.value})}/></label>
                </div>
                <div className="two-cols">
                  <label>Estoque<input value={edit.stock} onChange={e => setEdit({...edit, stock: e.target.value})}/></label>
                  <label>
                    Categoria
                    <select value={edit.category_id} onChange={e => setEdit({...edit, category_id: e.target.value})}>
                      {[1, 2, 3, 4].map(i => <option key={i} value={i}>{CATNAMES[i]}</option>)}
                    </select>
                  </label>
                </div>
                <label style={{display: "flex", alignItems: "center", gap: 8}}>
                  <input
                    type="checkbox"
                    style={{width: "auto", height: "auto"}}
                    checked={edit.active !== false}
                    onChange={e => setEdit({...edit, active: e.target.checked})}
                  />
                  Ativo no catálogo
                </label>
                <Button onClick={saveEdit}>Salvar <Check size={16}/></Button>
                <Button variant="ghost" onClick={() => {setEdit(null); setEditPhoto(null);}}>Cancelar</Button>
              </div>
            )}
          </>
        )}

        {tab === "stock" && (
          <>
            <div className="list-head">
              <div>
                <span className="eyebrow">gestão</span>
                <h1>Estoque</h1>
                <p>ajuste rápido com + / −</p>
              </div>
            </div>
            <div className="manager-list">
              {prods.filter(p => p.active !== false).map(p => (
                <div className="manager-row" key={p.id}>
                  <div className="mini-avatar">{p.name[0]}</div>
                  <div>
                    <b>{p.name}</b>
                    <span>mínimo 10 unidades</span>
                  </div>
                  <strong className={p.stock < 10 ? "red" : ""}>{p.stock} un.</strong>
                  <button className="icon-btn" style={{width: 32, height: 32}} onClick={() => patchProd(p.id, {stock: Math.max(0, p.stock - 1)})}>−</button>
                  <button className="icon-btn" style={{width: 32, height: 32}} onClick={() => patchProd(p.id, {stock: p.stock + 1})}>+</button>
                </div>
              ))}
            </div>
          </>
        )}

        {tab === "orders" && (
          <>
            <div className="list-head">
              <div>
                <span className="eyebrow">gestão</span>
                <h1>Pedidos</h1>
                <p>{orders.length} pedidos · troque o status direto na linha</p>
              </div>
            </div>
            <div className="manager-list">
              {orders.map(o => (
                <div className="manager-row" key={o.id}>
                  <div className="mini-avatar">{orderName(o)[0]}</div>
                  <div>
                    <b>{orderLabel(o)} · {orderName(o)}{o.urgent ? " 🚨" : ""}</b>
                    <span>{o.city} · {payLabel(o)} · {money(orderTotal(o))}</span>
                  </div>
                  <select
                    style={{height: 34, fontSize: 11, width: 170}}
                    value={o.status}
                    onChange={e => {
                      patch(o.id, {status: e.target.value});
                      toast.success(`Status → ${e.target.value}`);
                    }}
                  >
                    {ALL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              ))}
            </div>
          </>
        )}

        {tab === "clients" && (
          <ManagerList
            title="Clientes"
            subtitle="Base de clientes fictícia"
            rows={["Maria de Souza", "Dona Célia", "Marcos Lima", "Ana Paula", "João Ferreira"].map((n, i) => ({
              name: n,
              meta: `${i + 2} pedidos · último em agosto`,
              value: i % 2 === 0 ? "ativo" : "cadastrado"
            }))}
            action="Exportar lista"
          />
        )}

        {tab === "reports" && <Reports/>}

        {tab === "routes" && (
          <ManagerList
            title="Rotas"
            subtitle="Regiões e pendências"
            rows={["Zona Norte", "Centro", "Zona Sul", "Zona Leste"].map((n, i) => ({
              name: n,
              meta: `quarta-feira · ${i + 2} pedidos`,
              value: i === 0 ? "2 urgentes" : "organizada"
            }))}
            action="Organizar rota"
          />
        )}

        {tab === "araraquara" && (
          <div className="settings-card">
            <span className="eyebrow">encomendas</span>
            <h1>Araraquara</h1>
            <p>Próxima data definida para reunir os pedidos dessa cidade.</p>
            <div className="date-box">
              <MapPin/>
              <b>
                {settings?.araraquara_next_date
                  ? String(settings.araraquara_next_date).split("-").reverse().join("/")
                  : "15/08/2026"}
              </b>
              <span>próxima encomenda</span>
            </div>
            <Button onClick={() => toast.success("Edite a data em Configurações")}>
              Alterar data <Pencil size={16}/>
            </Button>
          </div>
        )}

        {tab === "settings" && form && (
          <div className="settings-card">
            <span className="eyebrow">administração</span>
            <h1>Configurações</h1>
            <label>Chave PIX<input value={form.pix_key || ""} onChange={e => setForm({...form, pix_key: e.target.value})}/></label>
            <label>Nome do titular<input value={form.pix_holder || ""} onChange={e => setForm({...form, pix_holder: e.target.value})}/></label>
            <label>WhatsApp do Valdir (com DDD)<input value={form.whatsapp_number || ""} onChange={e => setForm({...form, whatsapp_number: e.target.value})} placeholder="16 99999-9999"/></label>
            <label>Endereço de retirada<input value={form.pickup_address || ""} onChange={e => setForm({...form, pickup_address: e.target.value})}/></label>
            <div className="two-cols">
              <label>Entrada PIX (0–1)<input type="number" step="0.05" min="0" max="1" value={form.entry_pct_pix ?? 0.5} onChange={e => setForm({...form, entry_pct_pix: parseFloat(e.target.value)})}/></label>
              <label>Entrada cartão (0–1)<input type="number" step="0.05" min="0" max="1" value={form.entry_pct_card ?? 0.5} onChange={e => setForm({...form, entry_pct_card: parseFloat(e.target.value)})}/></label>
            </div>
            <label>
              Regra do dinheiro
              <select value={form.cash_rule || "TOTAL_NA_ENTREGA"} onChange={e => setForm({...form, cash_rule: e.target.value})}>
                <option value="TOTAL_NA_ENTREGA">Total na entrega/retirada</option>
                <option value="ENTRADA_50">Exigir entrada de 50%</option>
              </select>
            </label>
            <label>Próxima data Araraquara<input type="date" value={form.araraquara_next_date || ""} onChange={e => setForm({...form, araraquara_next_date: e.target.value})}/></label>
            <label style={{display: "flex", alignItems: "center", gap: 8}}>
              <input
                type="checkbox"
                style={{width: "auto", height: "auto"}}
                checked={form.pickup_enabled !== false}
                onChange={e => setForm({...form, pickup_enabled: e.target.checked})}
              />
              Retirada habilitada
            </label>
            <Button onClick={async () => {
              await saveSettings(form);
              toast.success("Configurações salvas");
            }}>
              Salvar configurações <Check size={16}/>
            </Button>
          </div>
        )}
      </main>
      <nav className="manager-nav">
        {items.map(i => (
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
          <X/>
          <span>Sair</span>
        </button>
      </nav>
    </div>
  );
}

function Metric({label, value, trend, alert}: {
  label: string;
  value: string;
  trend: string;
  alert?: boolean;
}) {
  return (
    <div className={`metric ${alert ? "alert" : ""}`}>
      <span>{label}</span>
      <b>{value}</b>
      <small>{trend}</small>
    </div>
  );
}

function ManagerList({title, subtitle, rows, action}: {
  title: string;
  subtitle: string;
  rows: any[];
  action: string;
}) {
  return (
    <>
      <div className="list-head">
        <div>
          <span className="eyebrow">gestão</span>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
        <Button onClick={() => toast.success(`${action} simulado`)}>
          <Plus size={16}/>
          {action}
        </Button>
      </div>
      <div className="manager-list">
        {rows.map((r, i) => (
          <div className="manager-row" key={i}>
            <div className="mini-avatar">{r.name[0]}</div>
            <div>
              <b>{r.name}</b>
              <span>{r.meta}</span>
            </div>
            <strong className={r.alert ? "red" : ""}>{r.value}</strong>
            <ChevronRight size={17}/>
          </div>
        ))}
      </div>
    </>
  );
}

function Reports() {
  return (
    <div>
      <span className="eyebrow">inteligência da loja</span>
      <h1>Relatórios</h1>
      <div className="report-tabs">
        <button className="active">Vendas</button>
        <button>Custos</button>
        <button>Lucro</button>
        <button>Margem</button>
      </div>
      <div className="report-big">
        <span>Vendas no período</span>
        <b>R$ 8.420,00</b>
        <small>01–12 agosto 2026 · +12% vs. anterior</small>
        <div className="line-chart">
          <i/>
          <i/>
          <i/>
          <i/>
          <i/>
          <i/>
          <i/>
        </div>
      </div>
      <div className="report-card">
        <b>Produtos mais lucrativos</b>
        <span>1. Doce de leite <strong>R$ 486</strong></span>
        <span>2. Paçoca rolha <strong>R$ 320</strong></span>
        <span>3. Chocolate <strong>R$ 218</strong></span>
      </div>
    </div>
  );
}