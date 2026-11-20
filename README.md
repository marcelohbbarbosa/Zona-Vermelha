# Zona-Vermelha
Para efetuar o download do app clique aqui:
https://expo.dev/artifacts/eas/5CLX7Tf9auFLZ2PkrVhSDt.apk

Repositorio para desenvolvimento da aplicacao para a conclusao de curso de Desenvolvimento de Sistemas.

## Estrutura

- `api/`: backend Express com as rotas de comentarios.
- `mobile/`: aplicativo React Native com Expo.

## Rodar o backend

```powershell
cd api
npm install
npm run dev
```

A API roda em `http://localhost:3000`.

## Hospedagem: Render + Supabase

- O `render.yaml` configura o backend como um serviço web gratuito, com diretório raiz `api/`, build `npm ci && npm run build` e start `npm start`.
- Crie o serviço a partir do Blueprint deste repositório no Render. O Render gera o domínio público e fornece a porta pela variável `PORT`; o servidor escuta nessa porta em `0.0.0.0`.
- No primeiro deploy, informe `DATABASE_URL` com a connection string PostgreSQL do Supabase. Codifique em URL caracteres especiais da senha. A conexão existente usa SSL. O Blueprint não cria outro banco.
- O Blueprint gera `JWT_SECRET` e `ROUTE_ADMIN_TOKEN`. Para enviar confirmação e recuperação sem domínio próprio, configure `GMAIL_USER` com sua conta Gmail e `GMAIL_APP_PASSWORD` com uma senha de app do Google. `EMAIL_FROM` deve usar esse mesmo endereço. A API também mantém suporte opcional ao Resend.
- Para desenvolver localmente, mantenha a URL do banco em `api/.env`; esse arquivo é ignorado pelo Git. Use `api/.env.example` como referência e nunca coloque credenciais reais em arquivos versionados.
- Aplique no Supabase as migrações necessárias do projeto, incluindo `api/src/database/migrations/20261028_rotas_risco.sql` e `api/src/database/migrations/20261120_avaliacoes_regiao.sql`, antes de usar as rotas correspondentes.
- Configure `EXPO_PUBLIC_API_URL` no `mobile/.env` e no ambiente de build do app com o domínio público `https://...onrender.com`. Reinicie o Expo após alterar a variável; para um APK, faça um novo build.
- No plano gratuito, o serviço web pode dormir após 15 minutos sem tráfego e demorar para responder à primeira requisição seguinte. O banco continua no Supabase.

## Rodar o app

```powershell
cd mobile
npm install
npm run web
```

Configure `EXPO_PUBLIC_API_URL` para a URL que o app deve acessar. Para acessar um backend local no Android Emulator, use `http://10.0.2.2:3000`; em produção, use o domínio público do Render.


