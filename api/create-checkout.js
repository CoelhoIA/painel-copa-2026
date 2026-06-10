module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const response = await fetch('https://api.abacatepay.com/v2/transparents/create', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.ABACATEPAY_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        method: 'PIX',
        data: {
          amount: 1000,
          description: 'PalpitAI Copa 2026 — Acesso Completo',
          expiresIn: 1800
        }
      })
    });

    const result = await response.json();
    if (result.success && result.data) {
      res.status(200).json({
        id: result.data.id,
        brCode: result.data.brCode,
        brCodeBase64: result.data.brCodeBase64,
        expiresAt: result.data.expiresAt
      });
    } else {
      res.status(500).json({ error: result.error || 'Erro ao criar cobrança Pix' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
