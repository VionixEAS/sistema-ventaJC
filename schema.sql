-- Esquema básico para JC CHAPAS & HIERROS
create table if not exists public.ventas (
  id text primary key,
  fecha text,
  fechaISO timestamptz,
  cliente text,
  items text,
  metodo text,
  total numeric
);

-- Políticas RLS (opcional; descomentar si tenés RLS activado y rol anon)
-- alter table public.ventas enable row level security;
-- create policy "Allow anon read" on public.ventas
--   for select using (true);
-- create policy "Allow anon insert" on public.ventas
--   for insert with check (true);
