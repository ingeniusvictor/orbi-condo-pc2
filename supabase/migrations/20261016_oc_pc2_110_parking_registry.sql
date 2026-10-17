-- ORBI LIVING OC-PC2-110 — private parking registry.
-- SYNTHETIC STAGING ONLY. This migration intentionally blocks real resident names,
-- real unit identifiers and real vehicle plates until a later privacy-governance gate.

begin;

create table if not exists public.property_assets(
 id uuid primary key default gen_random_uuid(),
 community_id text not null references public.communities(id) on delete cascade,
 asset_type text not null check(asset_type in ('parking','storage')),
 asset_code text not null check(length(asset_code) between 1 and 40),
 parking_level text check(parking_level is null or parking_level in ('exterior','subterranean')),
 parking_class text check(parking_class is null or parking_class in ('resident','visit','commercial')),
 zone_code text check(zone_code is null or length(zone_code)<=80),
 status text not null default 'available' check(status in ('available','assigned','leased','loaned','review')),
 linked_unit_code text check(linked_unit_code is null or (length(linked_unit_code)<=40 and linked_unit_code ~ '^DEMO-[A-Za-z0-9-]+$')),
 sort_order integer not null default 0,
 active boolean not null default true,
 revision bigint not null default 1 check(revision>0),
 created_by uuid references auth.users(id),
 updated_by uuid references auth.users(id),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(community_id,asset_type,asset_code),
 unique(community_id,id),
 check(asset_type<>'parking' or (parking_level is not null and parking_class is not null))
);

create table if not exists public.property_parties_private(
 id uuid primary key default gen_random_uuid(),
 community_id text not null references public.communities(id) on delete cascade,
 display_name text not null check(length(display_name) between 6 and 96 and display_name ~ '^SINT-[A-Za-z0-9 _-]+$'),
 unit_code text check(unit_code is null or (length(unit_code)<=40 and unit_code ~ '^DEMO-[A-Za-z0-9-]+$')),
 synthetic boolean not null default true check(synthetic=true),
 active boolean not null default true,
 revision bigint not null default 1 check(revision>0),
 created_by uuid references auth.users(id),
 updated_by uuid references auth.users(id),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(community_id,id)
);

create unique index if not exists property_parties_private_active_identity_idx
 on public.property_parties_private(community_id,lower(display_name),coalesce(unit_code,''))
 where active;

create table if not exists public.property_asset_occupancy(
 id uuid primary key default gen_random_uuid(),
 community_id text not null references public.communities(id) on delete cascade,
 asset_id uuid not null,
 relationship text not null check(relationship in ('owner','tenant','authorized_user','loaned')),
 party_reference_id uuid not null,
 vehicle_reference text check(vehicle_reference is null or (length(vehicle_reference)<=32 and vehicle_reference ~ '^DEMO-[A-Za-z0-9-]+$')),
 valid_from date not null default current_date,
 valid_until date,
 active boolean not null default true,
 revision bigint not null default 1 check(revision>0),
 created_by uuid references auth.users(id),
 updated_by uuid references auth.users(id),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(community_id,id),
 foreign key(community_id,asset_id) references public.property_assets(community_id,id) on delete restrict,
 foreign key(community_id,party_reference_id) references public.property_parties_private(community_id,id) on delete restrict,
 check(valid_until is null or valid_until>=valid_from)
);

create unique index if not exists property_asset_occupancy_one_active_relation_idx
 on public.property_asset_occupancy(community_id,asset_id,relationship)
 where active;
create index if not exists property_assets_parking_lookup_idx
 on public.property_assets(community_id,asset_type,parking_level,sort_order) where active;
create index if not exists property_asset_occupancy_asset_idx
 on public.property_asset_occupancy(community_id,asset_id,active,relationship);
create index if not exists property_asset_occupancy_party_idx
 on public.property_asset_occupancy(community_id,party_reference_id,active);

-- Canonical physical inventory verified for Parque Ciudadano II.
insert into public.property_assets(community_id,asset_type,asset_code,parking_level,parking_class,zone_code,sort_order)
select 'pc2','parking','E'||n::text,'exterior','resident',
 case
  when n between 1 and 14 then 'EXT_D_WEST'
  when n between 15 and 18 then 'EXT_C_EAST'
  when n between 19 and 36 then 'EXT_NORTH_OUTER'
  when n between 37 and 52 then 'EXT_NORTH_INNER'
  else 'EXT_B_WEST'
 end,
 n
from generate_series(1,72) as n
where exists(select 1 from public.communities where id='pc2')
on conflict(community_id,asset_type,asset_code) do nothing;

