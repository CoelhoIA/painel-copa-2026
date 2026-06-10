module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { payment_id } = req.query;
  if (!payment_id) return res.status(400).json({ error: 'Missing payment_id' });

  try {
    const response = await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(payment_id)}`, {
      headers: { 'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}` }
    });
    const data = await response.json();
    const status = data.status;
    res.status(200).json({
      valid: status === 'approved',
      status: status === 'cancelled' || status === 'expired' ? 'EXPIRED' : status
    });
  } catch (err) {
    res.status(400).json({ valid: false, error: err.message });
  }
};
