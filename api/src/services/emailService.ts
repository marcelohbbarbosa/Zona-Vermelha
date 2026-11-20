const RESEND_API_URL = "https://api.resend.com/emails";
const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

export async function enviarEmail(destinatario: string, assunto: string, html: string) {
  const brevoApiKey = process.env.BREVO_API_KEY;
  const remetente = process.env.EMAIL_FROM;

  if (brevoApiKey) {
    if (!remetente) {
      throw new Error("Configure EMAIL_FROM com um remetente verificado no Brevo.");
    }

    const formatoNomeEmail = remetente.match(/^(.*)<([^>]+)>$/);
    const senderEmail = formatoNomeEmail ? formatoNomeEmail[2].trim() : remetente.trim();
    const senderName = formatoNomeEmail ? formatoNomeEmail[1].trim() : "Zona Vermelha";
    const resposta = await fetch(BREVO_API_URL, {
      method: "POST",
      headers: {
        "api-key": brevoApiKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        sender: { name: senderName || "Zona Vermelha", email: senderEmail },
        to: [{ email: destinatario }],
        subject: assunto,
        htmlContent: html,
      }),
    });

    if (!resposta.ok) {
      const detalhes = await resposta.text();
      console.error(`[Brevo] HTTP ${resposta.status}: ${detalhes.slice(0, 1000)}`);
      throw new Error(`Falha no serviço de e-mail Brevo (${resposta.status}).`);
    }
    return;
  }

  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey || !remetente) {
    throw new Error("Configure BREVO_API_KEY e EMAIL_FROM, ou RESEND_API_KEY e EMAIL_FROM, para habilitar o envio de e-mails.");
  }

  const resposta = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: remetente, to: [destinatario], subject: assunto, html }),
  });

  if (!resposta.ok) {
    throw new Error(`Falha no serviço de e-mail (${resposta.status}).`);
  }
}
