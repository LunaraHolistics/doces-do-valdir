# Direção visual — Doces do Valdir

## Três caminhos explorados

### Abordagem 1 — Quitanda Solar
**Very Brief Intro:** Uma loja familiar contemporânea com calor de mercearia de bairro, cores de doce de leite e detalhes artesanais. A sensação é de confiança, proximidade e compra sem esforço.
**Probability:** 0.06

### Abordagem 2 — Balcão de Bolso
**Very Brief Intro:** Uma interface editorial e compacta inspirada em etiquetas de balcão, listas de feira e cadernos de pedidos. A prioridade é a legibilidade para quem usa o celular com pressa.
**Probability:** 0.04

### Abordagem 3 — Armazém de Domingo
**Very Brief Intro:** Uma experiência de varejo acolhedora com azul de embalagem antiga, creme de papel e vermelho de selo de urgência. O produto aparece como protagonista, sem parecer marketplace.
**Probability:** 0.08

## Abordagem escolhida — Quitanda Solar

### Design Movement
Neo-artesanal brasileiro: uma mistura de mercearia de bairro, embalagem de doce caseiro e design editorial contemporâneo.

### Core Principles
1. **Calor antes de complexidade:** superfícies creme, terracota e amarelo manteiga criam acolhimento sem excesso decorativo.
2. **Uma ação principal por vez:** botões grandes, estados explícitos e frases curtas para reduzir carga cognitiva.
3. **Produto com apetite visual:** fotos em molduras orgânicas e cards com espaço respirado.
4. **Operação sem medo:** o painel de Valdir usa linguagem direta, estados coloridos e confirmações simples.

### Color Philosophy
O fundo creme lembra papel de balcão e deixa as fotos dos produtos respirarem. O terracota é a assinatura de proximidade e ação. O verde folha sinaliza disponibilidade e conclusão; o vermelho goiabada aparece somente para urgência e pendências. A paleta evita azul corporativo e roxo genérico para preservar o caráter familiar.

### Layout Paradigm
Fluxo vertical em cartões empilhados, com trilhas horizontais curtas para categorias e estados. O catálogo usa blocos assimétricos: destaque amplo, seguida de grade de dois produtos. Os painéis internos usam navegação inferior persistente e seções em acordeão visual, não dashboards desktop comprimidos.

### Signature Elements
- Selo circular “feito para hoje” e chip de urgência com formato de etiqueta.
- Molduras de produto em creme com cantos alternados levemente arredondados.
- Barras de progresso e estados com marcadores grandes, inspirados em um caderno de pedidos.

### Interaction Philosophy
Toda ação deve produzir retorno visível: quantidade muda no próprio card, o carrinho mostra o próximo passo, e confirmações aparecem como cartões de status. O protótipo simula WhatsApp, Google e PIX sem interromper o fluxo.

### Animation
Entradas curtas em fade + deslocamento de 8px, sempre abaixo de 240ms. Cards de produto elevam 2px ao toque; o selo de urgência pulsa somente em contextos operacionais. Modais usam escala inicial 0.97 e opacidade, respeitando prefers-reduced-motion.

### Typography System
**Fraunces** para marca, títulos e números de destaque; **DM Sans** para corpo, labels e controles. H1 entre 30–36px; títulos de seção 20–24px; corpo mínimo 15px; botões 15–16px sem caixa alta excessiva.

### Brand Essence
Uma mercearia doce e prática no celular, para quem quer comprar com confiança de vizinhança e receber sem complicação. **Próxima, honesta, caprichosa.**

### Brand Voice
Headlines são calorosas e objetivas; CTAs dizem exatamente o que acontece; microcopy acolhe sem infantilizar. Exemplos: “Escolha seus favoritos de hoje” e “Seu pedido pronto para seguir viagem”.

### Wordmark & Logo
Wordmark em Fraunces com “Doces do” pequeno acima de “Valdir”, acompanhado por um símbolo de sol em forma de doce embrulhado; o ícone é legível em tamanhos pequenos e funciona como favicon.

### Signature Brand Color
**Terracota Goiabada — #C85A3F**, usado em CTAs, marca e estados de ação para tornar a loja reconhecível sem agressividade.

## Style Decisions
- Interface mobile-first, retrato, otimizada para 375–430px.
- Sem avaliações, cupons, pontos, fidelidade, gamificação, marketplace ou chat interno.
- Mocks funcionais para Google, WhatsApp, PIX e dados persistidos apenas em estado local.
- Separação clara entre experiência Cliente, Operador e Gestor.
