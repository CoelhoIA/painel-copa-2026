// Chamado pelo cron-job.org a cada 30 min: ?key=CRON_SECRET
// - Resumo a cada 6h (00h, 06h, 12h, 18h de Brasília) para inscritos no digest
// - Lembrete 1h antes do jogo para quem marcou o jogo
const { FIX, kickoff, GRUPO_BRASIL, redis, sendEmail, FOOTER_LEGAL } = require('../lib/wc');

const HOUR = 3600 * 1000;
const fmtBR = ts => new Date(ts).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

function gameLine(f) {
  return `<li><b>${f[3]} x ${f[4]}</b> — Grupo ${f[2]} — ${fmtBR(kickoff(f))} (Brasília)</li>`;
}

function digestHtml() {
  const now = Date.now();
  const next6 = FIX.filter(f => { const k = kickoff(f); return k > now && k <= now + 6 * HOUR; });
  const last6 = FIX.filter(f => { const k = kickoff(f); return k <= now && k > now - 6 * HOUR; });
  const brNext = FIX.filter(f => f[2] === GRUPO_BRASIL && kickoff(f) > now).slice(0, 4);

  return `
  <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#222">
    <h2 style="color:#0E1726">⚽ PalpitAI — Resumo da Copa 2026</h2>
    ${last6.length ? `<h3>🏁 Jogos das últimas horas</h3>
      <ul>${last6.map(gameLine).join('')}</ul>
      <p style="font-size:13px">Confira os placares e veja se o palpite congelado do modelo foi certeiro (moldura verde) no painel.</p>` : ''}
    ${next6.length ? `<h3>🔜 Próximos jogos (6 horas)</h3>
      <ul>${next6.map(gameLine).join('')}</ul>
      <p style="font-size:13px">Os palpites de cada jogo congelam 6h antes do apito inicial — veja no painel.</p>` : '<p>Sem jogos nas próximas 6 horas.</p>'}
    <h3>🇧🇷 Grupo do Brasil (Grupo ${GRUPO_BRASIL})</h3>
    ${brNext.length ? `<ul>${brNext.map(gameLine).join('')}</ul>` : '<p>Fase de grupos do Brasil encerrada.</p>'}
    <p><a href="https://painel-copa-2026.vercel.app" style="background:#F5B433;color:#1a1300;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:bold">Abrir o painel completo →</a></p>
    ${FOOTER_LEGAL}
  </div>`;
}

function reminderHtml(f) {
  return `
  <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#222">
    <h2 style="color:#0E1726">🔔 Falta 1 hora!</h2>
    <p style="font-size:17px"><b>${f[3]} x ${f[4]}</b><br>Grupo ${f[2]} · ${fmtBR(kickoff(f))} (Brasília)</p>
    <p>Você marcou este jogo para ser avisado. O palpite do modelo já está congelado no painel:</p>
    <p><a href="https://painel-copa-2026.vercel.app" style="background:#F5B433;color:#1a1300;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:bold">Ver palpite congelado →</a></p>
    ${FOOTER_LEGAL}
  </div>`;
}

module.exports = async (req, res) => {
  if (req.query.key !== process.env.CRON_SECRET) return res.status(401).json({ error: 'unauthorized' });

  // Modo de teste: ?test=email@x.com envia um resumo imediato só para esse e-mail
  if (req.query.test) {
    try {
      await sendEmail(req.query.test, '⚽ [TESTE] Copa 2026 — resumo do PalpitAI', digestHtml());
      return res.status(200).json({ ok: true, testSentTo: req.query.test });
    } catch (e) { return res.status(500).json({ error: e.message }); }
  }

  const report = { digestSent: 0, remindersSent: 0, errors: [] };
  try {
    const raw = await redis(['HGETALL', 'subs']);
    // HGETALL REST retorna array [campo, valor, campo, valor...]
    const subs = {};
    for (let i = 0; i < (raw || []).length; i += 2) { try { subs[raw[i]] = JSON.parse(raw[i + 1]); } catch (e) {} }

    const now = Date.now();
    const brHour = parseInt(new Date(now).toLocaleString('en-US', { timeZone: 'America/Sao_Paulo', hour: '2-digit', hour12: false }), 10);
    const brDate = new Date(now).toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });

    // ---- Resumo a cada 6h ----
    if (brHour % 6 === 0) {
      const slot = `${brDate}T${String(brHour).padStart(2, '0')}`;
      const already = await redis(['SET', `digest:${slot}`, '1', 'NX', 'EX', '21600']);
      if (already === 'OK') {
        const html = digestHtml();
        for (const [em, s] of Object.entries(subs)) {
          if (!s.digest) continue;
          try { await sendEmail(em, '⚽ Copa 2026 — seu resumo de 6h do PalpitAI', html); report.digestSent++; }
          catch (e) { report.errors.push(`digest ${em}: ${e.message}`); }
        }
      }
    }

    // ---- Lembrete 1h antes ----
    for (const [em, s] of Object.entries(subs)) {
      for (const mid of (s.watch || [])) {
        const f = FIX.find(x => x[0] === mid);
        if (!f) continue;
        const k = kickoff(f);
        if (now >= k - HOUR && now < k) {
          const flag = await redis(['SET', `rem:${mid}:${em}`, '1', 'NX', 'EX', '7200']);
          if (flag === 'OK') {
            try { await sendEmail(em, `🔔 ${f[3]} x ${f[4]} começa em 1 hora!`, reminderHtml(f)); report.remindersSent++; }
            catch (e) { report.errors.push(`rem ${em}: ${e.message}`); }
          }
        }
      }
    }

    return res.status(200).json({ ok: true, ...report, subscribers: Object.keys(subs).length });
  } catch (err) {
    return res.status(500).json({ error: err.message, ...report });
  }
};
