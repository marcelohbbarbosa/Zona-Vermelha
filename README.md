# Zona-Vermelha

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

## Rodar o app

```powershell
cd mobile
npm install
npm run web
```

No Android Emulator, o app usa `http://10.0.2.2:3000` para acessar o backend.
