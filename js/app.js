// --- Estado ---
let carrito = [];
let ventas = []; // se puede sincronizar con Supabase
let precios = {
  "Chapa Galvanizada 1mm": { kg: 90000, metro: 65000, unidad: 80000 },
  "Hierro Ángulo 2\"": { kg: 70000, metro: 55000, unidad: 60000 },
  "Varilla 8mm": { kg: 40000, metro: 28000, unidad: 35000 }
};

// --- Utilidades ---
function currencyPY(n) { return new Intl.NumberFormat('es-PY').format(n || 0); }

function agregarItem() {
  const prod = document.getElementById('producto').value;
  const modo = document.getElementById('modo').value;
  const cant = parseFloat(document.getElementById('cantidad').value || '0');
  if (!cant || cant <= 0) return alert('Ingresá una cantidad válida.');
  const precio = precios[prod]?.[modo] || 0;
  const total = precio * cant;
  carrito.push({ prod, modo, cant, precio, total });
  renderSubtotal();
}

function renderSubtotal() {
  const sub = carrito.reduce((a, b) => a + b.total, 0);
  const items = carrito.length;
  document.querySelector('#subtotal span').textContent = currencyPY(sub);
  document.getElementById('subtotal').firstChild.textContent = `${items} ítems • Subtotal: `;
}

function limpiarCarrito(){ carrito = []; renderSubtotal(); }

// --- PDF de presupuesto ---
async function generarPDF() {
  if (carrito.length === 0) return alert('Agregá al menos un ítem.');
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  // Membrete
  doc.addImage('assets/logo_jc.svg', 'SVG', 10, 8, 16, 16);
  doc.setFontSize(14); doc.text('JC CHAPAS & HIERROS', 30, 16);
  doc.setFontSize(9); doc.setTextColor(90);
  doc.text('RUC 6519029-0 • KM 8 Acaray, Barrio San Juan • Tel. 0971 888 289', 30, 22);
  doc.setTextColor(0);
  doc.setLineWidth(0.5); doc.line(10, 26, 200, 26);

  // Tabla
  const body = carrito.map((c, i)=>[i+1, c.prod, c.modo, c.cant, currencyPY(c.precio), currencyPY(c.total)]);
  doc.autoTable({
    startY: 32,
    head: [['#','Producto','Modo','Cant.','Precio','Total (Gs.)']],
    body
  });
  const total = carrito.reduce((a,b)=>a+b.total,0);
  let y = doc.lastAutoTable.finalY + 8;
  doc.setFontSize(12); doc.text(`TOTAL: ${currencyPY(total)} Gs.`, 10, y);

  // Pie
  y += 12;
  doc.setFontSize(9); doc.setTextColor(120);
  doc.text('Gracias por su preferencia. Precios sujetos a cambio sin previo aviso.', 10, y);

  doc.save(`Presupuesto_JC_${Date.now()}.pdf`);
}

// --- Registro de ventas (mock + carga desde Supabase si config válida) ---
function cargarVentasTabla(filtradas = null) {
  const data = filtradas || ventas;
  const tbody = document.getElementById('tbody-ventas');
  tbody.innerHTML = '';
  data.forEach(v => {
    const tr = document.createElement('tr');
    tr.className = 'border-b hover:bg-gray-50';
    tr.innerHTML = `
      <td class="py-3 px-5 font-medium">${v.id}</td>
      <td class="py-3 px-5">${v.fecha}</td>
      <td class="py-3 px-5">${v.cliente}</td>
      <td class="py-3 px-5 text-gray-600">${v.items}</td>
      <td class="py-3 px-5">${v.metodo}</td>
      <td class="py-3 px-5 text-right font-semibold">${currencyPY(v.total)}</td>
    `;
    tbody.appendChild(tr);
  });
}

function aplicarFiltros(){
  const cliente = (document.getElementById('filtro-cliente').value || '').toLowerCase();
  const desde = document.getElementById('filtro-desde').value;
  const hasta = document.getElementById('filtro-hasta').value;
  const out = ventas.filter(v => {
    const okCliente = !cliente || v.cliente.toLowerCase().includes(cliente);
    const d = v.fechaISO ? new Date(v.fechaISO) : new Date();
    const okDesde = !desde || d >= new Date(desde);
    const okHasta = !hasta || d <= new Date(hasta + 'T23:59:59');
    return okCliente && okDesde && okHasta;
  });
  cargarVentasTabla(out);
}

function exportarVentasPDF(){
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.addImage('assets/logo_jc.svg', 'SVG', 10, 8, 16, 16);
  doc.setFontSize(14); doc.text('Registro de Ventas — JC CHAPAS & HIERROS', 30, 16);
  doc.setLineWidth(0.5); doc.line(10, 26, 200, 26);
  const body = ventas.map(v => [v.id, v.fecha, v.cliente, v.items, v.metodo, currencyPY(v.total)]);
  doc.autoTable({ startY: 32, head: [['#','Fecha','Cliente','Items','Método','Total (Gs.)']], body });
  doc.save(`Ventas_JC_${Date.now()}.pdf`);
}

// --- Datos demo + inicialización ---
ventas = [
  { id: "000145", fecha: "19/10/2025 10:42", fechaISO: "2025-10-19T10:42:00", cliente: "Carlos López", items: 'Chapa Galv. 1mm (20kg), Ángulo 2" (12m)', metodo: "Efectivo", total: 1850000 },
  { id: "000146", fecha: "19/10/2025 11:05", fechaISO: "2025-10-19T11:05:00", cliente: "Constructora Ñandutí", items: "Varilla 8mm (35kg)", metodo: "Transferencia", total: 1390000 },
  { id: "000147", fecha: "19/10/2025 12:18", fechaISO: "2025-10-19T12:18:00", cliente: "María Pérez", items: "Chapa Galv. 0.7mm (15kg)", metodo: "Tarjeta", total: 980000 },
];

cargarVentasTabla();
