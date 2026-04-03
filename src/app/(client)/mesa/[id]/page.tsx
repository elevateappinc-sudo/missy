"use client";

import { useState, useEffect, use } from "react";
import { Bot, Mic, Send, ShoppingBag, Plus, Minus, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface MenuCategory {
  name: string;
  items: { id: string; name: string; price: number; description: string | null }[];
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

function formatPrice(price: number) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(price);
}

export default function MesaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: tableId } = use(params);
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [restaurantName, setRestaurantName] = useState("");
  const [tableName, setTableName] = useState("");
  const [avatarName, setAvatarName] = useState("Missy");
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [view, setView] = useState<"chat" | "menu" | "cart">("chat");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeCategory, setActiveCategory] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  // Load table, restaurant, menu, avatar
  useEffect(() => {
    async function load() {
      // Get table -> restaurant
      const { data: table } = await supabase
        .from("tables")
        .select("id, name, restaurant_id, restaurants(name, primary_color)")
        .eq("id", tableId)
        .single();

      if (!table) return;

      const rid = table.restaurant_id;
      setRestaurantId(rid);
      setTableName(table.name);
      setRestaurantName((table as any).restaurants?.name ?? "Restaurante");

      // Update table status
      await supabase.from("tables").update({ status: "occupied" }).eq("id", tableId);

      // Get menu
      const { data: cats } = await supabase
        .from("menu_categories")
        .select("name, menu_items(id, name, description, price, is_available)")
        .eq("restaurant_id", rid)
        .eq("is_active", true)
        .order("sort_order");

      const menuCats: MenuCategory[] = (cats ?? []).map((c: any) => ({
        name: c.name,
        items: (c.menu_items ?? [])
          .filter((i: any) => i.is_available)
          .map((i: any) => ({ id: i.id, name: i.name, price: Number(i.price), description: i.description })),
      }));
      setCategories(menuCats);
      if (menuCats.length > 0) setActiveCategory(menuCats[0].name);

      // Get avatar config
      const { data: avatar } = await supabase
        .from("avatar_configs")
        .select("name, greeting_message")
        .eq("restaurant_id", rid)
        .single();

      const name = avatar?.name ?? "Missy";
      setAvatarName(name);
      setMessages([
        {
          role: "assistant",
          content: avatar?.greeting_message ?? `¡Hola! Soy ${name}, tu mesero virtual. ¿En qué te puedo ayudar hoy?`,
        },
      ]);

      setLoading(false);
    }
    load();
  }, [tableId, supabase]);

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  function addToCart(item: { id: string; name: string; price: number }) {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) return prev.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i));
      return [...prev, { ...item, quantity: 1 }];
    });
  }

  function removeFromCart(id: string) {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === id);
      if (existing && existing.quantity > 1) return prev.map((i) => (i.id === id ? { ...i, quantity: i.quantity - 1 } : i));
      return prev.filter((i) => i.id !== id);
    });
  }

  async function sendMessage() {
    if (!message.trim() || chatLoading || !restaurantId) return;
    const userMsg: Message = { role: "user", content: message };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setMessage("");
    setChatLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
          restaurantId,
        }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.message }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Lo siento, hubo un error. ¿Puedes intentar de nuevo?" }]);
    } finally {
      setChatLoading(false);
    }
  }

  async function confirmOrder() {
    if (!restaurantId || cart.length === 0) return;

    // Create order
    const { data: order } = await supabase
      .from("orders")
      .insert({
        restaurant_id: restaurantId,
        table_id: tableId,
        status: "pending",
        total: cartTotal,
      })
      .select("id")
      .single();

    if (!order) return;

    // Create order items
    await supabase.from("order_items").insert(
      cart.map((item) => ({
        order_id: order.id,
        menu_item_id: item.id,
        quantity: item.quantity,
        unit_price: item.price,
      }))
    );

    // Update table status
    await supabase.from("tables").update({ status: "ordering" }).eq("id", tableId);

    setMessages((prev) => [
      ...prev,
      { role: "user", content: `Pedido confirmado: ${cart.map((i) => `${i.name} x${i.quantity}`).join(", ")}` },
      { role: "assistant", content: `¡Perfecto! Tu pedido por ${formatPrice(cartTotal)} ha sido enviado a cocina. Te avisaré cuando esté listo.` },
    ]);
    setCart([]);
    setView("chat");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-bg-dark">
        <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-bg-dark text-white max-w-md mx-auto relative">
      {/* Header */}
      <header className="flex items-center justify-between px-5 py-4 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <Bot className="w-6 h-6 text-primary" />
          <div>
            <p className="text-[14px] font-semibold">{restaurantName}</p>
            <p className="text-[11px] text-white/35">{tableName}</p>
          </div>
        </div>
        {cartCount > 0 && (
          <button
            onClick={() => setView(view === "cart" ? "chat" : "cart")}
            className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/15 text-primary text-[12px] font-semibold"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            {formatPrice(cartTotal)}
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">
              {cartCount}
            </span>
          </button>
        )}
      </header>

      {/* Navigation tabs */}
      <div className="flex border-b border-white/5">
        {(["chat", "menu", "cart"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setView(tab)}
            className={`flex-1 py-3 text-[13px] font-medium transition-colors ${
              view === tab ? "text-primary border-b-2 border-primary" : "text-white/35 hover:text-white/60"
            }`}
          >
            {tab === "chat" ? avatarName : tab === "menu" ? "Menú" : `Pedido (${cartCount})`}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {view === "chat" && (
          <div className="p-5 space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] px-4 py-3 rounded-[16px] text-[14px] leading-relaxed ${
                    msg.role === "user"
                      ? "bg-primary text-white rounded-br-[4px]"
                      : "bg-white/[0.06] text-white/80 rounded-bl-[4px]"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex justify-start">
                <div className="px-4 py-3 rounded-[16px] rounded-bl-[4px] bg-white/[0.06]">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-white/30 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 rounded-full bg-white/30 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 rounded-full bg-white/30 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {view === "menu" && (
          <div>
            <div className="flex gap-2 px-5 py-4 overflow-x-auto">
              {categories.map((cat) => (
                <button
                  key={cat.name}
                  onClick={() => setActiveCategory(cat.name)}
                  className={`px-3.5 py-1.5 rounded-full text-[12px] font-medium whitespace-nowrap transition-all ${
                    activeCategory === cat.name
                      ? "bg-primary text-white"
                      : "bg-white/[0.06] text-white/40 hover:text-white/60"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            <div className="px-5 pb-5 space-y-3">
              {categories.length === 0 ? (
                <div className="text-center py-16 text-white/30 text-[14px]">
                  Este restaurante aún no tiene menú configurado
                </div>
              ) : (
                categories
                  .find((c) => c.name === activeCategory)
                  ?.items.map((item) => {
                    const inCart = cart.find((c) => c.id === item.id);
                    return (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-4 rounded-[12px] bg-white/[0.04] border border-white/[0.06]"
                      >
                        <div className="flex-1 mr-4">
                          <p className="text-[14px] font-medium text-white/90">{item.name}</p>
                          <p className="text-[12px] text-white/30 mt-0.5">{item.description}</p>
                          <p className="text-[14px] font-semibold text-primary mt-1.5">{formatPrice(item.price)}</p>
                        </div>
                        {inCart ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => removeFromCart(item.id)}
                              className="w-7 h-7 rounded-full bg-white/[0.08] flex items-center justify-center text-white/60 hover:bg-white/[0.15]"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="text-[14px] font-semibold w-5 text-center">{inCart.quantity}</span>
                            <button
                              onClick={() => addToCart(item)}
                              className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-white hover:bg-primary-dark"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => addToCart(item)}
                            className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center text-primary hover:bg-primary/25 transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    );
                  })
              )}
            </div>
          </div>
        )}

        {view === "cart" && (
          <div className="p-5">
            {cart.length === 0 ? (
              <div className="text-center py-16">
                <ShoppingBag className="w-12 h-12 text-white/15 mx-auto mb-4" />
                <p className="text-white/30 text-[14px]">Tu pedido está vacío</p>
                <button onClick={() => setView("menu")} className="mt-4 text-primary text-[14px] font-medium hover:text-primary-light">
                  Ver menú
                </button>
              </div>
            ) : (
              <>
                <div className="space-y-3 mb-6">
                  {cart.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-4 rounded-[12px] bg-white/[0.04] border border-white/[0.06]">
                      <div>
                        <p className="text-[14px] font-medium text-white/90">{item.name}</p>
                        <p className="text-[13px] text-primary mt-0.5">{formatPrice(item.price)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => removeFromCart(item.id)} className="w-7 h-7 rounded-full bg-white/[0.08] flex items-center justify-center text-white/60 hover:bg-white/[0.15]">
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-[14px] font-semibold w-5 text-center">{item.quantity}</span>
                        <button onClick={() => addToCart(item)} className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-white hover:bg-primary-dark">
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-white/[0.06] pt-4 space-y-2">
                  <div className="flex justify-between text-[14px]">
                    <span className="text-white/40">Subtotal</span>
                    <span className="text-white/80">{formatPrice(cartTotal)}</span>
                  </div>
                  <div className="flex justify-between text-[16px] font-semibold">
                    <span className="text-white">Total</span>
                    <span className="text-primary">{formatPrice(cartTotal)}</span>
                  </div>
                </div>

                <button
                  onClick={confirmOrder}
                  className="w-full mt-6 bg-primary text-white py-3.5 rounded-full text-[14px] font-semibold hover:bg-primary-dark transition-all duration-300 hover:shadow-[0_4px_20px_rgba(168,85,247,0.3)]"
                >
                  Confirmar pedido
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Chat input */}
      {view === "chat" && (
        <div className="p-4 border-t border-white/5">
          <div className="flex items-center gap-2">
            <button className="w-10 h-10 rounded-full bg-white/[0.06] flex items-center justify-center text-white/40 hover:text-white/70 hover:bg-white/[0.1] transition-colors">
              <Mic className="w-5 h-5" />
            </button>
            <div className="flex-1">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Escribe tu pedido..."
                className="w-full px-4 py-2.5 rounded-full bg-white/[0.06] border border-white/[0.06] text-[14px] text-white placeholder:text-white/25 focus:outline-none focus:border-primary/30"
              />
            </div>
            <button
              onClick={sendMessage}
              disabled={chatLoading}
              className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white hover:bg-primary-dark transition-colors disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