insert into public.property_assets(community_id,asset_type,asset_code,parking_level,parking_class,zone_code,sort_order)
select 'pc2','parking',code,'exterior',class,zone_code,sort_order
from (values
 ('V01','visit','EXT_ACCESS_VISIT',73),
 ('V02','visit','EXT_ACCESS_VISIT',74),
 ('LC01','commercial','EXT_COMMERCIAL_WEST',75),
 ('LC02','commercial','EXT_COMMERCIAL_EAST',76)
) as seed(code,class,zone_code,sort_order)
where exists(select 1 from public.communities where id='pc2')
on conflict(community_id,asset_type,asset_code) do nothing;

insert into public.property_assets(community_id,asset_type,asset_code,parking_level,parking_class,zone_code,sort_order)
select 'pc2','parking',n::text,'subterranean','resident',
 case
  when n between 73 and 84 then 'SUB_WEST_73_84'
  when n between 85 and 90 then 'SUB_SW_85_90'
  when n between 91 and 101 then 'SUB_SOUTH_91_101'
  when n between 102 and 126 then 'SUB_EAST_102_126'
  when n between 127 and 142 then 'SUB_NE_127_142'
  when n between 143 and 160 then 'SUB_NORTH_143_160'
  when n between 161 and 166 then 'SUB_NW_161_166'
  when n=167 then 'SUB_RAMP_167'
  when n between 168 and 170 then 'SUB_CENTER_E_168_170'
  when n between 171 and 178 then 'SUB_CENTER_171_178'
  else 'SUB_RAMP_ROW_179_182'
 end,
 1000+n
from generate_series(73,182) as n
where exists(select 1 from public.communities where id='pc2')
on conflict(community_id,asset_type,asset_code) do nothing;

-- Minimal synthetic fixtures exercise owner-only and owner+tenant lookup paths.
insert into public.property_parties_private(community_id,display_name,unit_code)
select 'pc2',display_name,unit_code
from (values
 ('SINT-PROPIETARIO-01','DEMO-B506'),
 ('SINT-ARRENDATARIO-01','DEMO-B506'),
 ('SINT-PROPIETARIO-02','DEMO-C304'),
 ('SINT-PROPIETARIO-03','DEMO-A204'),
 ('SINT-ARRENDATARIO-02','DEMO-A204')
) as seed(display_name,unit_code)
where exists(select 1 from public.communities where id='pc2')
on conflict do nothing;

update public.property_assets
set linked_unit_code='DEMO-C304',status='assigned',updated_at=now()
where community_id='pc2' and asset_type='parking' and asset_code='E12';
update public.property_assets
set linked_unit_code='DEMO-B506',status='leased',updated_at=now()
where community_id='pc2' and asset_type='parking' and asset_code='126';
update public.property_assets
set linked_unit_code='DEMO-A204',status='leased',updated_at=now()
where community_id='pc2' and asset_type='parking' and asset_code='167';

insert into public.property_asset_occupancy(community_id,asset_id,relationship,party_reference_id,vehicle_reference)
select 'pc2',a.id,'owner',p.id,null
from public.property_assets a
join public.property_parties_private p on p.community_id='pc2' and p.display_name='SINT-PROPIETARIO-02' and p.active
where a.community_id='pc2' and a.asset_type='parking' and a.asset_code='E12'
on conflict do nothing;

insert into public.property_asset_occupancy(community_id,asset_id,relationship,party_reference_id,vehicle_reference)
select 'pc2',a.id,seed.relationship,p.id,seed.vehicle_reference
from public.property_assets a
join (values
 ('owner','SINT-PROPIETARIO-01',null::text),
 ('tenant','SINT-ARRENDATARIO-01','DEMO-AB12')
) as seed(relationship,display_name,vehicle_reference) on true
join public.property_parties_private p on p.community_id='pc2' and p.display_name=seed.display_name and p.active
where a.community_id='pc2' and a.asset_type='parking' and a.asset_code='126'
on conflict do nothing;

insert into public.property_asset_occupancy(community_id,asset_id,relationship,party_reference_id,vehicle_reference)
select 'pc2',a.id,seed.relationship,p.id,seed.vehicle_reference
from public.property_assets a
join (values
 ('owner','SINT-PROPIETARIO-03',null::text),
 ('tenant','SINT-ARRENDATARIO-02','DEMO-CD34')
) as seed(relationship,display_name,vehicle_reference) on true
join public.property_parties_private p on p.community_id='pc2' and p.display_name=seed.display_name and p.active
where a.community_id='pc2' and a.asset_type='parking' and a.asset_code='167'
on conflict do nothing;

-- Revision and audit wiring is installed after seed data so migration bootstrap does not
-- manufacture user actors or synthetic audit noise.
drop trigger if exists property_assets_revision on public.property_assets;
create trigger property_assets_revision before update on public.property_assets
 for each row execute function public.bump_operational_revision();
