JC CHAPAS & HIERROS — v3.2 Futurista PRO (Interno + Público)

Estructura:
- index.html → panel interno (Catálogo + Cotizador + Ventas + PDF)
- catalogo.html → catálogo público (solo selección + WhatsApp)
- public/js/app.js → lógica interna
- public/js/catalogo.js → lógica pública
- public/js/supabase.js → conexión a Supabase (lee assets/config/config.json)
- assets/config/config.json → PONER AQUÍ tus claves Supabase
- assets/logo_jc.svg → logo
- vercel.json → configuración para servir /public y /assets en Vercel

SQL para agregar columna de imagen:
  ALTER TABLE public.productos ADD COLUMN IF NOT EXISTS imagen_url text;

Deploy (Git):
  git add .
  git commit -m "v3.2 Futurista PRO Interno+Publico"
  git push -u origin main

Vercel actualizará automáticamente.
