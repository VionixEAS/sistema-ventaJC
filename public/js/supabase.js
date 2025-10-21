// === JC CHAPAS & HIERROS v3.1 Futurista Pro ===
// Conexión automática a Supabase usando config/config.json

let supabaseClient = null;

(async function initSupabase() {
  try {
    // Cargar configuración desde el archivo JSON
    const res = await fetch("assets/config/config.json", { cache: "no-store" });
    if (!res.ok) throw new Error("No se pudo cargar config.json");
    const cfg = await res.json();

    if (!cfg.SUPABASE_URL || !cfg.SUPABASE_ANON_KEY) {
      console.error("⚠️ Faltan claves en config.json");
      alert("Faltan claves en config.json — Verifica SUPABASE_URL y SUPABASE_ANON_KEY");
      return;
    }

    // Cargar librería supabase si aún no está presente
    if (!window.supabase) {
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.39.1/dist/umd/supabase.min.js";
      script.onload = () => {
        supabaseClient = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
        console.log("✅ Supabase conectado correctamente");
      };
      document.head.appendChild(script);
    } else {
      supabaseClient = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
      console.log("✅ Supabase conectado correctamente");
    }
  } catch (e) {
    console.error("❌ Error inicializando Supabase:", e.message);
    alert("Error conectando con Supabase. Ver consola.");
  }
})();