drop trigger if exists property_parties_private_revision on public.property_parties_private;
create trigger property_parties_private_revision before update on public.property_parties_private
 for each row execute function public.bump_operational_revision();
drop trigger if exists property_asset_occupancy_revision on public.property_asset_occupancy;
create trigger property_asset_occupancy_revision before update on public.property_asset_occupancy
 for each row execute function public.bump_operational_revision();

create or replace function public.audit_property_asset()
returns trigger
language plpgsql
security definer
set search_path=public,auth
as $$
declare actor uuid;
begin
 actor:=coalesce(auth.uid(),new.updated_by,new.created_by);
 if actor is null then return new; end if;
 insert into public.audit_events(community_id,actor_user_id,action,resource_type,resource_id,result,metadata)
 values(new.community_id,actor,'property_asset.updated','property_asset',new.id::text,'ok',
  jsonb_build_object('asset_type',new.asset_type,'asset_code',new.asset_code,'status',new.status,'revision',new.revision));
 return new;
end;
$$;

create or replace function public.audit_property_occupancy()
returns trigger
language plpgsql
security definer
set search_path=public,auth
as $$
declare actor uuid;
begin
 actor:=coalesce(auth.uid(),new.updated_by,new.created_by);
 if actor is null then return new; end if;
 insert into public.audit_events(community_id,actor_user_id,action,resource_type,resource_id,result,metadata)
 values(new.community_id,actor,
  case when tg_op='INSERT' then 'property_occupancy.created' else 'property_occupancy.updated' end,
  'property_asset_occupancy',new.id::text,'ok',
  jsonb_build_object('asset_id',new.asset_id,'relationship',new.relationship,'active',new.active,'revision',new.revision));
 return new;
end;
$$;

revoke all on function public.audit_property_asset() from public;
revoke all on function public.audit_property_occupancy() from public;

drop trigger if exists property_assets_audit on public.property_assets;
create trigger property_assets_audit after update on public.property_assets
 for each row execute function public.audit_property_asset();
drop trigger if exists property_asset_occupancy_audit on public.property_asset_occupancy;
create trigger property_asset_occupancy_audit after insert or update on public.property_asset_occupancy
 for each row execute function public.audit_property_occupancy();

alter table public.property_assets enable row level security;
alter table public.property_parties_private enable row level security;
alter table public.property_asset_occupancy enable row level security;

revoke all on public.property_assets,public.property_parties_private,public.property_asset_occupancy from anon;
revoke all on public.property_assets,public.property_parties_private,public.property_asset_occupancy from authenticated;
grant select,insert,update on public.property_assets to authenticated;
grant select,insert,update on public.property_parties_private to authenticated;
grant select,insert,update on public.property_asset_occupancy to authenticated;

create policy property_assets_parking_lookup on public.property_assets
 for select to authenticated
 using(public.has_operations_role(community_id,array['administrator','mayordomo','concierge']));
create policy property_assets_admin_insert on public.property_assets
 for insert to authenticated
 with check(public.has_operations_role(community_id,array['administrator']) and created_by=auth.uid() and updated_by=auth.uid());
create policy property_assets_admin_update on public.property_assets
 for update to authenticated
 using(public.has_operations_role(community_id,array['administrator']))
 with check(public.has_operations_role(community_id,array['administrator']));

create policy property_parties_private_parking_lookup on public.property_parties_private
 for select to authenticated
 using(public.has_operations_role(community_id,array['administrator','mayordomo','concierge']));
create policy property_parties_private_admin_insert on public.property_parties_private
 for insert to authenticated
 with check(public.has_operations_role(community_id,array['administrator']) and synthetic=true and created_by=auth.uid() and updated_by=auth.uid());
create policy property_parties_private_admin_update on public.property_parties_private
 for update to authenticated
 using(public.has_operations_role(community_id,array['administrator']))
 with check(public.has_operations_role(community_id,array['administrator']) and synthetic=true);

create policy property_asset_occupancy_parking_lookup on public.property_asset_occupancy
 for select to authenticated
 using(public.has_operations_role(community_id,array['administrator','mayordomo','concierge']));
create policy property_asset_occupancy_admin_insert on public.property_asset_occupancy
 for insert to authenticated
 with check(public.has_operations_role(community_id,array['administrator']) and created_by=auth.uid() and updated_by=auth.uid());
create policy property_asset_occupancy_admin_update on public.property_asset_occupancy
 for update to authenticated
 using(public.has_operations_role(community_id,array['administrator']))
 with check(public.has_operations_role(community_id,array['administrator']));

