// === JC CHAPAS & HIERROS v3.1 Futurista Pro ===
// Catálogo con fotos + WhatsApp, Cotizador, Ventas, Supabase

let carrito = [];         // items seleccionados (cotizador/catalogo)
let productos = [];       // productos desde Supabase
let seleccionCatalogo = {}; // { id: cantidad } para el catálogo

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
    actualizarMetricasPanel();
  } catch (e) {
    console.error("Error cargando productos:", e);
    toast("Error cargando productos", "err");
  }
}

// ===== Cotizador (lista simple con botón Agregar)
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
// CATÁLOGO (público/cliente)
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
// AGREGAR PRODUCTO (con imagen)
// =============================
document.getElementById("btnAgregarProducto")?.addEventListener("click", () => abrirModal("modalProducto"));
document.getElementById("btnCancelarProd")?.addEventListener("click", () => cerrarModal("modalProducto"));
document.getElementById("btnGuardarProd")?.addEventListener("click", async () => {
  const nombre = document.getElementById("nombreProd").value.trim();
  const tipo = document.getElementById("tipoProd").value;
  const precio = parseFloat(document.getElementById("precioProd").value);
  const descripcion = document.getElementById("descProd").value.trim();
  const imagen_url = document.getElementById("imagenProd").value.trim();

  if (!nombre || !precio) { toast("Complete los campos requeridos", "err"); return; }

  try {
    const { error } = await supabaseClient.from("productos").insert([{ nombre, tipo, precio, descripcion, imagen_url }]);
    if (error) throw error;
    toast("Producto agregado");
    cerrarModal("modalProducto");
    await cargarProductos();
  } catch (e) {
    console.error(e);
    toast("Error al guardar producto", "err");
  }
});

// =============================
// REGISTRAR VENTA
// =============================
document.getElementById("btnRegistrarVenta")?.addEventListener("click", () => abrirModal("modalVenta"));
document.getElementById("btnCancelarVenta")?.addEventListener("click", () => cerrarModal("modalVenta"));
document.getElementById("btnGuardarVenta")?.addEventListener("click", async () => {
  const cliente = document.getElementById("clienteVenta").value.trim();
  const metodo = document.getElementById("metodoVenta").value;

  if (!carrito.length) { toast("No hay productos en el carrito", "err"); return; }

  const total = totalCarrito();
  const items = carrito.map(c => `${c.nombre} (${c.cant} ${c.tipo})`).join(", ");

  try {
    const { error } = await supabaseClient.from("ventas").insert([{
      id: Date.now().toString(),
      fecha: new Date().toLocaleString("es-PY"),
      fechaISO: new Date().toISOString(),
      cliente, metodo, items, total
    }]);
    if (error) throw error;
    toast("Venta registrada");
    carrito = [];
    cerrarModal("modalVenta");
    await cargarVentas();
  } catch (e) {
    console.error(e);
    toast("Error registrando venta", "err");
  }
});

// =============================
// REGISTRO DE VENTAS (vista)
// =============================
document.getElementById("btnRegistroVentas")?.addEventListener("click", async () => {
  showView("ventas", document.querySelector('[data-view="ventas"]'));
  await cargarVentas();
});

async function cargarVentas() {
  try {
    const { data, error } = await supabaseClient.from("ventas").select("*").order("fechaISO", { ascending: false });
    if (error) throw error;
    const cont = document.getElementById("tablaVentas");
    if (!cont) return;
    if (!data.length) { cont.innerHTML = `<p class="text-center text-white/70">Aún no hay ventas registradas.</p>`; return; }
    let html = `<table class="w-full text-left border-collapse">
      <thead><tr class="bg-red-800 text-white">
      <th class="p-2">Fecha</th><th class="p-2">Cliente</th><th class="p-2">Método</th><th class="p-2">Total</th></tr></thead><tbody>`;
    data.forEach(v => {
      html += `<tr class="border-b border-red-900/30 hover:bg-red-900/40">
        <td class="p-2">${v.fecha}</td>
        <td class="p-2">${v.cliente || '-'}</td>
        <td class="p-2">${v.metodo}</td>
        <td class="p-2">${currencyPY(v.total)}</td></tr>`;
    });
    html += "</tbody></table>";
    cont.innerHTML = html;
  } catch (e) {
    console.error("Error cargando ventas:", e);
    toast("Error cargando ventas", "err");
  }
}

// =============================
// PDF (abrir/guardar)
// =============================
document.getElementById("btnGenerarPDF")?.addEventListener("click", () => {
  if (!window.jspdf) { toast("Cargando librerías PDF...", "err"); return; }
  if (!carrito.length) { toast("Agregue productos al carrito", "err"); return; }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  // Membrete
  const logo = new Image();
  logo.src = "assets/logo_jc.svg";
  doc.addImage(logo, "SVG", 10, 8, 20, 20);
  doc.setFontSize(14);
  doc.text("JC CHAPAS & HIERROS", 40, 18);
  doc.setFontSize(9);
  doc.text("RUC 6519029-0 • KM 8 Acaray, Barrio San Juan • Tel. 0971 888 289", 40, 24);
  doc.line(10, 28, 200, 28);

  const body = carrito.map((c, i) => [i+1, c.nombre, c.tipo, c.cant, currencyPY(c.precio), currencyPY(c.total)]);
  doc.autoTable({ startY: 34, head: [["#","Producto","Tipo","Cant.","Precio","Total"]], body, styles: { fontSize: 9 } });

  const total = totalCarrito();
  doc.setFontSize(12);
  doc.text(`TOTAL: ${currencyPY(total)}`, 14, doc.lastAutoTable.finalY + 10);

  const blob = doc.output("blob");
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank");
});

// ===== WhatsApp desde cotizador (opcional botón)
document.getElementById("btnWAfromCotizador")?.addEventListener("click", () => {
  const wa = (document.getElementById("waNumber")?.value || "").trim();
  if (!wa) { toast("Ingresá un número de WhatsApp en el Catálogo", "err"); return; }
  if (!carrito.length) { toast("Agregá productos al carrito", "err"); return; }

  const lineas = carrito.map(c => `• ${c.nombre} (${c.cant} ${c.tipo}) — ${currencyPY(c.total)}`).join("\n");
  const total = totalCarrito();
  const msg = `Hola, quiero pedir:\n${lineas}\n\nTOTAL: ${currencyPY(total)}\n\nEnviado desde JC CHAPAS & HIERROS`;
  window.open(buildWAURL(wa, msg), "_blank");
});

// =============================
// MÉTRICAS (panel)
// =============================
function actualizarMetricasPanel() {
  const mP = document.getElementById("metricProductos");
  if (mP) mP.textContent = productos.length ?? "—";
  // (Si querés, podemos traer ventas de hoy y sumar totales)
}

// =============================
// ONLOAD
// =============================
window.onload = async () => {
  await cargarProductos();
};
