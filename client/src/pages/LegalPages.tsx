import { Header } from "../ui/components";

const home = () => { window.location.href = "/"; };

export function PrivacyPage() {
  return (
    <div className="app-shell">
      <Header title="Política de Privacidade" onLogo={home} />
      <main className="page legal">
        <h1 style={{ fontFamily: "Fraunces", fontSize: 26, margin: "8px 0" }}>Política de Privacidade</h1>
        <p>Produtos do Valdir · Ribeirão Preto/SP · atualizada em agosto de 2026.</p>
        <h2>1. Quais dados coletamos</h2>
        <ul>
          <li>Nome, WhatsApp e endereço informados no pedido ou no cadastro;</li>
          <li>Nome do estabelecimento e recados/pontos de referência, se informados;</li>
          <li>Dados de login com Google (nome, e-mail), se você escolher entrar;</li>
          <li>Comprovantes de pagamento enviados por você (fotos).</li>
        </ul>
        <h2>2. Para que usamos</h2>
        <ul>
          <li>Preparar, confirmar e entregar seus pedidos;</li>
          <li>Conferir pagamentos (PIX, cartão ou dinheiro);</li>
          <li>Atender você pelo WhatsApp;</li>
          <li>Pré-preencher seus próximos pedidos.</li>
        </ul>
        <h2>3. Com quem compartilhamos</h2>
        <p>Não vendemos nem alugamos seus dados. Eles ficam armazenados em infraestrutura segura (Supabase) e são usados apenas pela equipe da loja para operar suas entregas.</p>
        <h2>4. Por quanto tempo guardamos</h2>
        <p>Pelo tempo necessário para operar os pedidos e cumprir obrigações legais. Você pode pedir a exclusão a qualquer momento.</p>
        <h2>5. Seus direitos (LGPD)</h2>
        <p>Você pode acessar, corrigir ou eliminar seus dados, e revogar consentimentos, falando com a loja pelo WhatsApp ou pelo e-mail de contato.</p>
        <h2>6. Cookies e armazenamento local</h2>
        <p>Usamos apenas o essencial para o site funcionar (sessão de login e preferências). Não usamos cookies de publicidade.</p>
        <h2>7. Contato</h2>
        <p>Responsável: Valdir · WhatsApp configurado na loja · Ribeirão Preto/SP.</p>
      </main>
    </div>
  );
}

export function TermsPage() {
  return (
    <div className="app-shell">
      <Header title="Termos de Uso" onLogo={home} />
      <main className="page legal">
        <h1 style={{ fontFamily: "Fraunces", fontSize: 26, margin: "8px 0" }}>Termos de Uso</h1>
        <p>Produtos do Valdir · Ribeirão Preto/SP · atualizada em agosto de 2026.</p>
        <h2>1. Como funciona a loja</h2>
        <p>O site é um catálogo com pedidos entregues por região em Ribeirão Preto/SP e encomendas programadas para Araraquara/SP. Preços e estoque podem mudar sem aviso; o valor válido é o exibido no momento do pedido.</p>
        <h2>2. Pedidos e pagamento</h2>
        <ul>
          <li>PIX ou cartão: entrada configurada pela loja (padrão 50%) ou pagamento integral;</li>
          <li>Dinheiro: pagamento total na entrega/retirada, salvo regra definida pela loja;</li>
          <li>O pedido é confirmado após a conferência do pagamento.</li>
        </ul>
        <h2>3. Entregas e retiradas</h2>
        <p>As entregas são organizadas por rotas e regiões. O pedido marcado como URGENTE recebe prioridade de análise, mas não garante entrega imediata. Retiradas ocorrem no endereço informado pela loja.</p>
        <h2>4. Produtos sob encomenda</h2>
        <p>Itens sem estoque podem ser pedidos “sob encomenda”: a loja confirma a disponibilidade e o prazo pelo WhatsApp antes de separar.</p>
        <h2>5. Cancelamentos e trocas</h2>
        <p>Cancelamentos podem ser solicitados pelo WhatsApp antes da separação. Produtos com defeito ou divergentes serão trocados ou reembolsados.</p>
        <h2>6. Uso da conta</h2>
        <p>Você é responsável pelas informações enviadas. O código de acesso do pedido permite acompanhar o status; não o compartilhe com terceiros.</p>
        <h2>7. Contato</h2>
        <p>Dúvidas: fale com a loja pelo botão “Falar com Valdir” ou pelos canais oficiais.</p>
      </main>
    </div>
  );
}