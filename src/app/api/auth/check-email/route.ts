import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const { email } = await request.json();

  if (!email || typeof email !== "string") {
    return NextResponse.json({ exists: false }, { status: 400 });
  }

  const normalized = email.trim().toLowerCase();
  const supabase = await createClient();

  // Check by restaurant owner email (since that's how registration creates the record)
  const { data: byRestaurant } = await supabase
    .from("restaurants")
    .select("id")
    .eq("email", normalized)
    .limit(1)
    .maybeSingle();

  if (byRestaurant) {
    return NextResponse.json({ exists: true });
  }

  // Also check by member email
  const { data: byMember } = await supabase
    .from("restaurant_members")
    .select("id")
    .eq("email", normalized)
    .limit(1)
    .maybeSingle();

  return NextResponse.json({ exists: !!byMember });
}
