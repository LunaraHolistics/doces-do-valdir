/* Produtos do Valdir — catálogo real via Supabase + acesso protegido com Supabase Auth. */
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

const money = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const moneyFromCents = (cents: number) => money(cents / 100);

const MOCK_PRODUCTS = [
  {id:"p1",category_id:1,name:"Doce de leite cremoso",description:"Pote 400g, textura cremosa e sabor de fazenda.",price_cents:1290,cost_cents:700,stock:18,image_url:IMG.doces},
  {id:"p2",category_id:1,name:"Paçoca rolha",description:"Pacotinho com 6 unidades.",price_cents:750,cost_cents:400,stock:24,image_url:IMG.doces},
  {id:"p3",category_id:1,name:"Pé de moleque",description:"Crocante, feito com amendoim selecionado.",price_cents:890,cost_cents:480,stock:14,image_url:IMG.doces},
  {id:"p4",category_id:1,name:"Doce de amendoim",description:"Doce macio em embalagem individual.",price_cents:690,cost_cents:350,stock:21,image_url:IMG.doces},
  {id:"p5",category_id:2,name:"Bala sortida",description:"Mix colorido para adoçar o dia.",price_cents:500,cost_cents:250,stock:42,image_url:IMG.balas},
  {id:"p6",category_id:2,name:"Bala de goma",description:"Pacote 200g com sabores variados.",price_cents:650,cost_cents:320,stock:27,image_url:IMG.balas},
  {id:"p7",category_id:2,name:"Chiclete hortelã",description:"Cartela com 10 unidades.",price_cents:390,cost_cents:180,stock:36,image_url:IMG.balas},
  {id:"p8",category_id:2,name:"Pirulito coração",description:"Unidade, sabores sortidos.",price_cents:150,cost_cents:60,stock:56,image_url:IMG.balas},
  {id:"p9",category_id:3,name:"Salgadinho queijo",description:"Pacote crocante 90g.",price_cents:490,cost_cents:260,stock:33,image_url:IMG.lanches},
  {id:"p10",category_id:3,name:"Biscoito caseiro",description:"Pacote 250g.",price_cents:790,cost_cents:420,stock:16,image_url:IMG.lanches},
  {id:"p11",category_id:3,name:"Chocolate ao leite",description:"Barra 90g.",price_cents:690,cost_cents:380,stock:19,image_url:IMG.lanches},
  {id:"p12",category_id:3,name:"Suco em pó uva",description:"Rende 1 litro.",price_cents:199,cost_cents:90,stock:48,image_url:IMG.lanches},
  {id:"p13",category_id:4,name:"Pilha AA",description:"Cartela com 2 unidades.",price_cents:1200,cost_cents:700,stock:11,image_url:IMG.utilidades},
  {id:"p14",category_id:4,name:"Pilha AAA",description:"Cartela com 2 unidades.",price_cents:1200,cost_cents:700,stock:8,image_url:IMG.utilidades},
  {id:"p15",category_id:4,name:"Caixa de fósforos",description:"Caixa com 40 palitos.",price_cents:350,cost_cents:150,stock:17,image_url:IMG.utilidades},
  {id:"p16",category_id:4,name:"Vela de aniversário",description:"Kit com 10 unidades.",price_cents:400,cost_cents:180,stock:29,image_url:IMG.utilidades},
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

const mockOrders = [
  {id:"DV-1048", name:"Dona Célia", city:"Ribeirão Preto", region:"Zona Norte", total:86.4, status:"NOVO", urgent:true, pay:"PIX · entrada recebida", items:"Doce de leite, paçoca rolha"},
  {id:"DV-1047", name:"Marcos Lima", city:"Ribeirão Preto", region:"Centro", total:42.9, status:"CONFIRMADO", urgent:false, pay:"Cartão · aguardando entrada", items:"Biscoito, chocolate"},
  {id:"DV-1046", name:"Ana Paula", city:"Ribeirão Preto", region:"Zona Sul", total:125.9, status:"AGUARDANDO PAGAMENTO", urgent:true, pay:"PIX · aguardando", items:"Kit doces variados"},
  {id:"DV-1045", name:"João Ferreira", city:"Ribeirão Preto", region:"Zona Norte", total:64.5, status:"SEPARANDO", urgent:false, pay:"Dinheiro", items:"Salgadinho, suco, bala"},
  {id:"DV-1044", name:"Lúcia Martins", city:"Ribeirão Preto", region:"Zona Leste", total:92, status:"PRONTO PARA ROTA", urgent:false, pay:"PIX · pago total", items:"Paçoca, doces"},
  {id:"DV-1043", name:"Rafael Souza", city:"Araraquara", region:"Encomenda", total:155.8, status:"PENDENTE DE ENTREGA", urgent:false, pay:"PIX · entrada recebida", items:"Caixa festa"},
  {id:"DV-1042", name:"Bia Costa", city:"Ribeirão Preto", region:"Centro", total:38.5, status:"CONCLUÍDO", urgent:false, pay:"Dinheiro", items:"Balas e chicletes"},
  {id:"DV-1041", name:"Carlos Nunes", city:"Ribeirão Preto", region:"Zona Sul", total:74.9, status:"CONCLUÍDO", urgent:false, pay:"Cartão · pago total", items:"Chocolate, biscoito"},
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

function Logo({small = false, onClick}: {small?: boolean; onClick?: () => void}) {
  const inner = (
    <>
      <img src={IMG.logo} alt="Produtos do Valdir"/>
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

function WhatsApp({text = "Olá, Valdir! Estou vendo o catálogo da loja e gostaria de tirar uma dúvida."}: {
  text?: string;
}) {
  return (
    <Button
      variant="whatsapp"
      onClick={() => toast.success("WhatsApp simulado", {description: text})}
    >
      <HeartHandshake size={18}/>
      Falar com Valdir
    </Button>
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

  // ---- Sessão real (Supabase Auth) ----
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

  // Libera automaticamente se já existe sessão com papel correto
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
    products, categories, clientScreen, setClientScreen, selected, setSelected,
    category, setCategory, query, setQuery, cart, cartItems, cartTotal, add, remove, clear,
    clientAuth, setClientAuth, notify
  } = props;

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
            <Button
              variant="ghost"
              onClick={() => toast.success("WhatsApp simulado", {
                description: `Olá, Valdir! Tenho uma dúvida sobre ${selected.name}.`
              })}
            >
              <HeartHandshake size={17}/>
              Tenho uma dúvida sobre este produto
            </Button>
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
              <WhatsApp/>
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
          <WhatsApp/>
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

function Checkout({cartItems, cartTotal, checkoutStep, setCheckoutStep, setOrderSent, setOrderDetails, go, notify}: any) {
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

  const entry = cartTotal / 2;
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
Valor a pagar: ${money(amountToPay)} (${payFull && payment !== "Dinheiro" ? "integral" : needsEntry ? "entrada 50%" : "total na entrega/retirada"})
${needsEntry ? `Saldo: ${money(entry)}` : ""}
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
          payment_method: payment === "Cartão" ? "CARTAO" : payment,
          entry_pct: needsEntry ? 0.5 : 1,
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
      toast.success("Pedido enviado no WhatsApp (simulado)", {description: whatsMsg});
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
                <button
                  className={delivery === "Retirada" ? "chosen" : ""}
                  onClick={() => setDelivery("Retirada")}
                >
                  <Store/>
                  <b>Retirada</b>
                  <span>opção habilitada</span>
                </button>
              </div>
            ) : (
              <div className="notice">
                <MapPin/>
                <b>Encomenda para Araraquara</b>
                <span>Próxima encomenda: <strong>15/08/2026</strong></span>
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
                <span>Endereço de retirada: Rua dos Doces, 123 — referência: praça central (configurável no painel).</span>
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
                  <b>Entrada 50%</b>
                  <span>{money(entry)} agora, {money(entry)} na entrega</span>
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
                  <b>{money(entry)}</b>
                </>
              )}
            </div>

            {payment === "PIX" && (
              <div className="pix-box">
                <span>chave PIX mock</span>
                <b>doces.valdir@demo.com</b>
                <small>Titular: Valdir</small>
                <button
                  className={pixCopied ? "copied" : ""}
                  onClick={() => {
                    navigator.clipboard?.writeText("doces.valdir@demo.com");
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
                <span>cartão · {payFull ? "integral" : "entrada 50%"}</span>
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
                  : payFull ? "integral" : "entrada 50%"
                }
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

function OrderStatus({go, orderDetails, setOrderDetails, clientAuth}: any) {
  const [proofPreview, setProofPreview] = useState<string | null>(orderDetails.proof);
  const [sent, setSent] = useState(Boolean(orderDetails.proof));
  const total = orderDetails.total || 80;
  const entry = total / 2;
  const needsEntry = orderDetails.payment !== "Dinheiro" && !orderDetails.payFull;
  const proofNeeded = needsEntry && !orderDetails.confirmed;
  const idx = orderDetails.confirmed ? 3 : orderDetails.payment === "Dinheiro" ? 1 : 2;

  const handleFile = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setProofPreview(String(reader.result));
    reader.readAsDataURL(file);
  };

  const sendProof = () => {
    if (!proofPreview) return;
    setOrderDetails((current: any) => ({...current, proof: proofPreview}));
    setSent(true);
    toast.success("Comprovante enviado pelo WhatsApp", {
      description: `📎 Comprovante de pagamento — Pedido ${orderDetails.id} · Cliente: ${orderDetails.customer} · Valor: ${money(needsEntry ? entry : total)} · Forma: ${orderDetails.payment} · imagem anexada`
    });
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
              : "A entrada de 50% ainda aguarda confirmação."
            }
          </small>
        </div>

        {proofNeeded && !sent && (
          <div className="proof-card">
            <div>
              <span className="eyebrow">{orderDetails.payFull ? "pagamento integral" : "entrada de 50%"} · {orderDetails.payment}</span>
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
                <Button variant="whatsapp" onClick={sendProof}>
                  <HeartHandshake size={17}/>
                  Enviar comprovante pelo WhatsApp
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
          onClick={() => toast.success("WhatsApp simulado aberto", {
            description: `Pedido ${orderDetails.id} · ${orderDetails.customer}`
          })}
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
        <img src={IMG.logo}/>
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
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [routeStage, setRouteStage] = useState<"before" | "ask" | "pending" | "done">("before");
  const [pend, setPend] = useState<Record<string, boolean>>({});
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [doneSummary, setDoneSummary] = useState("");

  const opNav = [
    {id: "home", label: "Início", icon: <HomeIcon size={19}/>},
    {id: "orders", label: "Pedidos", icon: <ClipboardList size={19}/>},
    {id: "routes", label: "Entregas", icon: <Truck size={19}/>}
  ];

  const novos = mockOrders.filter(o => o.status === "NOVO").length;
  const andamento = mockOrders.filter(o =>
    ["CONFIRMADO", "AGUARDANDO PAGAMENTO", "SEPARANDO"].includes(o.status)
  ).length;
  const prontos = mockOrders.filter(o => o.status === "PRONTO PARA ROTA").length;
  const pendCount = routeOrders.filter(o => pend[o.id]).length;

  if (screen === "product") {
    return (
      <div className="app-shell operator">
        <Header title="Novo produto" back onBack={() => setScreen("home")} onLogo={() => setScreen("home")}/>
        <main className="page">
          <span className="eyebrow">cadastro rápido</span>
          <h1>Vamos colocar um produto na loja?</h1>
          <div className="photo-capture">
            <Plus size={30}/>
            <b>Tirar foto</b>
            <span>ou escolher da galeria</span>
          </div>
          <div className="crop-preview">
            <img src={IMG.hero}/>
            <span>enquadramento simulado</span>
          </div>
          <label>
            Nome do produto
            <input placeholder="Ex.: Doce de leite"/>
          </label>
          <div className="two-cols">
            <label>
              Preço de venda
              <input placeholder="R$ 0,00"/>
            </label>
            <label>
              Valor de custo
              <input placeholder="R$ 0,00"/>
            </label>
          </div>
          <label>
            Quantidade disponível
            <input placeholder="0"/>
          </label>
          <Button onClick={() => {
            toast.success("Produto salvo no mock");
            setScreen("home");
          }}>
            Salvar produto <Check size={17}/>
          </Button>
        </main>
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
              <b>{mockOrders.filter(o => o.urgent).length} pedidos urgentes</b>
              <span>Olhe primeiro para eles</span>
            </div>
          </div>
          <div className="status-tabs">
            <b>NOVOS <i>{novos}</i></b>
            <span>EM ANDAMENTO <i>{andamento}</i></span>
            <span>PRONTOS <i>{prontos}</i></span>
          </div>
          {mockOrders.slice(0, 5).map(o => (
            <div
              key={o.id}
              className={`op-order ${o.urgent ? "urgent-order" : ""}`}
              onClick={() => {setSelectedOrder(o); setScreen("order")}}
            >
              {o.urgent && <span className="urgent-label">🚨 URGENTE</span>}
              <div>
                <b>{o.name}</b>
                <span>{o.id} · {o.region}</span>
                <small>{o.items}</small>
              </div>
              <div>
                <strong>{money(o.total)}</strong>
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
    return (
      <div className="app-shell operator">
        <Header title={selectedOrder.id} back onBack={() => setScreen("orders")} onLogo={() => setScreen("home")}/>
        <main className="page">
          <div className="op-detail-head">
            {selectedOrder.urgent && <span className="urgent-label">🚨 PEDIDO URGENTE</span>}
            <h1>{selectedOrder.name}</h1>
            <span>{selectedOrder.city} · {selectedOrder.region}</span>
          </div>
          <div className="summary">
            <span>Total</span>
            <b>{money(selectedOrder.total)}</b>
            <span>Entrada 50%</span>
            <b>{money(selectedOrder.total / 2)}</b>
            <span>Saldo</span>
            <b>{money(selectedOrder.total / 2)}</b>
            <span>Pagamento</span>
            <b>{selectedOrder.pay}</b>
          </div>
          <div className="timeline">
            <b>Fluxo do pedido</b>
            {STATUS_SEQ.map((s, i) => (
              <div className={i < 3 ? "done" : i === 3 ? "current" : ""} key={s}>
                <i>{i < 3 ? <Check size={13}/> : i + 1}</i>
                <span>{s}</span>
              </div>
            ))}
          </div>
          <Button onClick={() => toast.success("Entrada de 50% confirmada", {
            description: "Pedido avançou para SEPARANDO"
          })}>
            Confirmar entrada 50%
          </Button>
          <Button variant="soft" onClick={() => toast.success("Pagamento total confirmado")}>
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
          <button onClick={() => toast.success("Meus produtos: 16 no catálogo")}>
            <Package/>
            <b>Meus produtos</b>
            <span>16 disponíveis</span>
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

  return (
    <div className="app-shell manager">
      <Header title={title} subtitle="Painel gestor" onLogo={() => setTab("dashboard")}/>
      <main className="page manager-page">
        {tab === "dashboard" && (
          <>
            <div className="manager-welcome">
              <div>
                <span>terça-feira, 11 de agosto</span>
                <h1>Bom dia, gestor.</h1>
              </div>
              <div className="avatar orange">V</div>
            </div>
            <div className="metric-grid">
              <Metric label="Vendas do mês" value="R$ 8.420" trend="+12%"/>
              <Metric label="Pedidos" value="48" trend="+8 novos"/>
              <Metric label="Lucro bruto" value="R$ 3.186" trend="37,8% margem"/>
              <Metric label="Estoque baixo" value="3" trend="ver produtos" alert/>
            </div>
            <div className="dashboard-card">
              <div className="section-head">
                <h2>Vendas por semana</h2>
                <span className="muted">agosto 2026</span>
              </div>
              <div className="bars">
                <i style={{height: "42%"}}/>
                <i style={{height: "64%"}}/>
                <i style={{height: "50%"}}/>
                <i style={{height: "78%"}}/>
                <i style={{height: "58%"}}/>
                <i style={{height: "88%"}}/>
                <i style={{height: "70%"}}/>
              </div>
              <div className="days">
                <span>seg</span>
                <span>ter</span>
                <span>qua</span>
                <span>qui</span>
                <span>sex</span>
                <span>sáb</span>
                <span>dom</span>
              </div>
            </div>
            <div className="split-cards">
              <div>
                <Zap/>
                <b>{mockOrders.filter(o => o.urgent).length} urgentes</b>
                <span>pedidos para olhar</span>
              </div>
              <div>
                <Truck/>
                <b>1 pendência</b>
                <span>de entrega</span>
              </div>
            </div>
          </>
        )}

        {tab === "products" && (
          <ManagerList
            title="Produtos"
            subtitle="16 itens no catálogo"
            rows={MOCK_PRODUCTS.slice(0, 7).map(p => ({
              name: p.name,
              meta: `${p.stock} em estoque · ${MOCK_CATEGORIES.find(c => c.id === p.category_id)?.name}`,
              value: moneyFromCents(p.price_cents)
            }))}
            action="Novo produto"
          />
        )}

        {tab === "stock" && (
          <ManagerList
            title="Estoque"
            subtitle="Acompanhe o que precisa de atenção"
            rows={MOCK_PRODUCTS.slice(0, 6).map(p => ({
              name: p.name,
              meta: `mínimo 10 unidades`,
              value: `${p.stock} un.`,
              alert: p.stock < 10
            }))}
            action="Ajustar estoque"
          />
        )}

        {tab === "orders" && (
          <ManagerList
            title="Pedidos"
            subtitle="8 pedidos recentes"
            rows={mockOrders.map(o => ({
              name: `${o.id} · ${o.name}`,
              meta: `${o.city} · ${o.pay}`,
              value: money(o.total),
              alert: o.urgent
            }))}
            action="Filtrar status"
          />
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
              <b>15/08/2026</b>
              <span>próxima encomenda</span>
            </div>
            <Button onClick={() => toast.success("Data de encomenda editada no mock")}>
              Alterar data <Pencil size={16}/>
            </Button>
          </div>
        )}

        {tab === "settings" && <SettingsPanel/>}
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

function SettingsPanel() {
  return (
    <div>
      <span className="eyebrow">administração</span>
      <h1>Configurações</h1>
      <div className="settings-list">
        <div>
          <WalletCards/>
          <span>
            <b>Chave PIX</b>
            <small>doces.valdir@demo.com</small>
          </span>
          <ChevronRight/>
        </div>
        <div>
          <UserRound/>
          <span>
            <b>Nome do titular</b>
            <small>Valdir de Souza</small>
          </span>
          <ChevronRight/>
        </div>
        <div>
          <HeartHandshake/>
          <span>
            <b>WhatsApp de Valdir</b>
            <small>configurado no mock</small>
          </span>
          <ChevronRight/>
        </div>
        <div>
          <Store/>
          <span>
            <b>Retirada</b>
            <small>ativa</small>
          </span>
          <ChevronRight/>
        </div>
        <div>
          <Users/>
          <span>
            <b>Usuários e permissões</b>
            <small>1 gestor · 2 operadores</small>
          </span>
          <ChevronRight/>
        </div>
      </div>
    </div>
  );
}