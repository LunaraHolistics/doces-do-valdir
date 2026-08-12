import { Component, ReactNode } from "react";
import { HomeIcon, RefreshCw } from "lucide-react";
import { Button } from "./components";

interface State { hasError: boolean; message: string; }

export default class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { hasError: false, message: "" };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: any) {
    console.error("Erro capturado pelo ErrorBoundary:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="app-shell" style={{ minHeight: "100vh", padding: 40, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", background: "#fffaf1" }}>
          <div style={{ width: 80, height: 80, borderRadius: "50%", background: "#ffe0dc", display: "grid", placeItems: "center", marginBottom: 20 }}>
            <RefreshCw size={32} color="#bd463b" />
          </div>
          <h1 style={{ fontFamily: "Fraunces", fontSize: 26, color: "#2f241f", margin: "8px 0" }}>Ops! Algo deu errado.</h1>
          <p style={{ color: "#66564e", maxWidth: 320, lineHeight: 1.5, margin: "8px 0 24px" }}>
            Houve um problema inesperado. Tente recarregar a página. Se continuar, fale com o Valdir pelo WhatsApp.
          </p>
          <details style={{ textAlign: "left", fontSize: 12, color: "#8d786d", marginBottom: 20, maxWidth: 400, width: "100%" }}>
            <summary style={{ cursor: "pointer" }}>Detalhes técnicos</summary>
            <pre style={{ background: "#f3e9dd", padding: 10, borderRadius: 8, marginTop: 8, overflow: "auto" }}>
              {this.state.message}
            </pre>
          </details>
          <Button onClick={() => window.location.reload()}>
            <RefreshCw size={16} /> Recarregar página
          </Button>
          <Button variant="ghost" onClick={() => window.location.href = "/"}>
            <HomeIcon size={16} /> Voltar ao início
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}