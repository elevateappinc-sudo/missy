"use client";

import { useState, useEffect, useRef, use, useCallback } from "react";
import {
  Mic, Send, ShoppingBag, Plus, Minus, UtensilsCrossed,
  MessageSquare, Sparkles, ChevronDown, ChevronUp, MoreHorizontal, Star,
  Salad, ClipboardList, Check, Clock,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface MenuCategory {
  name: string;
  items: { id: string; name: string; price: number; description: string | null; image_url: string | null }[];
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface SessionOrder {
  id: string;
  status: string;
  total: number;
  created_at: string;
  items: { name: string; quantity: number; unit_price: number }[];
}

function formatPrice(price: number) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(price);
}

const avatarStyles: Record<string, { emoji: string; bg: string; glow: string }> = {
  robot: { emoji: "🤖", bg: "from-violet-500/30 to-purple-600/30", glow: "shadow-[0_0_80px_rgba(139,92,246,0.3)]" },
  human: { emoji: "👨‍🍳", bg: "from-amber-500/30 to-orange-600/30", glow: "shadow-[0_0_80px_rgba(245,158,11,0.3)]" },
  mascot: { emoji: "🐾", bg: "from-emerald-500/30 to-green-600/30", glow: "shadow-[0_0_80px_rgba(16,185,129,0.3)]" },
  custom: { emoji: "✨", bg: "from-pink-500/30 to-rose-600/30", glow: "shadow-[0_0_80px_rgba(244,114,182,0.3)]" },
};

const statusLabels: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  pending: { label: "Pendiente", color: "text-yellow-400 bg-yellow-400/10", icon: Clock },
  confirmed: { label: "Confirmado", color: "text-blue-400 bg-blue-400/10", icon: Check },
  preparing: { label: "Preparando", color: "text-purple-400 bg-purple-400/10", icon: UtensilsCrossed },
  ready: { label: "Listo", color: "text-green-400 bg-green-400/10", icon: Check },
  delivered: { label: "Entregado", color: "text-white/40 bg-white/5", icon: Check },
};

