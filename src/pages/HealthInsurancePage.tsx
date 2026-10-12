import { useCallback, useEffect, useMemo, useState } from 'react';
import { ExternalLink, HeartPulse, ShieldCheck } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';

type InsuranceType =
  | 'individual'
  | 'family'
  | 'senior'
  | 'critical'
  | 'government'
  | 'topup';

type InsuranceOption = {
  type: InsuranceType;
  name: string;
  coverage: string;
  verifiedCoverMin: number | null;
  verifiedCoverMax: number | null;
  annualPremium: number | null;
  benefits: string;
  eligibility: string;
  waitingPeriod: string;
  exclusions: string;
  provider: string;
  sourceUrl: string;
  sourceLabel: string;
  verifiedProduct?: boolean;
};

const options: InsuranceOption[] = [
  {
    type: 'individual',
    name: 'Individual Health Insurance',
    coverage: 'Sum insured and limits depend on the selected policy.',
    verifiedCoverMin: null,
    verifiedCoverMax: null,
    annualPremium: null,
    benefits: 'An individual policy covers eligible expenses for the insured person, as defined in its policy wording.',
    eligibility: 'Entry age, medical screening, and acceptance are insurer- and product-specific.',
    waitingPeriod: 'Not standardized. Check initial, pre-existing-condition, and specified-treatment waits in the policy wording.',
    exclusions: 'Exclusions and sub-limits vary by policy. Review the current policy wording before buying.',
    provider: 'Star Health Insurance',
    sourceUrl: 'https://www.starhealth.in/health-insurance/',
    sourceLabel: 'Health insurance guide',
  },
  {
    type: 'family',
    name: 'Family Floater',
    coverage: 'A shared sum insured; amount and covered members depend on the policy.',
    verifiedCoverMin: null,
    verifiedCoverMax: null,
    annualPremium: null,
    benefits: 'A single shared cover can apply to insured family members, subject to the selected policy terms.',
    eligibility: 'Permitted relationships, member ages, and maximum members vary by insurer and product.',
    waitingPeriod: 'Policy- and condition-specific. Check the schedule and policy wording for every insured member.',
    exclusions: 'Exclusions, co-payments, and sub-limits vary by policy. Review the current policy wording.',
    provider: 'HDFC ERGO',
    sourceUrl: 'https://www.hdfcergo.com/health-insurance',
    sourceLabel: 'Health insurance products',
  },
  {
    type: 'senior',
    name: 'Senior Citizen Insurance',
    coverage: 'Sum insured, co-payment, and sub-limits are product-specific.',
    verifiedCoverMin: null,
    verifiedCoverMax: null,
    annualPremium: null,
    benefits: 'Health cover designed for older adults; covered treatments and cost-sharing depend on the policy.',
    eligibility: 'Senior entry-age definition and medical assessment are set by each insurer. Confirm directly.',
    waitingPeriod: 'Check the selected policy for initial, pre-existing-condition, and procedure-specific waits.',
    exclusions: 'Check exclusions, co-payments, room limits, and disease sub-limits in the selected policy wording.',
    provider: 'Star Health Insurance',
    sourceUrl: 'https://www.starhealth.in/health-insurance/',
    sourceLabel: 'Health insurance guide',
  },
  {
    type: 'critical',
    name: 'Critical Illness Cover',
    coverage: 'Star Critical Illness Multipay: ₹5 lakh–₹25 lakh sum insured, in ₹1 lakh multiples.',
    verifiedCoverMin: 500000,
    verifiedCoverMax: 2500000,
    annualPremium: null,
    benefits: 'The named policy page describes a lump-sum payout for a listed covered diagnosis, lists 37 illnesses, and describes multipay conditions. It is not a substitute for hospitalization cover.',
    eligibility: 'The product page states entry ages 18–65. Its screening information and other conditions must be checked with the insurer.',
    waitingPeriod: 'The product page states a 90-day wait before the first covered major-disease diagnosis, a 15-day survival period, and a 12-month wait between covered conditions.',
    exclusions: 'The covered diagnosis definitions, exclusions, claim limits, and remaining conditions are in the policy wording. Check it before buying.',
    provider: 'Star Health Insurance',
    sourceUrl: 'https://www.starhealth.in/health-insurance/critical-illness-insurance/',
    sourceLabel: 'Star Critical Illness Multipay product information',
    verifiedProduct: true,
  },
  {
    type: 'government',
    name: 'Government Health Schemes',
    coverage: 'Eligibility, covered services, and benefit limits vary by scheme, state, and beneficiary category.',
    verifiedCoverMin: null,
    verifiedCoverMax: null,
    annualPremium: null,
    benefits: 'Potential access to scheme-defined benefits for eligible beneficiaries. Verify the currently applicable scheme and package details on the official portal.',
    eligibility: 'Scheme-specific; check eligibility using the official beneficiary portal or relevant state authority.',
    waitingPeriod: 'Scheme-specific. Confirm covered services and applicable conditions with the official scheme.',
    exclusions: 'Scheme rules, listed packages, and exclusions apply; confirm the current rules with the official scheme.',
    provider: 'National Health Authority (PM-JAY Beneficiary Portal)',
    sourceUrl: 'https://beneficiary.nha.gov.in/',
    sourceLabel: 'Official beneficiary portal',
  },
  {
    type: 'topup',
    name: 'Top-up Plans',
    coverage: 'Additional cover above a deductible; the deductible and cover limit are policy-specific.',
    verifiedCoverMin: null,
    verifiedCoverMax: null,
    annualPremium: null,
    benefits: 'Can supplement a base policy after eligible expenses cross the plan deductible. Confirm how the deductible applies to claims.',
    eligibility: 'Availability, entry age, and whether a base policy is required depend on the product.',
    waitingPeriod: 'Product- and condition-specific. Check the policy schedule and wording.',
    exclusions: 'Deductible, exclusions, and sub-limits vary. Confirm how this coordinates with your existing insurance.',
    provider: 'Star Health Insurance',
    sourceUrl: 'https://www.starhealth.in/health-insurance/',
    sourceLabel: 'Health insurance guide',
  },
];

