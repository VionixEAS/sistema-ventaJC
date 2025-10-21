// === JC CHAPAS & HIERROS v2.5 Futurista ===
// Conexión Supabase desde config/config.json

let supabaseClient = null;

(async function initSupabase() {
  try {
    // Cargar config.json dinámicamente
    const res = await fetch("config/config.json", { cache: "no-store" });
    if (!res.ok) throw new Error("No se pudo cargar config.json");
    const cfg = await res.json();

    if (!cfg.SUPABASE_URL || !cfg.SUPABASE_ANON_KEY) {
      console.error("Config incompleto. Verifica SUPABASE_URL y ANON_KEY.");
      alert("⚠️ No se detectaron claves de Supabase. Configura el archivo config/config.json");
      return;
    }

    // Crear cliente Supabase
    const { createClient } = window.supabase;
    if (!createClient) {
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.39.1/dist/umd/supabase.min.js";
      script.onload = () => {
        supabaseClient = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
        console.log("✅ Supabase conectado correctamente");
      };
      document.head.appendChild(script);
    } else {
      supabaseClient = createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
      console.log("✅ Supabase conectado correctamente");
    }
  } catch (e) {
    console.error("Error inicializando Supabase:", e.message);
    alert("Error conectando con Supabase. Ver consola.");
  }
})();