create or replace function public.command_parking_assignment(
 p_community_id text,
 p_asset_id uuid,
 p_expected_revision bigint,
 p_linked_unit_code text,
 p_owner_label text,
 p_tenant_label text,
 p_vehicle_reference text,
 p_mark_review boolean default false
)
returns table(asset_id uuid,new_revision bigint,new_status text)
language plpgsql
security invoker
set search_path=public,auth
as $$
declare
 v_asset public.property_assets%rowtype;
 v_owner_id uuid;
 v_tenant_id uuid;
 v_owner_label text:=nullif(trim(p_owner_label),'');
 v_tenant_label text:=nullif(trim(p_tenant_label),'');
 v_unit text:=nullif(trim(p_linked_unit_code),'');
 v_vehicle text:=nullif(trim(p_vehicle_reference),'');
 v_status text;
begin
 if not public.has_operations_role(p_community_id,array['administrator']) then
  raise exception 'parking_permission_denied' using errcode='42501';
 end if;
 select * into v_asset
 from public.property_assets
 where community_id=p_community_id and id=p_asset_id and asset_type='parking' and active
 for update;
 if not found then raise exception 'parking_asset_not_found' using errcode='P0002'; end if;
 if v_asset.revision<>p_expected_revision then raise exception 'parking_revision_conflict' using errcode='40001'; end if;
 if v_unit is not null and v_unit !~ '^DEMO-[A-Za-z0-9-]+$' then raise exception 'synthetic_unit_required' using errcode='22023'; end if;
 if v_owner_label is not null and v_owner_label !~ '^SINT-[A-Za-z0-9 _-]+$' then raise exception 'synthetic_owner_required' using errcode='22023'; end if;
 if v_tenant_label is not null and v_tenant_label !~ '^SINT-[A-Za-z0-9 _-]+$' then raise exception 'synthetic_tenant_required' using errcode='22023'; end if;
 if v_vehicle is not null and v_vehicle !~ '^DEMO-[A-Za-z0-9-]+$' then raise exception 'synthetic_vehicle_required' using errcode='22023'; end if;

 if v_owner_label is not null then
  select id into v_owner_id from public.property_parties_private
   where community_id=p_community_id and lower(display_name)=lower(v_owner_label)
    and coalesce(unit_code,'')=coalesce(v_unit,'') and active limit 1;
  if v_owner_id is null then
   insert into public.property_parties_private(community_id,display_name,unit_code,synthetic,created_by,updated_by)
   values(p_community_id,v_owner_label,v_unit,true,auth.uid(),auth.uid()) returning id into v_owner_id;
  end if;
 end if;

 if v_tenant_label is not null then
  select id into v_tenant_id from public.property_parties_private
   where community_id=p_community_id and lower(display_name)=lower(v_tenant_label)
    and coalesce(unit_code,'')=coalesce(v_unit,'') and active limit 1;
  if v_tenant_id is null then
   insert into public.property_parties_private(community_id,display_name,unit_code,synthetic,created_by,updated_by)
   values(p_community_id,v_tenant_label,v_unit,true,auth.uid(),auth.uid()) returning id into v_tenant_id;
  end if;
 end if;

 update public.property_asset_occupancy
 set active=false,valid_until=coalesce(valid_until,current_date),updated_by=auth.uid()
 where community_id=p_community_id and asset_id=p_asset_id and active and relationship in ('owner','tenant');

 if v_owner_id is not null then
  insert into public.property_asset_occupancy(community_id,asset_id,relationship,party_reference_id,vehicle_reference,created_by,updated_by)
  values(p_community_id,p_asset_id,'owner',v_owner_id,case when v_tenant_id is null then v_vehicle else null end,auth.uid(),auth.uid());
 end if;
 if v_tenant_id is not null then
  insert into public.property_asset_occupancy(community_id,asset_id,relationship,party_reference_id,vehicle_reference,created_by,updated_by)
  values(p_community_id,p_asset_id,'tenant',v_tenant_id,v_vehicle,auth.uid(),auth.uid());
 end if;

 v_status:=case when coalesce(p_mark_review,false) then 'review' when v_tenant_id is not null then 'leased' when v_owner_id is not null then 'assigned' else 'available' end;
 update public.property_assets
 set linked_unit_code=v_unit,status=v_status,updated_by=auth.uid()
 where community_id=p_community_id and id=p_asset_id and revision=p_expected_revision;
 if not found then raise exception 'parking_revision_conflict' using errcode='40001'; end if;

 return query select p_asset_id,a.revision,a.status from public.property_assets a where a.id=p_asset_id and a.community_id=p_community_id;
end;
$$;

revoke all on function public.command_parking_assignment(text,uuid,bigint,text,text,text,text,boolean) from public;
grant execute on function public.command_parking_assignment(text,uuid,bigint,text,text,text,text,boolean) to authenticated;

-- No DELETE grants are issued. Real PII remains structurally blocked by the SINT-/DEMO-
-- checks until a later explicit privacy and production-readiness migration removes them.

commit;
