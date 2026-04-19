import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = searchParams.get("next") ?? "/dashboard";

  const supabase = await createClient();

  // Handle both PKCE (code) and OTP / recovery (token_hash + type) flows.
  let exchangeError: Error | null = null;
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    exchangeError = error;
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as EmailOtpType,
    });
    exchangeError = error;
  } else {
    return NextResponse.redirect(`${origin}/auth/login?error=auth`);
  }

  if (exchangeError) {
    console.error("[auth/callback] exchange error:", exchangeError.message);
    return NextResponse.redirect(`${origin}/auth/login?error=auth`);
  }

  // Bootstrap a restaurant for OAuth / invite flows that don't pass through signup.
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data: existing } = await supabase
      .from("restaurants")
      .select("id")
      .eq("owner_id", user.id)
      .single();

    if (!existing) {
      const name = user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "Mi Restaurante";
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      await supabase.from("restaurants").insert({
        name: `Restaurante de ${name}`,
        slug: `${slug}-${user.id.slice(0, 6)}`,
        email: user.email ?? "",
        owner_id: user.id,
      });
    }
  }

  return NextResponse.redirect(`${origin}${next}`);
}
