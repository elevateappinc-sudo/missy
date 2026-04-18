/**
 * Email sending helper. Uses Resend's REST API when RESEND_API_KEY is set.
 * Falls back to a no-op that logs the message (useful for local dev).
 */

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail({ to, subject, html, text }: SendEmailOptions): Promise<{ ok: boolean; error?: string; delivered: boolean }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM ?? "Missy <onboarding@resend.dev>";

  if (!apiKey) {
    console.warn("[email] RESEND_API_KEY no configurado — no se envió el correo. Subject:", subject, "to:", to);
    return { ok: true, delivered: false };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to, subject, html, text: text ?? html.replace(/<[^>]+>/g, " ") }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error("[email] Resend error:", res.status, body);
      return { ok: false, error: body, delivered: false };
    }

    return { ok: true, delivered: true };
  } catch (err) {
    console.error("[email] Send failed:", err);
    return { ok: false, error: String(err), delivered: false };
  }
}

export function buildInvitationEmail({
  inviteeName,
  inviterName,
  restaurantName,
  acceptUrl,
}: {
  inviteeName: string | null;
  inviterName: string;
  restaurantName: string;
  acceptUrl: string;
}) {
  const greet = inviteeName ? `Hola ${inviteeName},` : "Hola,";
  return {
    subject: `Te invitaron a unirte a ${restaurantName} en Missy`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; padding: 32px; color: #1a1127;">
        <div style="margin-bottom: 32px;">
          <h1 style="font-size: 22px; font-weight: 600; margin: 0 0 8px 0;">🍽️ Missy</h1>
          <p style="color: #5c5470; margin: 0;">Tu mesero virtual</p>
        </div>
        <h2 style="font-size: 20px; font-weight: 500; margin: 0 0 16px 0;">${greet}</h2>
        <p style="font-size: 15px; line-height: 1.6; color: #1a1127;">
          <strong>${inviterName}</strong> te invitó a unirte a <strong>${restaurantName}</strong> en Missy.
        </p>
        <p style="font-size: 15px; line-height: 1.6; color: #1a1127;">
          Al aceptar la invitación podrás gestionar el restaurante con los permisos que te asignaron.
        </p>
        <div style="margin: 32px 0;">
          <a href="${acceptUrl}" style="display: inline-block; background: #a855f7; color: #ffffff; padding: 12px 28px; border-radius: 9999px; text-decoration: none; font-weight: 600; font-size: 14px;">
            Aceptar invitación
          </a>
        </div>
        <p style="font-size: 13px; color: #9a8fad; line-height: 1.6;">
          O copia este enlace en tu navegador:<br />
          <a href="${acceptUrl}" style="color: #a855f7; word-break: break-all;">${acceptUrl}</a>
        </p>
        <hr style="border: none; border-top: 1px solid #e8e0f0; margin: 32px 0;" />
        <p style="font-size: 12px; color: #9a8fad;">
          Este enlace expira en 7 días. Si no esperabas esta invitación, puedes ignorar este correo.
        </p>
      </div>
    `,
  };
}

export function buildPasswordResetEmail({
  userName,
  resetUrl,
}: {
  userName: string | null;
  resetUrl: string;
}) {
  const greet = userName ? `Hola ${userName},` : "Hola,";
  return {
    subject: "Restablece tu contraseña de Missy",
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; padding: 32px; color: #1a1127;">
        <h1 style="font-size: 22px; font-weight: 600; margin: 0 0 16px 0;">🍽️ Missy</h1>
        <h2 style="font-size: 20px; font-weight: 500; margin: 0 0 16px 0;">${greet}</h2>
        <p style="font-size: 15px; line-height: 1.6;">
          Recibimos una solicitud para restablecer tu contraseña.
        </p>
        <div style="margin: 32px 0;">
          <a href="${resetUrl}" style="display: inline-block; background: #a855f7; color: #ffffff; padding: 12px 28px; border-radius: 9999px; text-decoration: none; font-weight: 600; font-size: 14px;">
            Restablecer contraseña
          </a>
        </div>
        <p style="font-size: 13px; color: #9a8fad;">
          Si no solicitaste este cambio, ignora este correo.
        </p>
      </div>
    `,
  };
}
