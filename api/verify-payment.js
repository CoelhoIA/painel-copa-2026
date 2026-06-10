module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { payment_id } = req.query;
  if (!payment_id) return res.status(400).json({ error: 'Missing payment_id' });

  try {
    const response = await fetch(
      `https://api.abacatepay.com/v2/transparents/check?id=${encodeURIComponent(payment_id)}`,
      { headers: { 'Authorization': `Bearer ${process.env.ABACATEPAY_API_KEY}` } }
    );
    const data = await response.json();
    const status = data.status || (data.data && data.data.status);
    res.status(200).json({ valid: status === 'PAID', status });
  } catch (err) {
    res.status(400).json({ valid: false, error: err.message });
  }
};
