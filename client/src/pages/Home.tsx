import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { hasSupabase } from "../lib/supabase";
import { currentSession, getRole, onAuthChange, signIn, signOut } from "../lib/auth";
import { Logo, Button, LOGO_STYLE } from "../ui/components";
import { IMG } from "../data/mock";
import ClientApp from "./ClientApp";
import OperatorApp from "./OperatorApp";
import ManagerApp from "./ManagerApp";

export default function Home() {
  const initialPath = typeof window !== "undefined" ? window.location.pathname : "/";
  const [experience, setExperience] = useState<"client" | "operator" | "manager">(
    initialPath.startsWith("/operacao") ? "operator" :
    initialPath.startsWith("/gestao") ? "manager" : "client"
  );
  const [accessGranted, setAccessGranted] = useState(false);
  const [authRole, setAuthRole] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(!hasSupabase);
  const [opScreen, setOpScreen] = useState("home");
  const [managerTab, setManagerTab] = useState("dashboard");

  useEffect(() => {
    if (!hasSupabase) { setAuthReady(true); return; }
    const init = async () => {
      const session = await currentSession();
      const uid = session?.user?.id || null;
      if (uid) setAuthRole(await getRole(uid));
      setAuthReady(true);
    };
    init();
    const sub = onAuthChange((uid) => {
      if (uid) getRole(uid).then(setAuthRole);
      else setAuthRole(null);
    });
    return () => sub.data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!authReady) return;
    const ok = experience === "manager"
      ? authRole === "manager"
      : (authRole === "operator" || authRole === "manager");
    if (ok) setAccessGranted(true);
  }, [authReady, authRole, experience]);

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

  if (experience === "client") {
    return <ClientApp />;
  }

  if (!authReady) {
    return (
      <div className="app-shell" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <p style={{ color: "#66564e" }}>Verificando acesso...</p>
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
    return <OperatorApp screen={opScreen} setScreen={setOpScreen} onExit={leaveProtectedArea} onSignOut={signOutAndLeave} />;
  }

  return <ManagerApp tab={managerTab} setTab={setManagerTab} onSignOut={signOutAndLeave} />;
}

function ProtectedEntry({ kind, onUnlock, onBack }: {
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
      if (!hasSupabase) { onUnlock(); return; }
      const data = await signIn(email.trim(), pwd);
      const role = await getRole(data.user?.id);
      const ok = manager ? role === "manager" : (role === "operator" || role === "manager");
      if (!ok) {
        await signOut();
        setErr("Este usuário não tem acesso a esta área.");
        return;
      }
      onUnlock();
    } catch (e) {
      setErr("Não foi possível entrar. Verifique e-mail e senha.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`app-shell protected-entry ${manager ? "manager-entry" : "operator-entry"}`}>
      <div className="protected-mark">
        <img src={IMG.logo} alt="Produtos do Valdir" style={{ ...LOGO_STYLE, height: 56, maxWidth: 86 }} />
        <span>{manager ? "central do gestor" : "operação da loja"}</span>
      </div>
      <main className="page">
        <span className="eyebrow">acesso protegido</span>
        <h1>{manager ? "Olá, gestor." : "Olá, Valdir e família."}</h1>
        <p>
          {manager
            ? "Entre para acompanhar o movimento completo da loja Produtos do Valdir."
            : "Este espaço reúne os pedidos, produtos e entregas do dia."}
        </p>
        <label>
          E-mail
          <input value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" autoComplete="username" />
        </label>
        <label>
          Senha
          <input type="password" value={pwd} onChange={e => setPwd(e.target.value)} placeholder="••••••••" autoComplete="current-password" />
        </label>
        {err && <p style={{ color: "#bd463b", fontSize: 12, margin: "8px 0" }}>{err}</p>}
        <Button onClick={submit} disabled={busy}>
          {busy ? "Entrando..." : "Entrar no painel"} <ArrowRight size={17} />
        </Button>
        <button className="link-btn protected-back" onClick={onBack}>
          <ArrowLeft size={16} />
          voltar ao catálogo
        </button>
        <small className="demo-note">
          {hasSupabase ? "Acesso protegido com Supabase Auth." : "Autenticação simulada nesta etapa do protótipo."}
        </small>
      </main>
    </div>
  );
}