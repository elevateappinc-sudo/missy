import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const { token } = await request.json();
  if (!token || typeof token !== "string") {
    return NextResponse.json({ error: "Token requerido" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Debes iniciar sesión primero" }, { status: 401 });
  }

  const { data: invitation } = await supabase
    .from("invitations")
    .select("*")
    .eq("token", token)
    .maybeSingle();

  if (!invitation) {
    return NextResponse.json({ error: "Invitación no encontrada" }, { status: 404 });
  }

  if (invitation.used_at) {
    return NextResponse.json({ error: "Esta invitación ya fue utilizada" }, { status: 410 });
  }

  if (new Date(invitation.expires_at) < new Date()) {
    return NextResponse.json({ error: "Esta invitación expiró" }, { status: 410 });
  }

  const userEmail = user.email?.toLowerCase();
  if (!userEmail || userEmail !== invitation.email.toLowerCase()) {
    return NextResponse.json(
      {
        error: `Esta invitación fue enviada a ${invitation.email}. Inicia sesión con esa cuenta para aceptarla.`,
      },
      { status: 403 }
    );
  }

  // Create membership
  const { error: memberErr } = await supabase
    .from("restaurant_members")
    .insert({
      restaurant_id: invitation.restaurant_id,
      user_id: user.id,
      name: invitation.name ?? user.user_metadata?.full_name ?? null,
      email: invitation.email,
      role: "member",
      permissions: invitation.permissions,
    });

  if (memberErr && !memberErr.message.includes("duplicate key")) {
    console.error("Member insert error:", memberErr);
    return NextResponse.json({ error: "No se pudo vincular al restaurante" }, { status: 500 });
  }

  await supabase
    .from("invitations")
    .update({ used_at: new Date().toISOString() })
    .eq("id", invitation.id);

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("name")
    .eq("id", invitation.restaurant_id)
    .single();

  return NextResponse.json({
    ok: true,
    restaurant_name: restaurant?.name ?? "el restaurante",
  });
}
