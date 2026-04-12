import Groq from "groq-sdk";
import { createClient } from "@/lib/supabase/server";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(request: Request) {
  const { messages, restaurantId } = await request.json();

  const supabase = await createClient();

  // Fetch restaurant, menu, and avatar config
  const [{ data: restaurant }, { data: categories }, { data: avatar }] = await Promise.all([
    supabase.from("restaurants").select("name, description").eq("id", restaurantId).single(),
    supabase
      .from("menu_categories")
      .select("name, menu_items(name, description, price, is_available)")
      .eq("restaurant_id", restaurantId)
      .eq("is_active", true)
      .order("sort_order"),
    supabase.from("avatar_configs").select("name, personality, greeting_message").eq("restaurant_id", restaurantId).single(),
  ]);

  // Build menu text
  const menuText = (categories ?? [])
    .map((cat: any) => {
      const items = (cat.menu_items ?? [])
        .filter((i: any) => i.is_available)
        .map((i: any) => `  - ${i.name}: $${i.price} — ${i.description || ""}`)
        .join("\n");
      return `${cat.name}:\n${items}`;
    })
    .join("\n\n");

  const personalityMap: Record<string, string> = {
    formal: "Sé profesional, cortés y usa un tono formal.",
    friendly: "Sé cálido, amigable y cercano como un amigo.",
    funny: "Sé divertido, usa humor y haz que la experiencia sea entretenida.",
    sophisticated: "Sé elegante, refinado y usa un vocabulario sofisticado.",
  };

  const systemPrompt = `Eres ${avatar?.name ?? "Missy"}, el mesero virtual de "${restaurant?.name ?? "nuestro restaurante"}".
${restaurant?.description ? `Descripción: ${restaurant.description}` : ""}

${personalityMap[avatar?.personality ?? "friendly"]}

Tu menú disponible:
${menuText}

Instrucciones:
- Responde siempre en español
- Ayuda a los clientes a elegir platos, recomienda combinaciones
- Responde preguntas sobre ingredientes, precios, y preparación
- Sé conciso (máximo 2-3 oraciones por respuesta)
- Si preguntan algo fuera del menú/restaurante, redirige amablemente
- Los precios están en pesos colombianos (COP)
- Usa el formato $XX.XXX para precios
- NUNCA digas que vas a asignar una mesa, el cliente ya está sentado en su mesa
- NUNCA pidas al cliente que espere por una mesa o que le asignarás una
- El cliente ya escaneó un QR en su mesa, así que ya está ubicado`;

  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    max_tokens: 300,
    messages: [
      { role: "system", content: systemPrompt },
      ...messages.map((m: any) => ({ role: m.role, content: m.content })),
    ],
  });

  const text = response.choices[0]?.message?.content ?? "";

  return Response.json({ message: text });
}
