# Fontes oficiais a investigar antes de ligar ingestão automática

A presença de uma página pública não significa que exista API autorizada, dados georreferenciados ou permissão para redistribuir os dados. Cada conector exige validação documental e técnica.

- Defesa Civil do Estado de São Paulo: https://www.defesacivil.sp.gov.br/
  Confirmar canal de alertas/ocorrências, feed ou API, geometrias, autenticação, periodicidade, validade, licença e contato técnico.
- CEMADEN — Plataforma de Entrega de Dados: https://sws.cemaden.gov.br/PED/api/ui/
  Investigar disponibilidade de dados de estações e precipitação na Baixada Santista. Chuva medida não equivale a confirmação de rua alagada nem de via interditada.
- Defesa Civil Alerta / Anatel: https://www.gov.br/anatel/pt-br/dados/utilidade-publica/alertas-de-desastres/defesa-civil-alerta
  Confirmar se há interface de dados apropriada para uso automatizado e quais campos geográficos são disponibilizados.
- IBGE — Malhas territoriais: https://www.ibge.gov.br/geociencias/organizacao-do-territorio/malhas-territoriais/15774-malhas.html
  Usar códigos oficiais e limites municipais ao definir a cobertura.
- Prefeituras e órgãos locais: Santos, São Vicente, Guarujá, Praia Grande, Cubatão, Bertioga, Mongaguá, Itanhaém e Peruíbe. Investigar publicações sobre alagamentos, interdições, quedas de árvores e ocorrências.

Antes de implementação, registrar por fonte: endpoint documentado, autorização, licença/termos, autenticação, formato, frequência, limites, cobertura, significado de severidade, campo de validade, ID estável, política de expiração e responsável pelo suporte.

Não inferir `is_blocking=true` de um alerta meteorológico genérico. Bloqueio viário exige evidência específica e atualizada.
