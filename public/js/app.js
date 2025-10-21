// === JC CHAPAS & HIERROS v3.1 Futurista Pro ===
// Catálogo con fotos + WhatsApp, Cotizador, Ventas, Supabase

let carrito = [];
let productos = [];
let seleccionCatalogo = {};

// =============================
// UTILIDADES
// =============================
function currencyPY(n) {
  return new Intl.NumberFormat("es-PY", { style: "currency", currency: "PYG", minimumFractionDigits: 0 }).format(n || 0);
}
function toast(msg, type = "ok") {
  const d = document.createElement("div");
  d.textContent = msg;
  d.className = `fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 text-sm rounded-lg text-white shadow-lg ${type === "ok" ? "bg-green-600" : "bg-red-600"}`;
  document.body.appendChild(d);
  setTimeout(() => d.remove(), 2600);
}
function buildWAURL(numeroSinMas, textoPlano) {
  const encoded = encodeURIComponent(textoPlano);
  return `https://wa.me/${numeroSinMas}?text=${encoded}`;
}
function totalCarrito(list) { return (list || carrito).reduce((a, b) => a + (b.total || 0), 0); }

// =============================
// PRODUCTOS
// =============================
async function cargarProductos() {
  try {
    const { data, error } = await supabaseClient
      .from("productos")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    productos = data || [];
    renderProductosCotizador();
    renderCatalogo();
  } catch (e) {
    console.error("Error cargando productos:", e);
    toast("Error cargando productos", "err");
  }
}

function renderProductosCotizador() {
  const cont = document.getElementById("listaProductos");
  if (!cont) return;
  cont.innerHTML = "";

  if (!productos.length) {
    cont.innerHTML = `<p class="text-center text-white/70">No hay productos registrados.</p>`;
    return;
  }

  productos.forEach(p => {
    const row = document.createElement("div");
    row.className = "flex justify-between items-center border-b border-red-900/40 py-2";
    row.innerHTML = `
      <div class="flex items-center gap-3">
        <img src="${p.imagen_url || 'assets/logo_jc.svg'}" class="w-10 h-10 object-cover rounded-md border border-red-900/50"/>
        <div>
          <p class="font-semibold">${p.nombre}</p>
          <small class="text-white/70">${p.tipo} — ${currencyPY(p.precio)}</small>
        </div>
      </div>
      <button class="btn-red px-3 py-1 rounded-md" onclick="agregarAlCarrito('${p.id}')">Agregar</button>
    `;
    cont.appendChild(row);
  });
}

function agregarAlCarrito(idProd) {
  const p = productos.find(x => x.id === idProd);
  if (!p) return;
  const item = { id: p.id, nombre: p.nombre, tipo: p.tipo, precio: Number(p.precio) || 0, cant: 1, total: Number(p.precio) || 0 };
  carrito.push(item);
  toast("Producto agregado al carrito");
}

// =============================
// CATÁLOGO
// =============================
function renderCatalogo(filtro = "") {
  const grid = document.getElementById("gridCatalogo");
  if (!grid) return;
  grid.innerHTML = "";

  let lista = productos;
  if (filtro) {
    const f = filtro.toLowerCase();
    lista = productos.filter(p => (p.nombre || "").toLowerCase().includes(f) || (p.tipo || "").toLowerCase().includes(f));
  }

  if (!lista.length) {
    grid.innerHTML = `<p class="text-center text-white/70 col-span-full">Sin resultados.</p>`;
    return;
  }

  lista.forEach(p => {
    const cant = seleccionCatalogo[p.id] || 0;
    const card = document.createElement("div");
    card.className = "glass p-3 flex flex-col";
    card.innerHTML = `
      <img src="${p.imagen_url || 'assets/logo_jc.svg'}" alt="img" class="w-full h-40 object-cover rounded-md border border-red-900/40"/>
      <div class="mt-3">
        <div class="font-semibold">${p.nombre}</div>
        <div class="text-sm text-white/70">${p.tipo} — ${currencyPY(p.precio)}</div>
      </div>
      <div class="mt-3 flex items-center gap-2">
        <button class="btn-soft px-2 py-1" onclick="restarCatalogo('${p.id}')">–</button>
        <div id="q_${p.id}" class="min-w-[2rem] text-center">${cant}</div>
        <button class="btn-red px-2 py-1" onclick="sumarCatalogo('${p.id}')">+</button>
      </div>
    `;
    grid.appendChild(card);
  });

  actualizarResumenCatalogo();
}

function sumarCatalogo(id) {
  seleccionCatalogo[id] = (seleccionCatalogo[id] || 0) + 1;
  const el = document.getElementById("q_" + id);
  if (el) el.textContent = seleccionCatalogo[id];
  actualizarResumenCatalogo();
}
function restarCatalogo(id) {
  const v = (seleccionCatalogo[id] || 0) - 1;
  seleccionCatalogo[id] = Math.max(0, v);
  const el = document.getElementById("q_" + id);
  if (el) el.textContent = seleccionCatalogo[id];
  actualizarResumenCatalogo();
}

function construirPedidoCatalogo() {
  const items = [];
  Object.keys(seleccionCatalogo).forEach(id => {
    const cant = seleccionCatalogo[id];
    if (!cant) return;
    const p = productos.find(x => x.id === id);
    if (!p) return;
    const total = cant * (Number(p.precio) || 0);
    items.push({ nombre: p.nombre, tipo: p.tipo, cant, precio: Number(p.precio) || 0, total });
  });
  const total = items.reduce((a, b) => a + b.total, 0);
  return { items, total };
}

function actualizarResumenCatalogo() {
  const r = document.getElementById("resumenCatalogo");
  if (!r) return;
  const { items, total } = construirPedidoCatalogo();
  const qty = items.reduce((a, b) => a + b.cant, 0);
  r.textContent = `${qty} ítems seleccionados • Total: ${currencyPY(total)}`
}

document.getElementById("buscarCatalogo")?.addEventListener("input", (e) => {
  renderCatalogo(e.target.value || "");
});

document.getElementById("btnEnviarWA")?.addEventListener("click", () => {
  const wa = (document.getElementById("waNumber")?.value || "").trim();
  if (!wa) { toast("Ingresá un número de WhatsApp (con país, sin +)", "err"); return; }
  const { items, total } = construirPedidoCatalogo();
  if (!items.length) { toast("Seleccioná productos del catálogo", "err"); return; }

  const lineas = items.map(i => `• ${i.nombre} (${i.cant} ${i.tipo}) — ${currencyPY(i.total)}`).join("\n");
  const mensaje = `Hola, quiero realizar un pedido:\n${lineas}\n\nTOTAL: ${currencyPY(total)}\n\nEnviado desde JC CHAPAS & HIERROS`;
  window.open(buildWAURL(wa, mensaje), "_blank");
});

// =============================
// ONLOAD
// =============================
window.onload = async () => {
  await cargarProductos();
};
