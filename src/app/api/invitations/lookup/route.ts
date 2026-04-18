import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Returns a safe, minimal view of an invitation for the accept page.
 * Uses the admin client so we can keep RLS locked down on the invitations table.
 */
export async function POST(request: Request) {
  const { token } = await request.json();

  if (!token || typeof token !== "string") {
    return NextResponse.json({ error: "Token requerido" }, { status: 400 });
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Servicio de invitaciones no configurado" },
      { status: 500 }
    );
  }

  const { data, error } = await admin
    .from("invitations")
    .select("id, email, name, permissions, expires_at, used_at, restaurant_id, restaurants(name)")
    .eq("token", token)
    .maybeSingle();

  if (error) {
    console.error("Invitation lookup error:", error);
    return NextResponse.json({ error: "No se pudo buscar la invitación" }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Invitación no encontrada" }, { status: 404 });
  }

  return NextResponse.json({
    id: data.id,
    email: data.email,
    name: data.name,
    permissions: data.permissions ?? {},
    expired: new Date(data.expires_at) < new Date(),
    used: !!data.used_at,
    restaurant_name: (data as any).restaurants?.name ?? "Restaurante",
  });
}
