create table if not exists public.user_access_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  accessed_at timestamp with time zone not null default now(),
  ip_address text,
  user_agent text,
  device_info text
);

create index if not exists idx_user_access_logs_user_id_accessed_at
  on public.user_access_logs (user_id, accessed_at desc);

revoke all on public.user_access_logs from anon, authenticated;

create or replace function public.log_user_access(
  p_user_id uuid,
  p_user_agent text default null,
  p_device_info text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  request_headers jsonb := coalesce(
    nullif(current_setting('request.headers', true), ''),
    '{}'
  )::jsonb;
  resolved_ip text;
begin
  resolved_ip := coalesce(
    nullif(split_part(request_headers ->> 'x-forwarded-for', ',', 1), ''),
    nullif(request_headers ->> 'x-real-ip', ''),
    nullif(request_headers ->> 'cf-connecting-ip', '')
  );

  insert into public.user_access_logs (user_id, ip_address, user_agent, device_info)
  values (p_user_id, resolved_ip, nullif(p_user_agent, ''), nullif(p_device_info, ''));
end;
$$;

grant execute on function public.log_user_access(uuid, text, text) to anon, authenticated;

create or replace function public.get_user_access_logs(
  p_requester_id uuid,
  p_target_user_id uuid,
  p_limit integer default 100
)
returns table (
  id uuid,
  user_id uuid,
  accessed_at timestamp with time zone,
  ip_address text,
  user_agent text,
  device_info text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.profiles as p
    where p.id = p_requester_id
      and p.role = 'admin'
      and p.is_active = true
  ) then
    raise exception 'Operazione non autorizzata';
  end if;

  return query
  select
    log.id,
    log.user_id,
    log.accessed_at,
    log.ip_address,
    log.user_agent,
    log.device_info
  from public.user_access_logs as log
  where log.user_id = p_target_user_id
  order by log.accessed_at desc
  limit least(greatest(coalesce(p_limit, 100), 1), 500);
end;
$$;

grant execute on function public.get_user_access_logs(uuid, uuid, integer) to anon, authenticated;
