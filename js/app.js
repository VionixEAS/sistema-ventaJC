// === JC CHAPAS & HIERROS v3 Futurista Pro ===
// Lógica principal: productos, cotizador, ventas y PDF

let carrito = [];
let productos = [];

// =============================
// FORMATO DE MONEDA
// =============================
function currencyPY(valor) {
  return new Intl.NumberFormat("es-PY", {
    style: "currency",
    currency: "PYG",
    minimumFractionDigits: 0
  }).format(valor);
}

function toast(msg, type = "ok") {
  const div = document.createElement("div");
  div.textContent = msg;
  div.className = `fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 text-sm rounded-lg text-white shadow-lg ${
    type === "ok" ? "bg-green-600" : "bg-red-600"
  }`;
  document.body.appendChild(div);
  setTimeout(() => div.remove(), 3000);
}

// =============================
// CARGAR PRODUCTOS
// =============================
async function cargarProductos() {
  try {
    const { data, error } = await supabaseClient.from("productos").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    productos = data || [];
    renderProductos();
  } catch (e) {
    console.error(e);
    toast("Error al cargar productos", "err");
  }
}

function renderProductos() {
  const cont = document.getElementById("listaProductos");
  cont.innerHTML = "";

  if (!productos.length) {
    cont.innerHTML = `<p class="text-center text-white/70">No hay productos registrados.</p>`;
    return;
  }

  productos.forEach(p => {
    const div = document.createElement("div");
    div.className = "flex justify-between items-center border-b border-red-900/40 py-2";
    div.innerHTML = `
      <div>
        <p class="font-semibold">${p.nombre}</p>
        <small class="text-white/70">${p.tipo} — ${currencyPY(p.precio)}</small>
      </div>
      <button class="btn-red px-3 py-1 rounded-md" onclick="agregarAlCarrito('${p.id}')">Agregar</button>
    `;
    cont.appendChild(div);
  });
}

function agregarAlCarrito(idProd) {
  const p = productos.find(x => x.id === idProd);
  if (!p) return;
  carrito.push({ ...p, cant: 1, total: p.precio });
  toast("Producto agregado al carrito");
}

// =============================
// MODALES
// =============================
function abrirModal(id) {
  const modal = document.getElementById(id);
  modal.classList.remove("hidden");
  modal.classList.add("flex");
}
function cerrarModal(id) {
  const modal = document.getElementById(id);
  modal.classList.add("hidden");
  modal.classList.remove("flex");
}

// =============================
// AGREGAR PRODUCTO
// =============================
document.getElementById("btnAgregarProducto").onclick = () => abrirModal("modalProducto");
document.getElementById("btnCancelarProd").onclick = () => cerrarModal("modalProducto");
document.getElementById("btnGuardarProd").onclick = async () => {
  const nombre = document.getElementById("nombreProd").value.trim();
  const tipo = document.getElementById("tipoProd").value;
  const precio = parseFloat(document.getElementById("precioProd").value);
  const descripcion = document.getElementById("descProd").value.trim();

  if (!nombre || !precio) {
    toast("Complete los campos requeridos", "err");
    return;
  }

  try {
    const { error } = await supabaseClient.from("productos").insert([{ nombre, tipo, precio, descripcion }]);
    if (error) throw error;
    toast("Producto agregado correctamente");
    cerrarModal("modalProducto");
    await cargarProductos();
  } catch (e) {
    console.error(e);
    toast("Error guardando producto", "err");
  }
};

// =============================
// REGISTRAR VENTA
// =============================
document.getElementById("btnRegistrarVenta").onclick = () => abrirModal("modalVenta");
document.getElementById("btnCancelarVenta").onclick = () => cerrarModal("modalVenta");
document.getElementById("btnGuardarVenta").onclick = async () => {
  const cliente = document.getElementById("clienteVenta").value.trim();
  const metodo = document.getElementById("metodoVenta").value;

  if (!carrito.length) {
    toast("No hay productos en el carrito", "err");
    return;
  }

  const total = carrito.reduce((a, b) => a + b.total, 0);
  const items = carrito.map(c => `${c.nombre} (${c.cant} ${c.tipo})`).join(", ");

  try {
    const { error } = await supabaseClient.from("ventas").insert([
      {
        id: Date.now().toString(),
        fecha: new Date().toLocaleString("es-PY"),
        fechaISO: new Date().toISOString(),
        cliente,
        metodo,
        items,
        total
      }
    ]);
    if (error) throw error;
    toast("Venta registrada correctamente");
    carrito = [];
    cerrarModal("modalVenta");
    await cargarVentas();
  } catch (e) {
    console.error(e);
    toast("Error registrando venta", "err");
  }
};

// =============================
// REGISTRO DE VENTAS
// =============================
document.getElementById("btnRegistroVentas").onclick = async () => {
  document.getElementById("view-ventas").classList.remove("hidden");
  await cargarVentas();
};

async function cargarVentas() {
  try {
    const { data, error } = await supabaseClient.from("ventas").select("*").order("fechaISO", { ascending: false });
    if (error) throw error;
    const cont = document.getElementById("tablaVentas");
    if (!data.length) {
      cont.innerHTML = `<p class="text-center text-white/70">Aún no hay ventas registradas.</p>`;
      return;
    }
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
    console.error(e);
    toast("Error cargando ventas", "err");
  }
}

// =============================
// GENERAR PDF (abrir + guardar)
// =============================
document.getElementById("btnGenerarPDF").onclick = () => {
  if (!window.jspdf) {
    toast("Cargando librerías PDF...", "err");
    return;
  }
  if (!carrito.length) {
    toast("Agregue productos al carrito", "err");
    return;
  }

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

  const body = carrito.map((c, i) => [i + 1, c.nombre, c.tipo, c.cant, currencyPY(c.precio), currencyPY(c.total)]);
  doc.autoTable({
    startY: 34,
    head: [["#", "Producto", "Tipo", "Cant.", "Precio", "Total"]],
    body,
    styles: { fontSize: 9 }
  });

  const total = carrito.reduce((a, b) => a + b.total, 0);
  doc.setFontSize(12);
  doc.text(`TOTAL: ${currencyPY(total)}`, 14, doc.lastAutoTable.finalY + 10);

  const blob = doc.output("blob");
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank");
};

// =============================
// INICIO
// =============================
window.onload = async () => {
  await cargarProductos();
};
