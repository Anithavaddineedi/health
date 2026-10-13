CREATE TABLE IF NOT EXISTS public.insurance_options (
  type text PRIMARY KEY CHECK (type IN ('individual', 'family', 'senior', 'critical', 'government', 'topup')),
  name text NOT NULL,
  coverage text NOT NULL,
  verified_cover_min numeric,
  verified_cover_max numeric,
  annual_premium numeric,
  benefits text NOT NULL,
  eligibility text NOT NULL,
  waiting_period text NOT NULL,
  exclusions text NOT NULL,
  provider text NOT NULL,
  source_url text NOT NULL,
  source_label text NOT NULL,
  verified_product boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.insurance_options ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_insurance_options" ON public.insurance_options;
CREATE POLICY "select_insurance_options" ON public.insurance_options
  FOR SELECT TO authenticated USING (true);

GRANT SELECT ON public.insurance_options TO authenticated;

INSERT INTO public.insurance_options (
  type, name, coverage, verified_cover_min, verified_cover_max, annual_premium,
  benefits, eligibility, waiting_period, exclusions, provider, source_url,
  source_label, verified_product
) VALUES
  (
    'individual', 'Individual Health Insurance',
    'Sum insured and limits depend on the selected policy.', NULL, NULL, NULL,
    'An individual policy covers eligible expenses for the insured person, as defined in its policy wording.',
    'Entry age, medical screening, and acceptance are insurer- and product-specific.',
    'Not standardized. Check initial, pre-existing-condition, and specified-treatment waits in the policy wording.',
    'Exclusions and sub-limits vary by policy. Review the current policy wording before buying.',
    'Star Health Insurance', 'https://www.starhealth.in/health-insurance/',
    'Health insurance guide', false
  ),
  (
    'family', 'Family Floater',
    'A shared sum insured; amount and covered members depend on the policy.', NULL, NULL, NULL,
    'A single shared cover can apply to insured family members, subject to the selected policy terms.',
    'Permitted relationships, member ages, and maximum members vary by insurer and product.',
    'Policy- and condition-specific. Check the schedule and policy wording for every insured member.',
    'Exclusions, co-payments, and sub-limits vary by policy. Review the current policy wording.',
    'HDFC ERGO', 'https://www.hdfcergo.com/health-insurance',
    'Health insurance products', false
  ),
  (
    'senior', 'Senior Citizen Insurance',
    'Sum insured, co-payment, and sub-limits are product-specific.', NULL, NULL, NULL,
    'Health cover designed for older adults; covered treatments and cost-sharing depend on the policy.',
    'Senior entry-age definition and medical assessment are set by each insurer. Confirm directly.',
    'Check the selected policy for initial, pre-existing-condition, and procedure-specific waits.',
    'Check exclusions, co-payments, room limits, and disease sub-limits in the selected policy wording.',
    'Star Health Insurance', 'https://www.starhealth.in/health-insurance/',
    'Health insurance guide', false
  ),
  (
    'critical', 'Critical Illness Cover',
    'Star Critical Illness Multipay: ₹5 lakh–₹25 lakh sum insured, in ₹1 lakh multiples.',
    500000, 2500000, NULL,
    'The named policy page describes a lump-sum payout for a listed covered diagnosis, lists 37 illnesses, and describes multipay conditions. It is not a substitute for hospitalization cover.',
    'The product page states entry ages 18–65. Its screening information and other conditions must be checked with the insurer.',
    'The product page states a 90-day wait before the first covered major-disease diagnosis, a 15-day survival period, and a 12-month wait between covered conditions.',
    'The covered diagnosis definitions, exclusions, claim limits, and remaining conditions are in the policy wording. Check it before buying.',
    'Star Health Insurance', 'https://www.starhealth.in/health-insurance/critical-illness-insurance/',
    'Star Critical Illness Multipay product information', true
  ),
  (
    'government', 'Government Health Schemes',
    'Eligibility, covered services, and benefit limits vary by scheme, state, and beneficiary category.', NULL, NULL, NULL,
    'Potential access to scheme-defined benefits for eligible beneficiaries. Verify the currently applicable scheme and package details on the official portal.',
    'Scheme-specific; check eligibility using the official beneficiary portal or relevant state authority.',
    'Scheme-specific. Confirm covered services and applicable conditions with the official scheme.',
    'Scheme rules, listed packages, and exclusions apply; confirm the current rules with the official scheme.',
    'National Health Authority (PM-JAY Beneficiary Portal)', 'https://beneficiary.nha.gov.in/',
    'Official beneficiary portal', false
  ),
  (
    'topup', 'Top-up Plans',
    'Additional cover above a deductible; the deductible and cover limit are policy-specific.', NULL, NULL, NULL,
    'Can supplement a base policy after eligible expenses cross the plan deductible. Confirm how the deductible applies to claims.',
    'Availability, entry age, and whether a base policy is required depend on the product.',
    'Product- and condition-specific. Check the policy schedule and wording.',
    'Deductible, exclusions, and sub-limits vary. Confirm how this coordinates with your existing insurance.',
    'Star Health Insurance', 'https://www.starhealth.in/health-insurance/',
    'Health insurance guide', false
  )
ON CONFLICT (type) DO UPDATE SET
  name = EXCLUDED.name,
  coverage = EXCLUDED.coverage,
  verified_cover_min = EXCLUDED.verified_cover_min,
  verified_cover_max = EXCLUDED.verified_cover_max,
  annual_premium = EXCLUDED.annual_premium,
  benefits = EXCLUDED.benefits,
  eligibility = EXCLUDED.eligibility,
  waiting_period = EXCLUDED.waiting_period,
  exclusions = EXCLUDED.exclusions,
  provider = EXCLUDED.provider,
  source_url = EXCLUDED.source_url,
  source_label = EXCLUDED.source_label,
  verified_product = EXCLUDED.verified_product,
  updated_at = now();

CREATE TABLE IF NOT EXISTS public.insurance_preferences (
  user_id uuid PRIMARY KEY DEFAULT auth.uid()
    REFERENCES auth.users(id) ON DELETE CASCADE,
  age integer CHECK (age IS NULL OR age BETWEEN 0 AND 120),
  budget numeric CHECK (budget IS NULL OR budget >= 0),
  minimum_cover numeric CHECK (minimum_cover IS NULL OR minimum_cover >= 0),
  insurance_type text NOT NULL DEFAULT 'all'
    CHECK (insurance_type IN ('all', 'individual', 'family', 'senior', 'critical', 'government', 'topup')),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.insurance_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_insurance_preferences" ON public.insurance_preferences;
CREATE POLICY "select_own_insurance_preferences" ON public.insurance_preferences
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_insurance_preferences" ON public.insurance_preferences;
CREATE POLICY "insert_own_insurance_preferences" ON public.insurance_preferences
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_insurance_preferences" ON public.insurance_preferences;
CREATE POLICY "update_own_insurance_preferences" ON public.insurance_preferences
  FOR UPDATE TO authenticated USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE ON public.insurance_preferences TO authenticated;

NOTIFY pgrst, 'reload schema';
