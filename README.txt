# SISTEMA DE VENTAS — JC CHAPAS & HIERROS (Static Build)
Entrega lista para subir (sin compilación), con:
- Menú lateral rojo
- Membrete con logo arriba
- Cotizador con generación de PDF (jsPDF)
- Registro de ventas (mock) + hooks para Supabase
- Config rápida de Supabase desde la pestaña Configuración

## Cómo usar
1) Subí toda esta carpeta a cualquier hosting estático (Netlify, Vercel static, GitHub Pages, servidor Nginx/Apache).
2) Abrí `index.html`.
3) Para conectar Supabase:
   - Ir a **Configuración**.
   - Completar **SUPABASE_URL** y **SUPABASE_ANON_KEY** y guardar.
   - Crear la tabla `ventas` en Supabase si querés persistir el registro:

```sql
create table if not exists public.ventas (
  id text primary key,
  fecha text,
  fechaISO timestamptz,
  cliente text,
  items text,
  metodo text,
  total numeric
);
```

> Nota: si ya tenés otra estructura, adaptá los campos en `js/supabase.js` y `js/app.js`.

## PDF
- **Presupuesto**: usa el botón *Generar presupuesto (PDF)* en la vista Cotizador.
- **Registro de ventas**: *Exportar PDF* en su propia vista.

## Cambiar colores
- El rojo del menú se define en `tailwind.config` inline (brand.600/700). Podés cambiarlos en el `<head>`.

## Logo
- Logo editable en `assets/logo_jc.svg`. Si tenés tu logo oficial en PNG/SVG, reemplazalo usando el mismo nombre de archivo.


## Configuración automática (sin tocar el código)
- Editá `config/config.json` y poné tus **SUPABASE_URL** y **SUPABASE_ANON_KEY**.
- Al recargar la web, se conectará sola a Supabase y traerá la tabla `ventas`.

## Seeds
- Tenés `seed_ventas.json` como ejemplo de datos.
- Podés importarlo a Supabase desde el panel o usar SQL de inserción a mano.
