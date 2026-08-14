import { Camera, HeartHandshake, Image as ImageIcon, ShoppingBag, ShoppingCart, ArrowLeft } from "lucide-react";
import { IMG } from "../data/mock";
import { openWhatsApp } from "../lib/helpers";
import { toast } from "sonner";

export const LOGO_STYLE = { width: "auto", objectFit: "contain", borderRadius: 10 } as const;

export function Logo({ small = false, onClick }: { small?: boolean; onClick?: () => void }) {
  const inner = (
    <>
      <img
        src={IMG.logo}
        alt="Amado Armazém"
        loading="eager"
        decoding="async"
        style={small ? { ...LOGO_STYLE, height: 46, maxWidth: 74 } : { ...LOGO_STYLE, height: 58, maxWidth: 92 }}
      />
      <div>
        <strong>Amado</strong>
        <b>Armazém</b>
      </div>
    </>
  );
  return onClick
    ? <button className="brand brand-btn" onClick={onClick} aria-label="Voltar para a página inicial">{inner}</button>
    : <div className="brand">{inner}</div>;
}

export function Button({ children, onClick, variant = "primary", className = "", disabled = false, type = "button" }: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: string;
  className?: string;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
}) {
  return (
    <button type={type} disabled={disabled} onClick={onClick} className={`btn btn-${variant} ${className}`}>
      {children}
    </button>
  );
}

export function Header({ title, back, onBack, cart = 0, goCart, subtitle, onLogo }: {
  title?: string; back?: boolean; onBack?: () => void; cart?: number;
  goCart?: () => void; subtitle?: string; onLogo?: () => void;
}) {
  return (
    <header className="topbar" role="banner">
      <a href="#main-content" className="skip-link">Pular para o conteúdo principal</a>
      {back
        ? <button className="icon-btn" onClick={onBack} aria-label="Voltar"><ArrowLeft size={21} /></button>
        : <Logo small onClick={onLogo} />}
      <div className="head-title">
        {title && <strong>{title}</strong>}
        {subtitle && <span>{subtitle}</span>}
      </div>
      {goCart
        ? <button className="cart-icon" onClick={goCart} aria-label="Abrir carrinho">
            <ShoppingCart size={21} />
            {cart > 0 && <i aria-label={`${cart} itens`}>{cart}</i>}
          </button>
        : <span className="icon-btn" aria-hidden="true" />}
    </header>
  );
}

export function Stepper({ current }: { current: number }) {
  return (
    <div className="stepper">
      <span className={current > 1 ? "done" : current === 1 ? "current" : ""}>1</span>
      <i />
      <span className={current > 2 ? "done" : current === 2 ? "current" : ""}>2</span>
      <i />
      <span className={current > 3 ? "done" : current === 3 ? "current" : ""}>3</span>
    </div>
  );
}

export function BottomNav({ items, active, onSelect }: {
  items: { id: string; label: string; icon: any }[];
  active: string;
  onSelect: (id: string) => void;
}) {
  return (
    <nav className="bottom-nav">
      {items.map(i => (
        <button key={i.id} className={active === i.id ? "active" : ""} onClick={() => onSelect(i.id)}>
          <i>{i.icon}</i>
          <span>{i.label}</span>
        </button>
      ))}
    </nav>
  );
}

export function Empty({ title, text, action }: { title: string; text: string; action: () => void }) {
  return (
    <div className="empty">
      <ShoppingBag size={32} />
      <h2>{title}</h2>
      <p>{text}</p>
      <Button onClick={action}>Ver catálogo</Button>
    </div>
  );
}

export function Metric({ label, value, trend, alert }: {
  label: string; value: string; trend: string; alert?: boolean;
}) {
  return (
    <div className={`metric ${alert ? "alert" : ""}`}>
      <span>{label}</span>
      <b>{value}</b>
      <small>{trend}</small>
    </div>
  );
}

export function PhotoPicker({ onPick }: { onPick: (file: File, preview: string) => void }) {
  const handle = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onPick(file, String(reader.result));
    reader.readAsDataURL(file);
  };
  return (
    <div className="proof-pickers">
      <label>
        <Camera size={18} />
        Tirar foto
        <input type="file" accept="image/*" capture="environment" onChange={e => handle(e.target.files?.[0])} />
      </label>
      <label>
        <ImageIcon size={18} />
        Escolher da galeria
        <input type="file" accept="image/*" onChange={e => handle(e.target.files?.[0])} />
      </label>
    </div>
  );
}

export function WhatsAppBtn({ text, number }: { text?: string; number?: string }) {
  const msg = text || "Olá, Valdir! Estou vendo o catálogo da loja e gostaria de tirar uma dúvida.";
  return (
    <Button
      variant="whatsapp"
      onClick={() => {
        if (!openWhatsApp(number, msg)) toast.success("WhatsApp simulado", { description: msg });
      }}
    >
      <HeartHandshake size={18} />
      Falar com Valdir
    </Button>
  );
}