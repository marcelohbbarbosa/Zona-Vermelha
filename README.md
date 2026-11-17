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

## Hospedagem: Railway + Supabase

- O backend roda como um serviço Railway e escuta a porta definida pela variável `PORT`.
- Configure `DATABASE_URL` nas variáveis do serviço Railway com a connection string PostgreSQL do Supabase. Codifique em URL caracteres especiais da senha. A conexão existente usa SSL.
- Para desenvolver localmente, mantenha a URL em `api/.env`; esse arquivo é ignorado pelo Git. Use `api/.env.example` como referência e nunca coloque credenciais reais em arquivos versionados.
- Aplique no Supabase as migrações necessárias do projeto, incluindo `api/src/database/migrations/20261028_rotas_risco.sql`, antes de usar as rotas correspondentes.
- Gere um domínio público para o serviço backend na Railway. Configure esse domínio em `API_PUBLIC_URL` nas variáveis Railway e em `EXPO_PUBLIC_API_URL` no ambiente de build do app mobile. O app precisa ser compilado novamente após mudar essa variável.
- `zona-vermelha.railway.internal` é somente para comunicação entre serviços no mesmo projeto/ambiente Railway. Use `http://zona-vermelha.railway.internal:$PORT` a partir de outro serviço Railway; navegadores e celulares fora da Railway não conseguem acessar esse endereço.
- Configure também `JWT_SECRET`, `RESEND_API_KEY`, `EMAIL_FROM`, `OSRM_BASE_URL` e `ROUTE_ADMIN_TOKEN` nas variáveis Railway, conforme o uso do backend.

## Rodar o app

```powershell
cd mobile
npm install
npm run web
```

Configure `EXPO_PUBLIC_API_URL` para a URL que o app deve acessar. Para acessar um backend local no Android Emulator, use `http://10.0.2.2:3000`; em produção, use o domínio público Railway.


## Planejamento de rotas com risco
O backend existente foi estendido sem substituir os endpoints de autenticação, zonas, comentários e busca. Leia `api/docs/ROTAS_E_RISCOS.md` e `api/docs/FONTES_OFICIAIS.md`.

1. Faça backup do banco.
2. Aplique `api/src/database/migrations/20261028_rotas_risco.sql` no mesmo PostgreSQL/PostGIS.
3. Configure `OSRM_BASE_URL` e `ROUTE_ADMIN_TOKEN` no ambiente do backend.
4. Instale/build/deploy o backend atualizado.
5. Teste `POST /rotas/calcular` localmente antes de publicar.
6. Atualize o app móvel para apontar para a URL do backend que recebeu o deploy.

A integração automática da Defesa Civil não está ativa: as fontes e autorizações precisam ser confirmadas primeiro. O OSRM público e os pesos de risco são somente para protótipo.
