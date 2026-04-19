import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function DebugSessionPage() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  const sections: Array<{ title: string; value: unknown }> = [];

  sections.push({
    title: "auth.getUser() result",
    value: {
      user: user
        ? { id: user.id, email: user.email, app_metadata: user.app_metadata }
        : null,
      error: userErr?.message ?? null,
    },
  });

  if (user) {
    // User-scoped query — RLS applies exactly like from the browser
    const { data: ownedRls, error: ownedRlsErr } = await supabase
      .from("restaurants")
      .select("id, name, email, owner_id, is_active")
      .eq("owner_id", user.id);

    sections.push({
      title: `Supabase (RLS) — restaurants WHERE owner_id = '${user.id}'`,
      value: {
        rows: ownedRls ?? [],
        error: ownedRlsErr?.message ?? null,
        count: ownedRls?.length ?? 0,
      },
    });

    const { data: allOwnedRls, error: allRlsErr } = await supabase
      .from("restaurants")
      .select("id, name, email, owner_id, is_active");
    sections.push({
      title: "Supabase (RLS) — all restaurants visible to this user",
      value: {
        rows: allOwnedRls ?? [],
        error: allRlsErr?.message ?? null,
        count: allOwnedRls?.length ?? 0,
      },
    });

    const { data: membership, error: memErr } = await supabase
      .from("restaurant_members")
      .select("restaurant_id, role, email")
      .eq("user_id", user.id);
    sections.push({
      title: "Supabase (RLS) — restaurant_members for this user",
      value: {
        rows: membership ?? [],
        error: memErr?.message ?? null,
        count: membership?.length ?? 0,
      },
    });

    // Admin-scoped (bypasses RLS) — ground truth from DB
    try {
      const admin = createAdminClient();
      const { data: adminOwned } = await admin
        .from("restaurants")
        .select("id, name, email, owner_id, is_active")
        .eq("owner_id", user.id);
      const { data: adminByEmail } = await admin
        .from("restaurants")
        .select("id, name, email, owner_id, is_active")
        .eq("email", user.email ?? "");
      sections.push({
        title: "Admin (bypass RLS) — restaurants with this user_id as owner",
        value: adminOwned ?? [],
      });
      sections.push({
        title: "Admin (bypass RLS) — restaurants with email matching",
        value: adminByEmail ?? [],
      });
    } catch (e) {
      sections.push({
        title: "Admin client",
        value: {
          error: e instanceof Error ? e.message : String(e),
          note: "SUPABASE_SERVICE_ROLE_KEY probably not set",
        },
      });
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6 font-mono text-sm">
      <h1 className="text-xl font-semibold mb-4">Session debug</h1>
      <p className="text-slate-500 mb-6">
        Server-side view of the current session. Visit this page logged-in
        with the account you want to inspect.
      </p>
      <div className="space-y-4">
        {sections.map((s, i) => (
          <section
            key={i}
            className="bg-white rounded-lg border border-slate-200 p-4"
          >
            <h2 className="text-sm font-semibold text-slate-700 mb-2">
              {s.title}
            </h2>
            <pre className="text-[12px] text-slate-800 whitespace-pre-wrap break-all">
              {JSON.stringify(s.value, null, 2)}
            </pre>
          </section>
        ))}
      </div>
    </main>
  );
}
