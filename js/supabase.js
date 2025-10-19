// Config y helpers de Supabase
let supabaseClient = null;

function guardarConfig(){
  const url = document.getElementById('supabase-url').value.trim();
  const key = document.getElementById('supabase-key').value.trim();
  if(!url || !key){ alert('Completá URL y KEY de Supabase.'); return; }
  localStorage.setItem('SUPABASE_URL', url);
  localStorage.setItem('SUPABASE_KEY', key);
  supabaseClient = window.supabase.createClient(url, key);
  alert('Configuración guardada.');
}

// Ejemplo de guardado de venta (requiere tabla `ventas` en Supabase)
async function guardarVentaSupabase(venta){
  if(!supabaseClient){
    const url = localStorage.getItem('SUPABASE_URL');
    const key = localStorage.getItem('SUPABASE_KEY');
    if(url && key) supabaseClient = window.supabase.createClient(url, key);
  }
  if(!supabaseClient) return { error: 'Supabase no configurado' };
  const { data, error } = await supabaseClient.from('ventas').insert(venta).select('*');
  return { data, error };
}

// Ejemplo de lectura
async function cargarVentasSupabase(){
  if(!supabaseClient){
    const url = localStorage.getItem('SUPABASE_URL');
    const key = localStorage.getItem('SUPABASE_KEY');
    if(url && key) supabaseClient = window.supabase.createClient(url, key);
  }
  if(!supabaseClient) return;
  const { data, error } = await supabaseClient.from('ventas').select('*').order('fechaISO', { ascending: false });
  if(!error && Array.isArray(data)){
    ventas = data.map(v => ({
      id: v.id || v.nro || '',
      fecha: v.fecha || '',
      fechaISO: v.fechaISO || null,
      cliente: v.cliente || '',
      items: v.items || '',
      metodo: v.metodo || '',
      total: v.total || 0
    }));
    cargarVentasTabla();
  }
}


// Carga automática desde config/config.json si existe
(async function initSupabaseFromConfig(){
  try {
    const res = await fetch('config/config.json', { cache: 'no-store' });
    if(res.ok){
      const cfg = await res.json();
      if(cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY){
        supabaseClient = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
        // Intentar cargar ventas automáticamente
        try { await cargarVentasSupabase(); } catch (e) {}
      }
    }
  } catch(e){ /* no-op */ }
})();
