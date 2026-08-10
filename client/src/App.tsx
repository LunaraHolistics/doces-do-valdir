/* Quitanda Solar: o App apenas monta a experiência mobile e mantém as três áreas separadas. */
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import ErrorBoundary from "./components/ErrorBoundary";
import Home from "./pages/Home";

export default function App() {
  return <ErrorBoundary><TooltipProvider><Toaster position="top-center"/><Home /></TooltipProvider></ErrorBoundary>;
}
