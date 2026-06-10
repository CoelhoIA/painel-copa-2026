const { redis } = require('../lib/wc');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, action, digest, brazil, watch, adult } = req.body || {};
  const em = String(email || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) return res.status(400).json({ error: 'E-mail inválido' });

  try {
    if (action === 'unsubscribe') {
      await redis(['HDEL', 'subs', em]);
      return res.status(200).json({ ok: true, unsubscribed: true });
    }
    if (adult !== true) return res.status(400).json({ error: 'É necessário confirmar maioridade (+18)' });

    const sub = {
      digest: !!digest,
      brazil: !!brazil,
      watch: Array.isArray(watch) ? watch.filter(id => /^m\d{2}$/.test(id)).slice(0, 72) : [],
      adult: true,
      updatedAt: new Date().toISOString()
    };
    await redis(['HSET', 'subs', em, JSON.stringify(sub)]);
    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