export default function MesaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: tableId } = use(params);
  const supabase = createClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(true);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [restaurantName, setRestaurantName] = useState("");
  const [tableName, setTableName] = useState("");
  const [avatarName, setAvatarName] = useState("Missy");
  const [avatarStyle, setAvatarStyle] = useState("robot");
  const [avatarGreeting, setAvatarGreeting] = useState("");
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [view, setView] = useState<"avatar" | "chat" | "menu" | "orders">("avatar");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeCategory, setActiveCategory] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [avatarSpeaking, setAvatarSpeaking] = useState(false);
  const [avatarBubble, setAvatarBubble] = useState("");
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [sessionOrders, setSessionOrders] = useState<SessionOrder[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Load everything
  useEffect(() => {
    async function load() {
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

      await supabase.from("tables").update({ status: "occupied" }).eq("id", tableId);

      // Create a client session
      const { data: session } = await supabase
        .from("client_sessions")
        .insert({ restaurant_id: rid, table_id: tableId })
        .select("id")
        .single();
      if (session) setSessionId(session.id);

      const { data: cats } = await supabase
        .from("menu_categories")
        .select("name, menu_items(id, name, description, price, image_url, is_available)")
        .eq("restaurant_id", rid)
        .eq("is_active", true)
        .order("sort_order");

      const menuCats: MenuCategory[] = (cats ?? []).map((c: any) => ({
        name: c.name,
        items: (c.menu_items ?? [])
          .filter((i: any) => i.is_available)
          .map((i: any) => ({ id: i.id, name: i.name, price: Number(i.price), description: i.description, image_url: i.image_url })),
      }));
      setCategories(menuCats);
      if (menuCats.length > 0) setActiveCategory(menuCats[0].name);

      const { data: avatar } = await supabase
        .from("avatar_configs")
        .select("name, style, greeting_message, personality")
        .eq("restaurant_id", rid)
        .single();

      const name = avatar?.name ?? "Missy";
      const greeting = avatar?.greeting_message ?? `¡Hola! Soy ${name}, tu mesero virtual. ¿En qué te puedo ayudar hoy?`;
      setAvatarName(name);
      setAvatarStyle(avatar?.style ?? "robot");
      setAvatarGreeting(greeting);
      setMessages([{ role: "assistant", content: greeting }]);

      setAvatarBubble(greeting);
      setAvatarSpeaking(true);
      setTimeout(() => setAvatarSpeaking(false), 3000);

      setLoading(false);
    }
    load();
  }, [tableId, supabase]);

  // Load session orders
  const loadSessionOrders = useCallback(async () => {
    if (!restaurantId) return;
    const { data: orders } = await supabase
      .from("orders")
      .select("id, status, total, created_at, order_items(quantity, unit_price, menu_items(name))")
      .eq("table_id", tableId)
      .order("created_at", { ascending: false });

    if (orders) {
      setSessionOrders(
        orders.map((o: any) => ({
          id: o.id,
          status: o.status,
          total: Number(o.total),
          created_at: o.created_at,
          items: (o.order_items ?? []).map((oi: any) => ({
            name: oi.menu_items?.name ?? "Item",
            quantity: oi.quantity,
            unit_price: Number(oi.unit_price),
          })),
        }))
      );
    }
  }, [restaurantId, tableId, supabase]);

  useEffect(() => {
    if (view === "orders") loadSessionOrders();
  }, [view, loadSessionOrders]);

  // Realtime for orders
  useEffect(() => {
    if (!restaurantId) return;
    const channel = supabase
      .channel("client-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders", filter: `table_id=eq.${tableId}` }, () => {
        loadSessionOrders();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [restaurantId, tableId, supabase, loadSessionOrders]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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

  async function askAvatar(text: string) {
    if (!restaurantId) return;
    const userMsg: Message = { role: "user", content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setMessage("");
    setChatLoading(true);
    setAvatarSpeaking(true);
    setAvatarBubble("...");
    setShowQuickActions(false);

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
      const response = data.message;
      setMessages((prev) => [...prev, { role: "assistant", content: response }]);
      setAvatarBubble(response);
      setTimeout(() => setAvatarSpeaking(false), 4000);
    } catch {
      const errMsg = "Lo siento, hubo un error. ¿Puedes intentar de nuevo?";
      setMessages((prev) => [...prev, { role: "assistant", content: errMsg }]);
      setAvatarBubble(errMsg);
      setAvatarSpeaking(false);
    } finally {
      setChatLoading(false);
    }
  }

  async function confirmOrder() {
    if (!restaurantId || cart.length === 0) return;

    const orderPayload: any = {
      restaurant_id: restaurantId,
      table_id: tableId,
      status: "pending",
      total: cartTotal,
    };
    if (sessionId) orderPayload.session_id = sessionId;

    const { data: order } = await supabase
      .from("orders")
      .insert(orderPayload)
      .select("id")
      .single();

    if (!order) return;

    await supabase.from("order_items").insert(
      cart.map((item) => ({ order_id: order.id, menu_item_id: item.id, quantity: item.quantity, unit_price: item.price }))
    );

    await supabase.from("tables").update({ status: "ordering" }).eq("id", tableId);

    const confirmMsg = `¡Tu pedido por ${formatPrice(cartTotal)} ha sido enviado a cocina! Te avisaré cuando esté listo.`;
    setMessages((prev) => [
      ...prev,
      { role: "user", content: `Pedido: ${cart.map((i) => `${i.name} x${i.quantity}`).join(", ")}` },
      { role: "assistant", content: confirmMsg },
    ]);
    setAvatarBubble(confirmMsg);
    setAvatarSpeaking(true);
    setTimeout(() => setAvatarSpeaking(false), 4000);
    setCart([]);
    setView("avatar");
    loadSessionOrders();
  }

  const style = avatarStyles[avatarStyle] ?? avatarStyles.robot;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-bg-dark gap-4">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-accent-pink/20 flex items-center justify-center animate-pulse">
          <span className="text-[28px]">🤖</span>
        </div>
        <p className="text-white/30 text-[13px]">Preparando tu mesero...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-bg-dark text-white max-w-md mx-auto relative overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-5 py-3 border-b border-white/5 bg-bg-dark/80 backdrop-blur-xl z-10">
        <div>
          <p className="text-[15px] font-semibold">{restaurantName}</p>
          <p className="text-[11px] text-white/30">{tableName}</p>
        </div>
        <div className="flex items-center gap-2">
          {cartCount > 0 && (
            <button
              onClick={() => setView("orders")}
              className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/15 text-primary text-[12px] font-semibold"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              {formatPrice(cartTotal)}
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">
                {cartCount}
              </span>
            </button>
          )}
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* ========== AVATAR MODE (full screen) ========== */}
        {view === "avatar" && (
          <div className="flex flex-col items-center justify-center px-5 min-h-full relative">
            {/* Full-screen avatar */}
            <div className="flex flex-col items-center justify-center flex-1 w-full py-8">
              {/* Avatar character - large */}
              <div className="relative mb-8">
                {/* Glow ring */}
                <div
                  className={`absolute inset-0 rounded-full bg-gradient-to-br ${style.bg} blur-2xl scale-[2] ${
                    avatarSpeaking ? "animate-pulse" : ""
                  }`}
                />
                {/* Avatar circle */}
                <div
                  className={`relative w-40 h-40 rounded-full bg-gradient-to-br ${style.bg} border-2 ${
                    avatarSpeaking ? "border-primary" : "border-white/10"
                  } flex items-center justify-center transition-all duration-500 ${style.glow}`}
                >
                  <span className="text-[72px]">{style.emoji}</span>
                  {/* Speaking indicator */}
                  {avatarSpeaking && (
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                      <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  )}
                </div>
              </div>

              {/* Avatar name */}
              <h2 className="text-[22px] font-semibold mb-1">{avatarName}</h2>
              <p className="text-[13px] text-white/30 mb-8">Tu mesero virtual</p>

              {/* Speech bubble */}
              <div className="w-full max-w-sm mb-6">
                <div className="relative bg-white/[0.06] rounded-[20px] px-5 py-4 border border-white/[0.06]">
                  <p className="text-[15px] text-white/80 leading-relaxed text-center">
                    {chatLoading ? (
                      <span className="flex items-center justify-center gap-2 text-white/40">
                        <Sparkles className="w-4 h-4 animate-spin" />
                        Pensando...
                      </span>
                    ) : (
                      avatarBubble
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* "Más opciones" floating button */}
            <div className="w-full pb-4">
              <button
                onClick={() => setShowQuickActions(!showQuickActions)}
                className="w-full flex items-center justify-center gap-2 py-2.5 text-[13px] text-white/40 hover:text-white/60 transition-colors"
              >
                <MoreHorizontal className="w-4 h-4" />
                {showQuickActions ? "Ocultar opciones" : "Más opciones"}
                {showQuickActions ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
              </button>

              {/* Quick actions - collapsible */}
              {showQuickActions && (
                <div className="grid grid-cols-2 gap-2 mt-2 animate-in fade-in duration-200">
                  <button
                    onClick={() => askAvatar("¿Qué me recomiendas hoy?")}
                    disabled={chatLoading}
                    className="flex items-center gap-2.5 px-3 py-3 rounded-[14px] bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] transition-all disabled:opacity-50"
                  >
                    <span className="w-8 h-8 rounded-[8px] bg-primary/15 flex items-center justify-center shrink-0">
                      <Sparkles className="w-4 h-4 text-primary" />
                    </span>
                    <span className="text-[12px] font-medium text-white/80 text-left">¿Qué me recomiendas?</span>
                  </button>

                  <button
                    onClick={() => setView("menu")}
                    className="flex items-center gap-2.5 px-3 py-3 rounded-[14px] bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] transition-all"
                  >
                    <span className="w-8 h-8 rounded-[8px] bg-accent-pink/15 flex items-center justify-center shrink-0">
                      <UtensilsCrossed className="w-4 h-4 text-accent-pink" />
                    </span>
                    <span className="text-[12px] font-medium text-white/80 text-left">Ver el menú</span>
                  </button>

                  <button
                    onClick={() => askAvatar("¿Cuáles son los especiales del día?")}
                    disabled={chatLoading}
                    className="flex items-center gap-2.5 px-3 py-3 rounded-[14px] bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] transition-all disabled:opacity-50"
                  >
                    <span className="w-8 h-8 rounded-[8px] bg-warning/15 flex items-center justify-center shrink-0">
                      <Star className="w-4 h-4 text-warning" />
                    </span>
                    <span className="text-[12px] font-medium text-white/80 text-left">Especiales del día</span>
                  </button>

                  <button
                    onClick={() => askAvatar("¿Tienen opciones vegetarianas o para personas con restricciones alimentarias?")}
                    disabled={chatLoading}
                    className="flex items-center gap-2.5 px-3 py-3 rounded-[14px] bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] transition-all disabled:opacity-50"
                  >
                    <span className="w-8 h-8 rounded-[8px] bg-success/15 flex items-center justify-center shrink-0">
                      <Salad className="w-4 h-4 text-success" />
                    </span>
                    <span className="text-[12px] font-medium text-white/80 text-left">Opciones especiales</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========== CHAT MODE ========== */}
        {view === "chat" && (
          <div className="p-5 space-y-4 pb-2">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "assistant" && (
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary/20 to-accent-pink/20 flex items-center justify-center mr-2 mt-1 shrink-0">
                    <span className="text-[14px]">{style.emoji}</span>
                  </div>
                )}
                <div
                  className={`max-w-[80%] px-4 py-3 rounded-[16px] text-[14px] leading-relaxed ${
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
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary/20 to-accent-pink/20 flex items-center justify-center mr-2 shrink-0">
                  <span className="text-[14px]">{style.emoji}</span>
                </div>
                <div className="px-4 py-3 rounded-[16px] rounded-bl-[4px] bg-white/[0.06]">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-white/30 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 rounded-full bg-white/30 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 rounded-full bg-white/30 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* ========== MENU (styled like admin preview) ========== */}
        {view === "menu" && (
          <div>
            {/* Category chips */}
            <div className="flex gap-2 px-5 py-4 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
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

            {/* Menu items - card layout */}
            <div className="px-5 pb-5">
              {categories.length === 0 ? (
                <div className="text-center py-16 text-white/30 text-[14px]">
                  Este restaurante aún no tiene menú configurado
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {categories
                    .find((c) => c.name === activeCategory)
                    ?.items.map((item) => {
                      const inCart = cart.find((c) => c.id === item.id);
                      return (
                        <div
                          key={item.id}
                          className="rounded-[14px] overflow-hidden bg-white/[0.04] border border-white/[0.06] hover:border-white/[0.1] transition-all"
                        >
                          {item.image_url ? (
                            <img src={item.image_url} alt={item.name} className="w-full h-28 object-cover" />
                          ) : (
                            <div className="w-full h-28 bg-white/[0.03] flex items-center justify-center">
                              <UtensilsCrossed className="w-8 h-8 text-white/8" />
                            </div>
                          )}
                          <div className="p-3">
                            <p className="text-[13px] font-medium text-white/90 line-clamp-1">{item.name}</p>
                            {item.description && (
                              <p className="text-[11px] text-white/30 mt-0.5 line-clamp-2">{item.description}</p>
                            )}
                            <div className="flex items-center justify-between mt-2">
                              <p className="text-[14px] font-semibold text-primary">{formatPrice(item.price)}</p>
                              {inCart ? (
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => removeFromCart(item.id)}
                                    className="w-6 h-6 rounded-full bg-white/[0.08] flex items-center justify-center text-white/60"
                                  >
                                    <Minus className="w-3 h-3" />
                                  </button>
                                  <span className="text-[13px] font-semibold w-4 text-center">{inCart.quantity}</span>
                                  <button
                                    onClick={() => addToCart(item)}
                                    className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white"
                                  >
                                    <Plus className="w-3 h-3" />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => addToCart(item)}
                                  className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center text-primary hover:bg-primary/25 transition-colors"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            {/* Floating cart bar */}
            {cartCount > 0 && (
              <div className="sticky bottom-0 px-5 pb-4 pt-2 bg-gradient-to-t from-bg-dark via-bg-dark to-transparent">
                <button
                  onClick={confirmOrder}
                  className="w-full flex items-center justify-between bg-primary text-white py-3.5 px-5 rounded-full text-[14px] font-semibold hover:bg-primary-dark transition-all duration-300 hover:shadow-[0_4px_20px_rgba(168,85,247,0.3)]"
                >
                  <span className="flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4" />
                    Confirmar pedido ({cartCount})
                  </span>
                  <span>{formatPrice(cartTotal)}</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* ========== ORDERS (session history) ========== */}
        {view === "orders" && (
          <div className="p-5">
            {/* Current cart */}
            {cart.length > 0 && (
              <div className="mb-6">
                <h3 className="text-[13px] font-semibold text-white/50 uppercase tracking-wider mb-3">Carrito actual</h3>
                <div className="space-y-2 mb-4">
                  {cart.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 rounded-[12px] bg-white/[0.04] border border-white/[0.06]">
                      <div>
                        <p className="text-[14px] font-medium text-white/90">{item.name}</p>
                        <p className="text-[13px] text-primary mt-0.5">{formatPrice(item.price)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => removeFromCart(item.id)} className="w-7 h-7 rounded-full bg-white/[0.08] flex items-center justify-center text-white/60">
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-[14px] font-semibold w-5 text-center">{item.quantity}</span>
                        <button onClick={() => addToCart(item)} className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-white">
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border-t border-white/[0.06] pt-3 mb-3">
                  <div className="flex justify-between text-[15px] font-semibold">
                    <span className="text-white">Total</span>
                    <span className="text-primary">{formatPrice(cartTotal)}</span>
                  </div>
                </div>
                <button
                  onClick={confirmOrder}
                  className="w-full bg-primary text-white py-3 rounded-full text-[14px] font-semibold hover:bg-primary-dark transition-all"
                >
                  Confirmar pedido
                </button>
              </div>
            )}

            {/* Session orders history */}
            <h3 className="text-[13px] font-semibold text-white/50 uppercase tracking-wider mb-3">
              Pedidos de esta mesa
            </h3>
            {sessionOrders.length === 0 && cart.length === 0 ? (
              <div className="text-center py-16">
                <ClipboardList className="w-12 h-12 text-white/15 mx-auto mb-4" />
                <p className="text-white/30 text-[14px]">No hay pedidos aún</p>
                <button onClick={() => setView("menu")} className="mt-4 text-primary text-[14px] font-medium">
                  Ver menú
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {sessionOrders.map((order) => {
                  const statusInfo = statusLabels[order.status] ?? statusLabels.pending;
                  const StatusIcon = statusInfo.icon;
                  return (
                    <div key={order.id} className="rounded-[14px] bg-white/[0.04] border border-white/[0.06] p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[12px] font-mono text-white/30">#{order.id.slice(0, 8)}</span>
                        <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium ${statusInfo.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {statusInfo.label}
                        </span>
                      </div>
                      <div className="space-y-1.5">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between text-[13px]">
                            <span className="text-white/70">{item.quantity}x {item.name}</span>
                            <span className="text-white/40">{formatPrice(item.unit_price * item.quantity)}</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/[0.04]">
                        <span className="text-[12px] text-white/30">
                          {new Date(order.created_at).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                        <span className="text-[14px] font-semibold text-primary">{formatPrice(order.total)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom navigation + input */}
      <div className="border-t border-white/5 bg-bg-dark/80 backdrop-blur-xl">
        {/* Input bar ONLY for chat mode */}
        {view === "chat" && (
          <div className="px-4 pt-3 pb-1">
            <div className="flex items-center gap-2">
              <button className="w-10 h-10 rounded-full bg-white/[0.06] flex items-center justify-center text-white/40 hover:text-white/70 hover:bg-white/[0.1] transition-colors">
                <Mic className="w-5 h-5" />
              </button>
              <div className="flex-1">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && message.trim()) {
                      askAvatar(message.trim());
                    }
                  }}
                  placeholder={`Pregúntale a ${avatarName}...`}
                  className="w-full px-4 py-2.5 rounded-full bg-white/[0.06] border border-white/[0.06] text-[14px] text-white placeholder:text-white/25 focus:outline-none focus:border-primary/30"
                />
              </div>
              <button
                onClick={() => { if (message.trim()) askAvatar(message.trim()); }}
                disabled={chatLoading || !message.trim()}
                className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white hover:bg-primary-dark transition-colors disabled:opacity-30"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Tab bar */}
        <div className="flex items-center px-2 py-2">
          {[
            { key: "avatar" as const, icon: style.emoji, label: avatarName },
            { key: "chat" as const, icon: "💬", label: "Chat" },
            { key: "menu" as const, icon: "🍽️", label: "Menú" },
            { key: "orders" as const, icon: "📋", label: `Pedido${sessionOrders.length > 0 ? ` (${sessionOrders.length})` : ""}` },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setView(tab.key)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-1.5 rounded-[10px] transition-all ${
                view === tab.key ? "text-primary" : "text-white/30 hover:text-white/50"
              }`}
            >
              <span className="text-[18px]">{tab.icon}</span>
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