const typeLabels: Record<InsuranceType, string> = {
  individual: 'Individual Health Insurance',
  family: 'Family Floater',
  senior: 'Senior Citizen Insurance',
  critical: 'Critical Illness Cover',
  government: 'Government Health Schemes',
  topup: 'Top-up Plans',
};

function calculateAge(dateOfBirth: string) {
  const birthDate = new Date(`${dateOfBirth}T00:00:00`);
  if (!Number.isFinite(birthDate.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const birthdayThisYear = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
  if (birthdayThisYear > today) age -= 1;
  return age >= 0 && age <= 120 ? age : null;
}

function isCriticalAgeEligible(age: number | null) {
  return age !== null && age >= 18 && age <= 65;
}

export function HealthInsurancePage() {
  const { user } = useAuth();
  const [age, setAge] = useState<number | ''>('');
  const [profileConditions, setProfileConditions] = useState<string[]>([]);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedType, setSelectedType] = useState<InsuranceType | 'all'>('all');
  const [budget, setBudget] = useState<number | ''>('');
  const [minimumCover, setMinimumCover] = useState<number | ''>('');

  const loadProfile = useCallback(async () => {
    if (!user) return;
    setErrorMessage('');
    const { data, error } = await supabase
      .from('profiles')
      .select('date_of_birth, chronic_conditions')
      .eq('id', user.id)
      .maybeSingle();

    if (error) {
      setErrorMessage(error.message);
    } else {
      setProfileLoaded(true);
      if (data?.date_of_birth) {
        const profileAge = calculateAge(data.date_of_birth);
        if (profileAge !== null) setAge(profileAge);
      }
      setProfileConditions(data?.chronic_conditions || []);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const numericAge = age === '' ? null : age;
  const filteredOptions = useMemo(() => options.filter((option) => {
    if (selectedType !== 'all' && option.type !== selectedType) return false;
    if (numericAge !== null && option.type === 'critical' && !isCriticalAgeEligible(numericAge)) return false;
    if (budget !== '' && (option.annualPremium === null || option.annualPremium > budget)) return false;
    if (
      minimumCover !== '' &&
      (option.verifiedCoverMax === null || option.verifiedCoverMax < minimumCover)
    ) return false;
    return true;
  }), [budget, minimumCover, numericAge, selectedType]);

  const recommendationMessages = useMemo(() => {
    const messages: string[] = [];
    if (numericAge === null) {
      messages.push('Add or enter your age to see age-based guidance. No age was inferred.');
    } else if (numericAge >= 60) {
      messages.push('At 60 or older, a senior-focused category may be worth comparing. Insurer entry-age rules, co-payments, and medical assessment vary.');
    } else if (isCriticalAgeEligible(numericAge)) {
      messages.push('Your age falls within the 18–65 entry-age band published for the linked Star Critical Illness Multipay product. This does not confirm acceptance or suitability.');
    } else {
      messages.push('Verify age limits directly for each product; the linked critical-illness product lists an 18–65 entry-age band.');
    }

    if (profileConditions.length > 0) {
      messages.push(`Your saved profile lists ${profileConditions.join(', ')}. Disclose these accurately to insurers and compare their written pre-existing-condition terms and waiting periods.`);
    } else if (profileLoaded) {
      messages.push('No chronic conditions are listed in your saved profile. This is not a substitute for a complete health disclosure to an insurer.');
    }

    messages.push('Your profile does not include household members or an insurance budget; compare individual and family options based on the people you intend to insure.');
    return messages;
  }, [numericAge, profileConditions, profileLoaded]);

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-success" role="status">
          <span className="visually-hidden">Loading health profile</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4">
        <h2 className="fw-bold mb-1" style={{ color: '#1b4332' }}>Health Insurance Recommendations</h2>
        <p className="text-muted mb-0">
          Compare insurance categories using provider information and your saved health profile.
        </p>
      </div>

      {errorMessage && <div className="alert alert-danger" role="alert">{errorMessage}</div>}

      <div className="alert alert-warning border-0 shadow-sm" role="note">
        <strong>Important:</strong> Premiums are personalized and are not shown as estimates here because no comparable, verified quotes are available. Coverage, waiting periods, exclusions, and eligibility depend on the current policy wording and insurer assessment. Recommendations are informational only; they do not guarantee policy issuance, approval, or claim acceptance.
      </div>

      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <div className="d-flex align-items-center gap-2 mb-3">
            <HeartPulse size={20} color="#16735b" />
            <h5 className="fw-bold mb-0" style={{ color: '#1b4332' }}>Personalized considerations</h5>
          </div>
          <ul className="mb-0 ps-3">
            {recommendationMessages.map((message) => <li className="mb-2" key={message}>{message}</li>)}
          </ul>
        </div>
      </div>

      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <h5 className="fw-bold mb-3" style={{ color: '#1b4332' }}>Filter options</h5>
          <div className="row g-3">
            <div className="col-12 col-md-6 col-xl-3">
              <label className="form-label small fw-semibold" htmlFor="insurance-age">Age of person to insure (years)</label>
              <input
                className="form-control"
                id="insurance-age"
                type="number"
                min="0"
                max="120"
                step="1"
                value={age}
                placeholder="Enter age"
                onChange={(event) => {
                  const value = event.target.value;
                  setAge(value === '' ? '' : Math.floor(Math.min(120, Math.max(0, Number(value)))));
                }}
              />
              <small className="text-muted">Prefilled from your saved date of birth when available; change it for another person.</small>
            </div>
            <div className="col-12 col-md-6 col-xl-3">
              <label className="form-label small fw-semibold" htmlFor="insurance-budget">Maximum annual premium (₹)</label>
              <input
                className="form-control"
                id="insurance-budget"
                type="number"
                min="0"
                step="1000"
                value={budget}
                placeholder="Any budget"
                onChange={(event) => setBudget(event.target.value === '' ? '' : Math.max(0, Number(event.target.value)))}
              />
              <small className="text-muted">Options without a verified quote cannot match this filter.</small>
            </div>
            <div className="col-12 col-md-6 col-xl-3">
              <label className="form-label small fw-semibold" htmlFor="insurance-coverage">Minimum verified cover (₹)</label>
              <select
                className="form-select"
                id="insurance-coverage"
                value={minimumCover}
                onChange={(event) => setMinimumCover(event.target.value === '' ? '' : Number(event.target.value))}
              >
                <option value="">Any cover</option>
                <option value="500000">₹5 lakh</option>
                <option value="1000000">₹10 lakh</option>
                <option value="2500000">₹25 lakh</option>
                <option value="5000000">₹50 lakh</option>
                <option value="10000000">₹1 crore</option>
              </select>
              <small className="text-muted">Unpublished limits are not assumed.</small>
            </div>
            <div className="col-12 col-md-6 col-xl-3">
              <label className="form-label small fw-semibold" htmlFor="insurance-type">Insurance type</label>
              <select
                className="form-select"
                id="insurance-type"
                value={selectedType}
                onChange={(event) => setSelectedType(event.target.value as InsuranceType | 'all')}
              >
                <option value="all">All types</option>
                {Object.entries(typeLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {filteredOptions.length === 0 ? (
        <div className="card border-0 shadow-sm">
          <div className="card-body text-center text-muted py-5">
            <ShieldCheck size={38} className="mb-2 opacity-50" />
            <p className="mb-1 fw-semibold">No options match these filters with currently verified data.</p>
            <p className="small mb-0">Clear the budget or coverage filter to see categories with provider-specific details pending verification.</p>
          </div>
        </div>
      ) : (
        <div className="row g-3">
          {filteredOptions.map((option) => (
            <div className="col-12 col-xl-6" key={option.type}>
              <article className="card border-0 shadow-sm h-100">
                <div className="card-body p-4">
                  <div className="d-flex justify-content-between align-items-start gap-3 mb-3">
                    <div>
                      <span className="badge rounded-pill text-bg-success-subtle text-success mb-2">
                        {typeLabels[option.type]}
                      </span>
                      <h5 className="fw-bold mb-0" style={{ color: '#1b4332' }}>{option.name}</h5>
                    </div>
                    {option.verifiedProduct && (
                      <span className="badge text-bg-light border text-success">Verified product detail</span>
                    )}
                  </div>

                  <dl className="row small mb-3">
                    <dt className="col-sm-4">Coverage</dt>
                    <dd className="col-sm-8">{option.coverage}</dd>
                    <dt className="col-sm-4">Estimated premium</dt>
                    <dd className="col-sm-8">
                      {option.annualPremium === null
                        ? 'No verified estimate available — request an official quote.'
                        : `About ₹${option.annualPremium.toLocaleString('en-IN')} per year (estimate)`}
                    </dd>
                    <dt className="col-sm-4">Benefits</dt>
                    <dd className="col-sm-8">{option.benefits}</dd>
                    <dt className="col-sm-4">Eligibility</dt>
                    <dd className="col-sm-8">{option.eligibility}</dd>
                    <dt className="col-sm-4">Waiting period</dt>
                    <dd className="col-sm-8">{option.waitingPeriod}</dd>
                    <dt className="col-sm-4">Exclusions</dt>
                    <dd className="col-sm-8 mb-0">{option.exclusions}</dd>
                  </dl>

                  <a
                    className="btn btn-outline-success btn-sm"
                    href={option.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {option.sourceLabel} <ExternalLink size={14} className="ms-1" />
                  </a>
                  <small className="d-block text-muted mt-2">
                    Official source: {option.provider}. Verify current product documents, price, and terms before purchase.
                  </small>
                </div>
              </article>
            </div>
          ))}
        </div>
      )}

      <p className="small text-muted mt-4">
        Source pages checked October 12, 2026. Product terms may change; the insurer’s current policy wording and official scheme portals take precedence. The app does not determine eligibility, provide insurance underwriting, or predict claims.
      </p>
    </div>
  );
}
