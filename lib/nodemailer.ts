import nodemailer from "nodemailer";

const smtpConfig = {
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
};

const transporter = nodemailer.createTransport(smtpConfig);

export async function sendVerificationEmail(email: string, token: string) {
  const verificationUrl = `${process.env.NEXTAUTH_URL}/api/auth/verify-email?token=${token}`;

  const info = await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: email,
    subject: "Verifique seu e-mail - LLM Sandbox",
    html: `
      <h1>Verifique seu endereço de e-mail</h1>
      <p>Obrigado por se registrar. Por favor, clique no link abaixo para verificar seu e-mail:</p>
      <a href="${verificationUrl}" target="_blank">Verificar E-mail</a>
      <p>Se você não se registrou, por favor ignore este e-mail.</p>
    `,
  });

  console.log("E-mail de verificação enviado! URL de preview: %s", nodemailer.getTestMessageUrl(info));
}