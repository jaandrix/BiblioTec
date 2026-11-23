-- BiblioTec: una fila por usuario con todo su estado (ajustes, colección,
-- carro, zona Pokémon y el código de conexión con Bitácora) en jsonb, como
-- hace Bitácora. Solo el propio usuario puede leer o cambiar su fila.

create table if not exists public.biblioteca (
    user_id uuid primary key references auth.users(id) on delete cascade,
    datos jsonb not null default '{}'::jsonb,
    actualizado timestamptz not null default now()
);

alter table public.biblioteca enable row level security;

drop policy if exists "cada uno lee su biblioteca" on public.biblioteca;
create policy "cada uno lee su biblioteca" on public.biblioteca
    for select using (auth.uid() = user_id);

drop policy if exists "cada uno crea su biblioteca" on public.biblioteca;
create policy "cada uno crea su biblioteca" on public.biblioteca
    for insert with check (auth.uid() = user_id);

drop policy if exists "cada uno guarda su biblioteca" on public.biblioteca;
create policy "cada uno guarda su biblioteca" on public.biblioteca
    for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "cada uno borra su biblioteca" on public.biblioteca;
create policy "cada uno borra su biblioteca" on public.biblioteca
    for delete using (auth.uid() = user_id);
