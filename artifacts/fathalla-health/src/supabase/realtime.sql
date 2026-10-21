-- Turn on Realtime for the live monitor (safe to run twice)
do $$ begin
  begin alter publication supabase_realtime add table cart_items; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table profiles;   exception when duplicate_object then null; end;
end $$;
