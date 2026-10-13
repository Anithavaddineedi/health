# health

## Authentication

Email/password registration, sign-in, and password recovery use Supabase Auth; no SQL migration is required. Configure the Supabase project used by `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`:

1. In **Authentication → URL Configuration**, set the app's Site URL and add each deployed app URL plus local development URL (for example, `http://localhost:5173`) to the Redirect URLs allow list. Password recovery returns to the app origin.
2. Configure the Supabase Auth email templates and SMTP settings if you want email confirmation or password reset mail delivered reliably. With email confirmation enabled, new users must confirm their email before signing in.

## Insurance recommendations backend

The insurance page reads its insurance options from Supabase and saves each signed-in user's age, budget, minimum cover, and selected insurance type. A budget hides only options whose verified annual premium exceeds it; options without a verified quote remain visible and are marked as requiring an official quote. Apply `supabase/migrations/20261013100000_insurance_recommendations_backend.sql` to the configured Supabase project before using the page. The migration creates the catalog and user-preferences tables with row-level security and asks PostgREST to reload its schema. If the page reports that `public.insurance_options` is missing, run the migration in the SQL Editor of the same Supabase project configured for the app, then refresh the page. If the table already exists but is still missing from the schema cache, run `NOTIFY pgrst, 'reload schema';` in that project's SQL Editor.

## Health trends live updates

Apply `supabase/migrations/20261013110000_enable_health_table_realtime.sql` to the configured Supabase project if Health Trends reports a Realtime channel error. It idempotently adds the health data tables, including `medical_records`, to the `supabase_realtime` publication. Health tables must also retain their owner-scoped authenticated SELECT policies.

Health Trends plots blood pressure, blood sugar/glucose, and hemoglobin readings from processed medical records, with the All range selected by default. Newly uploaded reports are checked for common labels such as BP, FBS/RBS, Hb, and HGB. Older documents processed before these extractors were added need to be uploaded and processed again to create any missing readings.