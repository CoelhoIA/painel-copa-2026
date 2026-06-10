# Painel Copa 2026 — guia do projeto

## O que é
Página estática única (`index.html`) — um painel de previsão de placares da Copa do Mundo 2026.
Não tem build, não tem dependências, não tem backend. É só HTML + CSS + JavaScript num arquivo só.

## Arquivo
- `index.html` — todo o app (modelo Poisson/Dixon-Coles, dados das 48 seleções, calendário da fase de grupos, UI).

## Persistência
Usa `localStorage` do navegador (ajustes de força e resultados lançados ficam salvos no dispositivo). Não precisa de banco de dados.

## Objetivo de deploy
Publicar como site estático na Vercel, gerando uma URL pública `*.vercel.app`.
- Não há comando de build. Output é a raiz (o próprio `index.html`).
- Para a página carregar na raiz, o arquivo PRECISA se chamar `index.html`.

## Tarefas comuns que vou pedir
- "Configure git nesta pasta, suba pro meu GitHub e faça deploy na Vercel" (pausando pra eu autorizar logins no navegador).
- "Atualize o index.html" quando eu trouxer uma versão nova.
- "Adicione a fase de mata-mata" / "adicione os horários dos jogos" / "adicione um placar de acertos do modelo".

## Regras
- Sempre pedir minha permissão antes de rodar comandos e antes de qualquer push/deploy.
- Nunca digitar minhas senhas nem criar contas por mim — esses passos são meus.
- Manter tudo em um único arquivo `index.html` (sem frameworks, sem etapa de build).
