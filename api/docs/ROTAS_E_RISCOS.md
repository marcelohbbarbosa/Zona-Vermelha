# Planejamento de rotas e riscos — Zona Vermelha

## O que foi integrado
- `POST /rotas/calcular`: recebe origem/destino, solicita até 3 rotas ao OSRM, cruza cada geometria com os riscos ativos e retorna a recomendação.
- `POST /rotas/:id/recalcular`: recalcula com os mesmos pontos usando os riscos atuais.
- `POST /relatos-risco`: registra relato pendente.
- `PATCH /admin/relatos-risco/:id`: moderação inicial por token administrativo.
- A tela `mobile/src/screens/routes.tsx` passa a chamar a API do Zona Vermelha e desenhar a rota recomendada no mapa.

## Migração
Aplicar `src/database/migrations/20261028_rotas_risco.sql` no banco usado pelo backend. Antes, faça backup. A migração pressupõe PostGIS já instalado, pois o sistema atual já usa funções geográficas.

## Variáveis
Adicionar ao ambiente do backend:
- `OSRM_BASE_URL=https://router.project-osrm.org` (apenas desenvolvimento)
- `ROUTE_ADMIN_TOKEN=<segredo-forte>`

Nunca colocar `ROUTE_ADMIN_TOKEN` no app móvel, Git ou repositório público.

## Teste rápido
```powershell
$body = @{
  origin = @{ latitude = -23.9608; longitude = -46.3336 }
  destination = @{ latitude = -23.9900; longitude = -46.2560 }
  alternatives = 3
} | ConvertTo-Json -Depth 5

Invoke-RestMethod -Method Post -Uri "http://localhost:3000/rotas/calcular" -ContentType "application/json" -Body $body
```

Enviar relato:
```powershell
$report = @{
  category = "alagamento"
  description = "Relato fictício para testar o fluxo de moderação."
  latitude = -23.9608
  longitude = -46.3336
  occurredAt = (Get-Date).ToUniversalTime().ToString("o")
} | ConvertTo-Json

Invoke-RestMethod -Method Post -Uri "http://localhost:3000/relatos-risco" -ContentType "application/json" -Body $report
```

Moderação:
```powershell
$headers = @{ "x-admin-token" = "O_MESMO_SEGREDO_CONFIGURADO_NO_BACKEND" }
$body = @{ status = "approved"; moderatorId = "moderador-teste"; note = "Aprovado para teste" } | ConvertTo-Json
Invoke-RestMethod -Method Patch -Uri "http://localhost:3000/admin/relatos-risco/ID" -Headers $headers -ContentType "application/json" -Body $body
```

## Limitações importantes
- O motor OSRM público é para experimentação, não para produção; ele pode retornar menos alternativas do que o pedido.
- OSRM no starter calcula rotas de carro. Não oferece ainda perfis pedonal/ciclável.
- A ponderação de risco, buffer de 100 m e expiração de 6 horas são parâmetros provisórios de protótipo. Não são critérios oficiais nem devem ser apresentados como garantia de segurança.
- A rota é avaliada somente contra os riscos existentes no banco. A integração automática com Defesa Civil ainda não foi implementada.
- A tabela `route_hazards` já prevê registros oficiais, mas requer adaptador específico para cada fonte confirmada.
- Os comentários atuais são textos livres e não devem ser interpretados automaticamente como perigos. O usuário precisa enviar um relato estruturado e um moderador precisa aprová-lo.
- A moderação por token é provisória. Antes de produção, integrar ao sistema de usuários e permissões, adicionar rate limiting, auditoria completa e proteção anti-spam.
