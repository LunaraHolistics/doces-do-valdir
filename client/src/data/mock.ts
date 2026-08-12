export const IMG = {
  hero: "/manus-storage/hero-doces_8c4d1eff.jpg",
  logo: "/logo-valdir.png",
  doces: "/doces.svg",
  balas: "/balas.svg",
  lanches: "/lanches.svg",
  utilidades: "/utilidades.svg",
};

export const MOCK_CATEGORIES = [
  { id: 1, name: "Doces", sort: 1 },
  { id: 2, name: "Balas", sort: 2 },
  { id: 3, name: "Lanches", sort: 3 },
  { id: 4, name: "Utilidades", sort: 4 },
];

export const MOCK_PRODUCTS = [
  { id: "p1", category_id: 1, name: "Doce de leite cremoso", description: "Pote 400g, textura cremosa e sabor de fazenda.", price_cents: 1290, cost_cents: 700, stock: 18, image_url: IMG.doces, active: true },
  { id: "p2", category_id: 1, name: "Paçoca rolha", description: "Pacotinho com 6 unidades.", price_cents: 750, cost_cents: 400, stock: 24, image_url: IMG.doces, active: true },
  { id: "p3", category_id: 1, name: "Pé de moleque", description: "Crocante, feito com amendoim selecionado.", price_cents: 890, cost_cents: 480, stock: 14, image_url: IMG.doces, active: true },
  { id: "p4", category_id: 1, name: "Doce de amendoim", description: "Doce macio em embalagem individual.", price_cents: 690, cost_cents: 350, stock: 21, image_url: IMG.doces, active: true },
  { id: "p5", category_id: 2, name: "Bala sortida", description: "Mix colorido para adoçar o dia.", price_cents: 500, cost_cents: 250, stock: 42, image_url: IMG.balas, active: true },
  { id: "p6", category_id: 2, name: "Bala de goma", description: "Pacote 200g com sabores variados.", price_cents: 650, cost_cents: 320, stock: 27, image_url: IMG.balas, active: true },
  { id: "p7", category_id: 2, name: "Chiclete hortelã", description: "Cartela com 10 unidades.", price_cents: 390, cost_cents: 180, stock: 36, image_url: IMG.balas, active: true },
  { id: "p8", category_id: 2, name: "Pirulito coração", description: "Unidade, sabores sortidos.", price_cents: 150, cost_cents: 60, stock: 56, image_url: IMG.balas, active: true },
  { id: "p9", category_id: 3, name: "Salgadinho queijo", description: "Pacote crocante 90g.", price_cents: 490, cost_cents: 260, stock: 33, image_url: IMG.lanches, active: true },
  { id: "p10", category_id: 3, name: "Biscoito caseiro", description: "Pacote 250g.", price_cents: 790, cost_cents: 420, stock: 16, image_url: IMG.lanches, active: true },
  { id: "p11", category_id: 3, name: "Chocolate ao leite", description: "Barra 90g.", price_cents: 690, cost_cents: 380, stock: 19, image_url: IMG.lanches, active: true },
  { id: "p12", category_id: 3, name: "Suco em pó uva", description: "Rende 1 litro.", price_cents: 199, cost_cents: 90, stock: 48, image_url: IMG.lanches, active: true },
  { id: "p13", category_id: 4, name: "Pilha AA", description: "Cartela com 2 unidades.", price_cents: 1200, cost_cents: 700, stock: 11, image_url: IMG.utilidades, active: true },
  { id: "p14", category_id: 4, name: "Pilha AAA", description: "Cartela com 2 unidades.", price_cents: 1200, cost_cents: 700, stock: 8, image_url: IMG.utilidades, active: true },
  { id: "p15", category_id: 4, name: "Caixa de fósforos", description: "Caixa com 40 palitos.", price_cents: 350, cost_cents: 150, stock: 17, image_url: IMG.utilidades, active: true },
  { id: "p16", category_id: 4, name: "Vela de aniversário", description: "Kit com 10 unidades.", price_cents: 400, cost_cents: 180, stock: 29, image_url: IMG.utilidades, active: true },
];

export const MOCK_ORDERS = [
  { id: "m1", number: "DV-1048", customer_name: "Dona Célia", customer_phone: "", city: "Ribeirão Preto", region: "Zona Norte", total_cents: 8640, status: "NOVO", urgent: true, payment_method: "PIX", payment_confirmed: true, proof_url: null },
  { id: "m2", number: "DV-1047", customer_name: "Marcos Lima", customer_phone: "", city: "Ribeirão Preto", region: "Centro", total_cents: 4290, status: "CONFIRMADO", urgent: false, payment_method: "CARTAO", payment_confirmed: false, proof_url: null },
  { id: "m3", number: "DV-1046", customer_name: "Ana Paula", customer_phone: "", city: "Ribeirão Preto", region: "Zona Sul", total_cents: 12590, status: "AGUARDANDO PAGAMENTO", urgent: true, payment_method: "PIX", payment_confirmed: false, proof_url: null },
  { id: "m4", number: "DV-1045", customer_name: "João Ferreira", customer_phone: "", city: "Ribeirão Preto", region: "Zona Norte", total_cents: 6450, status: "SEPARANDO", urgent: false, payment_method: "DINHEIRO", payment_confirmed: false, proof_url: null },
  { id: "m5", number: "DV-1044", customer_name: "Lúcia Martins", customer_phone: "", city: "Ribeirão Preto", region: "Zona Leste", total_cents: 9200, status: "PRONTO PARA ROTA", urgent: false, payment_method: "PIX", payment_confirmed: true, proof_url: null },
  { id: "m6", number: "DV-1043", customer_name: "Rafael Souza", customer_phone: "", city: "Araraquara", region: "Encomenda", total_cents: 15580, status: "PENDENTE DE ENTREGA", urgent: false, payment_method: "PIX", payment_confirmed: true, proof_url: null },
  { id: "m7", number: "DV-1042", customer_name: "Bia Costa", customer_phone: "", city: "Ribeirão Preto", region: "Centro", total_cents: 3850, status: "CONCLUÍDO", urgent: false, payment_method: "DINHEIRO", payment_confirmed: false, proof_url: null },
  { id: "m8", number: "DV-1041", customer_name: "Carlos Nunes", customer_phone: "", city: "Ribeirão Preto", region: "Zona Sul", total_cents: 7490, status: "CONCLUÍDO", urgent: false, payment_method: "CARTAO", payment_confirmed: true, proof_url: null },
];

export const MOCK_HISTORY = [
  {
    id: "DV-1038", date: "08 ago 2026", status: "CONCLUÍDO",
    items: [{ id: "p1", qty: 2, price: 12.9 }, { id: "p2", qty: 2, price: 7.5 }, { id: "p5", qty: 4, price: 5 }]
  },
  {
    id: "DV-0982", date: "22 jul 2026", status: "CONCLUÍDO",
    items: [{ id: "p11", qty: 3, price: 6.9 }, { id: "p10", qty: 2, price: 7.9 }]
  },
];