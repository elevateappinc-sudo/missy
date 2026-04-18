import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendEmail, buildInvitationEmail } from "@/lib/email";
import type { MemberPermissions } from "@/types";

export async function POST(request: Request) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const body = await request.json();
  const { name, email, permissions } = body as {
    name?: string;
    email?: string;
    permissions?: Partial<MemberPermissions>;
  };

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Correo inválido" }, { status: 400 });
  }

  const normalizedEmail = email.trim().toLowerCase();

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("id, name")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!restaurant) {
    return NextResponse.json(
      { error: "Solo el dueño del restaurante puede enviar invitaciones" },
      { status: 403 }
    );
  }

  // Avoid inviting an existing member
  const { data: existingMember } = await supabase
    .from("restaurant_members")
    .select("id")
    .eq("restaurant_id", restaurant.id)
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (existingMember) {
    return NextResponse.json(
      { error: "Este correo ya es miembro del restaurante" },
      { status: 409 }
    );
  }

  const finalPerms: MemberPermissions = {
    menu: permissions?.menu ?? true,
    tables: permissions?.tables ?? true,
    orders: permissions?.orders ?? true,
    qr: permissions?.qr ?? true,
    settings: permissions?.settings ?? false,
  };

  const token = `${crypto.randomUUID()}${crypto.randomUUID().replace(/-/g, "")}`.slice(0, 40);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: invitation, error: insertErr } = await supabase
    .from("invitations")
    .insert({
      token,
      restaurant_id: restaurant.id,
      email: normalizedEmail,
      name: name ?? null,
      permissions: finalPerms,
      invited_by: user.id,
      expires_at: expiresAt,
    })
    .select("id, token")
    .single();

  if (insertErr || !invitation) {
    console.error("Invitation insert error:", insertErr);
    return NextResponse.json({ error: "No se pudo crear la invitación" }, { status: 500 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin;
  const acceptUrl = `${appUrl}/auth/invite/${invitation.token}`;

  const inviterName =
    user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "Un compañero";

  const emailContent = buildInvitationEmail({
    inviteeName: name ?? null,
    inviterName,
    restaurantName: restaurant.name,
    acceptUrl,
  });

  const result = await sendEmail({
    to: normalizedEmail,
    subject: emailContent.subject,
    html: emailContent.html,
  });

  return NextResponse.json({
    ok: true,
    invitation_id: invitation.id,
    accept_url: acceptUrl,
    email_delivered: result.delivered,
    email_error: result.error ?? null,
  });
}
