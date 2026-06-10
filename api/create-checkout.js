module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const origin = `https://${req.headers.host}`;
    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        items: [{
          title: 'PalpitAI Copa 2026 — Acesso Completo',
          description: 'Previsões estatísticas para todos os 72 jogos da fase de grupos da Copa 2026',
          quantity: 1,
          unit_price: 10.00,
          currency_id: 'BRL'
        }],
        back_urls: {
          success: `${origin}/`,
          failure: `${origin}/`,
          pending: `${origin}/`
        },
        auto_return: 'approved',
        payment_methods: { installments: 1 }
      })
    });

    const data = await response.json();
    if (data.init_point) {
      res.status(200).json({ url: data.init_point });
    } else {
      res.status(500).json({ error: 'Erro ao criar preferência', detail: data });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
