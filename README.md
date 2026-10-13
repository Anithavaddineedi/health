# health

## Insurance recommendations backend

The insurance page reads its insurance options from Supabase and saves each signed-in user's age, budget, minimum cover, and selected insurance type. Apply `supabase/migrations/20261013100000_insurance_recommendations_backend.sql` to the configured Supabase project before using the page. The migration creates the catalog and user-preferences tables with row-level security and asks PostgREST to reload its schema. If the page reports that `public.insurance_options` is missing, run the migration in the SQL Editor of the same Supabase project configured for the app, then refresh the page. If the table already exists but is still missing from the schema cache, run `NOTIFY pgrst, 'reload schema';` in that project's SQL Editor.

## Health trends live updates

Apply `supabase/migrations/20261013110000_enable_health_table_realtime.sql` to the configured Supabase project if Health Trends reports a Realtime channel error. It idempotently adds the health data tables, including `medical_records`, to the `supabase_realtime` publication. Health tables must also retain their owner-scoped authenticated SELECT policies.

Health Trends plots blood pressure, blood sugar/glucose, and hemoglobin readings from processed medical records, with the All range selected by default. Newly uploaded reports are checked for common labels such as BP, FBS/RBS, Hb, and HGB. Older documents processed before these extractors were added need to be uploaded and processed again to create any missing readings.