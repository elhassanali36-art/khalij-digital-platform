-- فحص قراءة فقط: لا ينشئ ولا يعدّل ولا يحذف أي شيء.
select
  current_database() as database_name,
  current_user as database_user,
  current_schema() as current_schema,
  current_setting('search_path') as search_path;

select
  expected.table_name,
  case when actual.table_name is null then 'MISSING' else 'EXISTS' end as status
from (
  values
    ('sellers'),
    ('products'),
    ('orders'),
    ('withdrawals'),
    ('store_ratings')
) as expected(table_name)
left join information_schema.tables actual
  on actual.table_schema = 'public'
 and actual.table_name = expected.table_name
order by expected.table_name;

select table_name, column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name in ('sellers', 'products', 'orders', 'withdrawals', 'store_ratings')
order by table_name, ordinal_position;

-- تعرض الأعداد فقط إذا كانت الجداول الأساسية موجودة.
do $$
begin
  if to_regclass('public.sellers') is not null
     and to_regclass('public.products') is not null
     and to_regclass('public.orders') is not null
     and to_regclass('public.withdrawals') is not null
     and to_regclass('public.store_ratings') is not null then
    raise notice 'sellers=%', (select count(*) from public.sellers);
    raise notice 'products=%', (select count(*) from public.products);
    raise notice 'orders=%', (select count(*) from public.orders);
    raise notice 'withdrawals=%', (select count(*) from public.withdrawals);
    raise notice 'store_ratings=%', (select count(*) from public.store_ratings);
  else
    raise notice 'Counts skipped because one or more required tables are missing.';
  end if;
end $$;
