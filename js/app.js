// === JC CHAPAS & HIERROS v2.5 Futurista ===
// Autor: César Roa & Viernes AI
// Funcionalidades: Cotizador, Registrar Venta, Agregar Producto, PDF, Supabase

let carrito = [];
let productos = [];

// =============================
// UTILIDADES
// =============================
function currencyPY(valor) {
  return new Intl.NumberFormat("es-PY", {
    style: "currency",
    currency: "PYG",
    minimumFractionDigits: 0,
  }).format(valor);
}

function mostrarToast(mensaje, tipo = "ok") {
  const toast = document.createElement("div");
  toast.textContent = mensaje;
  toast.className = `fixed bottom-6 left-1/2 -translate-x-1/2 px-6 py-3 rounded-xl shadow-lg text-white text-sm ${
    tipo === "ok" ? "bg-green-600" : "bg-red-600"
  }`;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// =============================
// CARGA DE PRODUCTOS
// =============================
async function cargarProductos() {
  try {
    const { data, error } = await supabaseClient.from("productos").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    productos = data || [];
    renderProductos();
  } catch (e) {
    console.error("Error cargando productos:", e.message);
    mostrarToast("Error cargando productos", "err");
  }
}

function renderProductos() {
  const contenedor = document.getElementById("listaProductos");
  contenedor.innerHTML = "";

  if (!productos.length) {
    contenedor.innerHTML = `<p class="text-center text-gray-300">No hay productos registrados todavía.</p>`;
    return;
  }

  productos.forEach((p) => {
    const div = document.createElement("div");
    div.className = "flex justify-between items-center border-b border-red-900/40 pb-1";
    div.innerHTML = `
      <div>
        <p class="font-semibold">${p.nombre}</p>
        <small class="text-gray-400">${p.tipo} — ${currencyPY(p.precio)}</small>
      </div>
      <button class="btn-red px-3 py-1 rounded-lg" onclick="agregarAlCarrito('${p.id}')">Agregar</button>
    `;
    contenedor.appendChild(div);
  });
}

function agregarAlCarrito(idProd) {
  const p = productos.find((x) => x.id === idProd);
  if (!p) return;
  const cantidad = 1;
  carrito.push({
    id: p.id,
    prod: p.nombre,
    modo: p.tipo,
    cant: cantidad,
    precio: p.precio,
    total: cantidad * p.precio,
  });
  mostrarToast("Producto agregado al carrito");
}

// =============================
// MODALES
// =============================
function abrirModal(id) {
  document.getElementById(id).classList.remove("hidden");
  document.getElementById(id).classList.add("flex");
}
function cerrarModal(id) {
  document.getElementById(id).classList.add("hidden");
  document.getElementById(id).classList.remove("flex");
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
    mostrarToast("Complete los campos requeridos", "err");
    return;
  }

  try {
    const { error } = await supabaseClient.from("productos").insert([{ nombre, tipo, precio, descripcion }]);
    if (error) throw error;
    mostrarToast("Producto agregado correctamente");
    cerrarModal("modalProducto");
    await cargarProductos();
  } catch (e) {
    console.error(e);
    mostrarToast("Error al guardar producto", "err");
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
    mostrarToast("El carrito está vacío", "err");
    return;
  }

  const total = carrito.reduce((a, b) => a + b.total, 0);
  const items = carrito.map((c) => `${c.prod} (${c.cant} ${c.modo})`).join(", ");

  try {
    const { error } = await supabaseClient.from("ventas").insert([
      {
        id: Date.now().toString(),
        fecha: new Date().toLocaleString("es-PY"),
        fechaISO: new Date().toISOString(),
        cliente,
        metodo,
        items,
        total,
      },
    ]);
    if (error) throw error;
    mostrarToast("Venta registrada correctamente");
    carrito = [];
    cerrarModal("modalVenta");
    await cargarVentas();
  } catch (e) {
    console.error(e);
    mostrarToast("Error al registrar venta", "err");
  }
};

// =============================
// REGISTRO DE VENTAS
// =============================
document.getElementById("btnRegistroVentas").onclick = async () => {
  document.getElementById("registroVentas").classList.toggle("hidden");
  await cargarVentas();
};

async function cargarVentas() {
  try {
    const { data, error } = await supabaseClient.from("ventas").select("*").order("fechaISO", { ascending: false });
    if (error) throw error;
    const cont = document.getElementById("tablaVentas");
    if (!data.length) {
      cont.innerHTML = `<p class="text-center text-gray-400">Aún no hay ventas registradas.</p>`;
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
    console.error("Error cargando ventas:", e.message);
    mostrarToast("Error cargando ventas", "err");
  }
}

// =============================
// GENERAR PDF (abrir y guardar)
// =============================
document.getElementById("btnGenerarPDF").onclick = async () => {
  if (!window.jspdf) {
    mostrarToast("Cargando librerías PDF...", "err");
    return;
  }

  if (!carrito.length) {
    mostrarToast("Agregue productos al carrito", "err");
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

  // Tabla de productos
  const body = carrito.map((c, i) => [
    i + 1,
    c.prod,
    c.modo,
    c.cant,
    currencyPY(c.precio),
    currencyPY(c.total),
  ]);

  doc.autoTable({
    startY: 34,
    head: [["#", "Producto", "Modo", "Cant.", "Precio", "Total"]],
    body,
    styles: { fontSize: 9 },
  });

  const total = carrito.reduce((a, b) => a + b.total, 0);
  doc.setFontSize(12);
  doc.text(`TOTAL: ${currencyPY(total)}`, 14, doc.lastAutoTable.finalY + 10);

  // Abrir vista previa en nueva pestaña
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
