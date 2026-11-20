import nodemailer from "nodemailer";

const RESEND_API_URL = "https://api.resend.com/emails";

export async function enviarEmail(destinatario: string, assunto: string, html: string) {
  const gmailUser = process.env.GMAIL_USER;
  const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;

  if (gmailUser || gmailAppPassword) {
    if (!gmailUser || !gmailAppPassword) {
      throw new Error("Configure GMAIL_USER e GMAIL_APP_PASSWORD para habilitar o envio pelo Gmail.");
    }

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: { user: gmailUser, pass: gmailAppPassword },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_FROM || `Zona Vermelha <${gmailUser}>`,
      to: destinatario,
      subject: assunto,
      html,
    });
    return;
  }

  const apiKey = process.env.RESEND_API_KEY;
  const remetente = process.env.EMAIL_FROM;

  if (!apiKey || !remetente) {
    throw new Error("Configure RESEND_API_KEY e EMAIL_FROM para habilitar o envio de e-mails.");
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
