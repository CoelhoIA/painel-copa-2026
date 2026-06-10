// Endpoint de teste — só funciona com chave sandbox do AbacatePay (devMode).
// Remover quando trocar para a chave de produção.
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { payment_id } = req.query;
  if (!payment_id) return res.status(400).json({ error: 'Missing payment_id' });

  try {
    const response = await fetch(
      `https://api.abacatepay.com/v2/transparents/simulate-payment?id=${encodeURIComponent(payment_id)}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.ABACATEPAY_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      }
    );
    const data = await response.json();
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
