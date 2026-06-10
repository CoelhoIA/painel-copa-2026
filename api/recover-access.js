const PRODUCT = 'PalpitAI Copa 2026 — Acesso Completo';

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const email = (req.query.email || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ valid: false, error: 'E-mail inválido' });
  }

  const headers = { 'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}` };
  const urls = [
    `https://api.mercadopago.com/v1/payments/search?status=approved&external_reference=${encodeURIComponent(email)}&sort=date_created&criteria=desc&limit=30`,
    `https://api.mercadopago.com/v1/payments/search?status=approved&payer.email=${encodeURIComponent(email)}&sort=date_created&criteria=desc&limit=30`
  ];

  try {
    for (const url of urls) {
      const response = await fetch(url, { headers });
      if (!response.ok) continue;
      const data = await response.json();
      const results = data.results || [];
      const match = results.find(p =>
        p.status === 'approved' &&
        p.description === PRODUCT &&
        ((p.payer && p.payer.email && p.payer.email.toLowerCase() === email) ||
         (p.external_reference && p.external_reference.toLowerCase() === email))
      );
      if (match) {
        return res.status(200).json({ valid: true, token: String(match.id) });
      }
    }
    res.status(200).json({ valid: false });
  } catch (err) {
    res.status(500).json({ valid: false, error: err.message });
  }
};
