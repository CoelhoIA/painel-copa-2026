// Dados compartilhados + helpers (Redis Upstash e e-mail Brevo)

// [id, data ISO, grupo, mandante, visitante]
const FIX = [
 ["m01","2026-06-11","A","México","África do Sul"],["m02","2026-06-11","A","Coreia do Sul","Tchéquia"],
 ["m03","2026-06-12","B","Canadá","Bósnia"],["m04","2026-06-12","D","EUA","Paraguai"],
 ["m05","2026-06-13","B","Catar","Suíça"],["m06","2026-06-13","C","Brasil","Marrocos"],["m07","2026-06-13","C","Haiti","Escócia"],["m08","2026-06-13","D","Austrália","Turquia"],
 ["m09","2026-06-14","E","Alemanha","Curaçao"],["m10","2026-06-14","F","Holanda","Japão"],["m11","2026-06-14","E","Costa do Marfim","Equador"],["m12","2026-06-14","F","Suécia","Tunísia"],
 ["m13","2026-06-15","H","Espanha","Cabo Verde"],["m14","2026-06-15","G","Bélgica","Egito"],["m15","2026-06-15","H","Arábia Saudita","Uruguai"],["m16","2026-06-15","G","Irã","Nova Zelândia"],
 ["m17","2026-06-16","I","França","Senegal"],["m18","2026-06-16","I","Iraque","Noruega"],["m19","2026-06-16","J","Argentina","Argélia"],["m20","2026-06-16","J","Áustria","Jordânia"],
 ["m21","2026-06-17","K","Portugal","RD Congo"],["m22","2026-06-17","L","Inglaterra","Croácia"],["m23","2026-06-17","L","Gana","Panamá"],["m24","2026-06-17","K","Uzbequistão","Colômbia"],
 ["m25","2026-06-18","A","Tchéquia","África do Sul"],["m26","2026-06-18","B","Suíça","Bósnia"],["m27","2026-06-18","B","Canadá","Catar"],["m28","2026-06-18","A","México","Coreia do Sul"],
 ["m29","2026-06-19","D","EUA","Austrália"],["m30","2026-06-19","C","Escócia","Marrocos"],["m31","2026-06-19","C","Brasil","Haiti"],["m32","2026-06-19","D","Turquia","Paraguai"],
 ["m33","2026-06-20","F","Holanda","Suécia"],["m34","2026-06-20","E","Alemanha","Costa do Marfim"],["m35","2026-06-20","E","Equador","Curaçao"],["m36","2026-06-20","F","Tunísia","Japão"],
 ["m37","2026-06-21","H","Espanha","Arábia Saudita"],["m38","2026-06-21","G","Bélgica","Irã"],["m39","2026-06-21","H","Uruguai","Cabo Verde"],["m40","2026-06-21","G","Nova Zelândia","Egito"],
 ["m41","2026-06-22","J","Argentina","Áustria"],["m42","2026-06-22","I","França","Iraque"],["m43","2026-06-22","I","Noruega","Senegal"],["m44","2026-06-22","J","Jordânia","Argélia"],
 ["m45","2026-06-23","K","Portugal","Uzbequistão"],["m46","2026-06-23","L","Inglaterra","Gana"],["m47","2026-06-23","L","Panamá","Croácia"],["m48","2026-06-23","K","Colômbia","RD Congo"],
 ["m49","2026-06-24","B","Suíça","Canadá"],["m50","2026-06-24","B","Bósnia","Catar"],["m51","2026-06-24","C","Escócia","Brasil"],["m52","2026-06-24","C","Marrocos","Haiti"],["m53","2026-06-24","A","Tchéquia","México"],["m54","2026-06-24","A","África do Sul","Coreia do Sul"],
 ["m55","2026-06-25","D","Turquia","EUA"],["m56","2026-06-25","D","Paraguai","Austrália"],["m57","2026-06-25","E","Equador","Alemanha"],["m58","2026-06-25","E","Curaçao","Costa do Marfim"],["m59","2026-06-25","F","Tunísia","Holanda"],["m60","2026-06-25","F","Japão","Suécia"],
 ["m61","2026-06-26","G","Egito","Irã"],["m62","2026-06-26","G","Nova Zelândia","Bélgica"],["m63","2026-06-26","H","Uruguai","Espanha"],["m64","2026-06-26","H","Cabo Verde","Arábia Saudita"],
 ["m65","2026-06-27","I","Noruega","França"],["m66","2026-06-27","I","Senegal","Iraque"],["m67","2026-06-27","J","Jordânia","Argentina"],["m68","2026-06-27","J","Argélia","Áustria"],["m69","2026-06-27","K","Colômbia","Portugal"],["m70","2026-06-27","K","RD Congo","Uzbequistão"],["m71","2026-06-27","L","Croácia","Gana"],["m72","2026-06-27","L","Panamá","Inglaterra"]
];

// Horários confirmados (Brasília). Sem horário confirmado → 16:00.
const KICKOFF = {
  m01: '2026-06-11T16:00:00-03:00',
  m02: '2026-06-11T23:00:00-03:00'
};

function kickoff(idOrFix) {
  const fx = Array.isArray(idOrFix) ? idOrFix : FIX.find(x => x[0] === idOrFix);
  if (!fx) return null;
  return new Date(KICKOFF[fx[0]] || (fx[1] + 'T16:00:00-03:00')).getTime();
}

const GRUPO_BRASIL = 'C';

// ---- Redis (REDIS_URL — integração oficial da Vercel) ----
let _client = null;
async function getClient() {
  if (_client && _client.isOpen) return _client;
  const { createClient } = require('redis');
  _client = createClient({ url: process.env.REDIS_URL });
  _client.on('error', () => {});
  await _client.connect();
  return _client;
}
async function redis(cmd) {
  const c = await getClient();
  return c.sendCommand(cmd.map(String));
}

// ---- Brevo (envio de e-mail) ----
async function sendEmail(to, subject, html) {
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': process.env.BREVO_API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      sender: { name: 'PalpitAI Copa 2026', email: process.env.SENDER_EMAIL },
      to: [{ email: to }],
      subject,
      htmlContent: html
    })
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Brevo ${res.status}: ${t}`);
  }
  return true;
}

const FOOTER_LEGAL = `
  <hr style="border:none;border-top:1px solid #ddd;margin:18px 0">
  <p style="font-size:11px;color:#888;line-height:1.5">
    O <b>PalpitAI</b> é uma ferramenta de análise estatística e <b>não é casa de apostas</b>:
    não recebemos apostas nem pagamos prêmios. Previsões são estimativas probabilísticas,
    sem garantia de resultado. Conteúdo destinado a maiores de 18 anos (🔞).
    Se decidir apostar, aposte com responsabilidade — só o que pode perder.<br>
    Você recebe este e-mail porque se inscreveu em painel-copa-2026.vercel.app.
    Para cancelar, acesse o site e clique em "Alertas por e-mail" → "Cancelar inscrição".
  </p>`;

module.exports = { FIX, KICKOFF, kickoff, GRUPO_BRASIL, redis, sendEmail, FOOTER_LEGAL };
