const crypto = require('crypto');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  const email = body && body.email;
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'E-mail inválido' });
  }

  try {
    const response = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': crypto.randomUUID()
      },
      body: JSON.stringify({
        transaction_amount: 10,
        description: 'PalpitAI Copa 2026 — Acesso Completo',
        payment_method_id: 'pix',
        payer: { email }
      })
    });

    const data = await response.json();
    const tx = data.point_of_interaction && data.point_of_interaction.transaction_data;
    if (data.id && tx && tx.qr_code) {
      res.status(200).json({
        id: String(data.id),
        brCode: tx.qr_code,
        brCodeBase64: 'data:image/png;base64,' + tx.qr_code_base64
      });
    } else {
      res.status(500).json({ error: data.message || 'Erro ao criar pagamento Pix', detail: data });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
