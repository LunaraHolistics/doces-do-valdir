# Direção visual — Produtos do Valdir

## Identidade oficial
- Nome oficial: **Produtos do Valdir** (doces, balas, lanches e pequenas utilidades).
- Símbolo/favicon: arte do Valdir no carro (`client/public/logo-valdir.png`).
- Wordmark: “Produtos do” pequeno + “Valdir” em destaque (Fraunces).
- Não usar: “mercadinho”, “mercearia de bairro”, “Quitanda Solar”.

## Cor protagonista
- **Verde** (#2f7659 / #235842 / #e2f0e7) para ações principais, destaques, preços e estados positivos.
- Terracota/vermelho (#b6533d / #bd463b) **somente** para urgência e pendências.
- Creme/papel (#fffaf1 / #fffdf8) como base de apoio; carvão apenas na moldura do painel gestor.

## Princípios
1. Mobile first, retrato, 375–430px; toque generoso (mínimo 44px onde possível).
2. Uma ação principal por tela; frases curtas; linguagem acolhedora e direta.
3. Contraste forte sempre: nenhum texto próximo da cor do fundo; texto sobre foto só com bloco/overlay.
4. Catálogo é a porta de entrada pública; áreas do operador e do gestor são protegidas e separadas.
5. Painel do Valdir: extremamente simples (cards grandes, poucos botões).
6. Painel do gestor: denso e compacto (mais dados, menos padding).

## Tipografia
- Fraunces: marca, títulos e números de destaque.
- DM Sans: corpo, labels e controles. Corpo mínimo 15px.

## Regras de negócio visíveis no protótipo
- Ribeirão Preto: entrega por região ou retirada (controlável no gestor).
- Araraquara: encomenda com data definida pelo gestor.
- PIX e cartão: entrada de 50% (percentual configurável no futuro).
- Dinheiro: regra configurável; padrão “total na entrega/retirada”, sem comprovante.
- Urgente: prioridade sinalizada, sem promessa de entrega imediata.
- Status: NOVO → CONFIRMADO → AGUARDANDO PAGAMENTO → SEPARANDO → PRONTO PARA ROTA → CONCLUÍDO (+ PENDENTE DE ENTREGA).
- Rota: finalizar em lote com pergunta “Entregou tudo?”; NÃO → selecionar pendentes com motivo.

## Mocks (fase atual)
- Fotos de categoria em SVG estilo etiqueta (doces/balas/lanches/utilidades).
- Fotos reais entrarão na fase Supabase Storage (Valdir tira a foto no painel).
- WhatsApp, Google e PIX simulados; valores hardcoded migram para configurações.