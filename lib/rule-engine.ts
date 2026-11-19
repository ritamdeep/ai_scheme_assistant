import { Scheme, UserProfile, EligibilityVerdict, CriterionResult, CriterionMatchStatus } from './types';

export function evaluateEligibility(
  scheme: Scheme,
  profile: UserProfile,
  options?: { isFuzzyOccupationMatch?: boolean }
): EligibilityVerdict {
  const criteriaResults: CriterionResult[] = [];
  const elig = scheme.eligibility;

  // 1. Occupation Check
  if (elig.occupation && elig.occupation.length > 0) {
    if (elig.occupation.includes('any')) {
      criteriaResults.push({
        criterion: 'Occupation',
        status: 'match',
        userValue: profile.occupation,
        requiredValue: 'Open to all occupations',
        reason: 'This scheme is universally open across all occupational categories.',
      });
    } else if (profile.occupation === 'Other') {
      if (options?.isFuzzyOccupationMatch) {
        criteriaResults.push({
          criterion: 'Occupation',
          status: 'unknown',
          userValue: profile.occupation_raw || 'Other',
          requiredValue: elig.occupation.join(' / '),
          reason: `Self-declared as "${profile.occupation_raw || 'Other'}". Possible semantic match found with scheme requirements; verification required.`,
        });
      } else {
        criteriaResults.push({
          criterion: 'Occupation',
          status: 'no_match',
          userValue: profile.occupation_raw || 'Other',
          requiredValue: elig.occupation.join(' / '),
          reason: `Occupation entered does not directly match the scheme category (${elig.occupation.join(', ')}).`,
        });
      }
    } else if (elig.occupation.includes(profile.occupation)) {
      criteriaResults.push({
        criterion: 'Occupation',
        status: 'match',
        userValue: profile.occupation,
        requiredValue: elig.occupation.join(' / '),
        reason: `Your registered occupation (${profile.occupation}) directly matches the required target group.`,
      });
    } else {
      criteriaResults.push({
        criterion: 'Occupation',
        status: 'no_match',
        userValue: profile.occupation,
        requiredValue: elig.occupation.join(' / '),
        reason: `Scheme is specifically designated for ${elig.occupation.join(' / ')}, but your profile is registered as ${profile.occupation}.`,
      });
    }
  }

  // 2. Age Checks (Min & Max)
  if (elig.age_min !== null && elig.age_min !== undefined) {
    if (profile.age === null || profile.age === undefined) {
      criteriaResults.push({
        criterion: 'Minimum Age',
        status: 'unknown',
        userValue: null,
        requiredValue: `At least ${elig.age_min} years`,
        reason: `Minimum required age is ${elig.age_min} years. Please provide your age.`,
      });
    } else if (profile.age >= elig.age_min) {
      criteriaResults.push({
        criterion: 'Minimum Age',
        status: 'match',
        userValue: `${profile.age} years`,
        requiredValue: `>= ${elig.age_min} years`,
        reason: `Your age (${profile.age}) meets or exceeds the minimum age requirement (${elig.age_min} years).`,
      });
    } else {
      criteriaResults.push({
        criterion: 'Minimum Age',
        status: 'no_match',
        userValue: `${profile.age} years`,
        requiredValue: `>= ${elig.age_min} years`,
        reason: `Scheme requires minimum age of ${elig.age_min} years. You are ${profile.age}.`,
      });
    }
  }

  if (elig.age_max !== null && elig.age_max !== undefined) {
    if (profile.age === null || profile.age === undefined) {
      // already counted in age_min if both unknown, or add if age_min was null
      if (elig.age_min === null || elig.age_min === undefined) {
        criteriaResults.push({
          criterion: 'Maximum Age',
          status: 'unknown',
          userValue: null,
          requiredValue: `At most ${elig.age_max} years`,
          reason: `Maximum eligible age is ${elig.age_max} years. Please provide your age.`,
        });
      }
    } else if (profile.age <= elig.age_max) {
      criteriaResults.push({
        criterion: 'Maximum Age',
        status: 'match',
        userValue: `${profile.age} years`,
        requiredValue: `<= ${elig.age_max} years`,
        reason: `Your age (${profile.age}) is within the upper age limit (${elig.age_max} years).`,
      });
    } else {
      criteriaResults.push({
        criterion: 'Maximum Age',
        status: 'no_match',
        userValue: `${profile.age} years`,
        requiredValue: `<= ${elig.age_max} years`,
        reason: `Scheme upper age limit is ${elig.age_max} years. You are ${profile.age}.`,
      });
    }
  }

  // 3. Income Max Check
  if (elig.income_max !== null && elig.income_max !== undefined) {
    if (profile.annual_income === null || profile.annual_income === undefined) {
      criteriaResults.push({
        criterion: 'Income Ceiling',
        status: 'unknown',
        userValue: null,
        requiredValue: `Up to ₹${elig.income_max.toLocaleString('en-IN')}/year`,
        reason: `Requires annual household income up to ₹${elig.income_max.toLocaleString('en-IN')}. Please confirm your income.`,
      });
    } else if (profile.annual_income <= elig.income_max) {
      criteriaResults.push({
        criterion: 'Income Ceiling',
        status: 'match',
        userValue: `₹${profile.annual_income.toLocaleString('en-IN')}/year`,
        requiredValue: `<= ₹${elig.income_max.toLocaleString('en-IN')}/year`,
        reason: `Your income of ₹${profile.annual_income.toLocaleString('en-IN')} is within the scheme ceiling (₹${elig.income_max.toLocaleString('en-IN')}).`,
      });
    } else {
      criteriaResults.push({
        criterion: 'Income Ceiling',
        status: 'no_match',
        userValue: `₹${profile.annual_income.toLocaleString('en-IN')}/year`,
        requiredValue: `<= ₹${elig.income_max.toLocaleString('en-IN')}/year`,
        reason: `Your annual income of ₹${profile.annual_income.toLocaleString('en-IN')} exceeds the maximum allowed ceiling (₹${elig.income_max.toLocaleString('en-IN')}).`,
      });
    }
  }

  // 4. Gender Check
  if (elig.gender && elig.gender !== 'any') {
    if (!profile.gender || profile.gender === 'any') {
      criteriaResults.push({
        criterion: 'Gender Specification',
        status: 'unknown',
        userValue: profile.gender,
        requiredValue: elig.gender,
        reason: `This scheme is exclusively reserved for ${elig.gender} beneficiaries.`,
      });
    } else if (profile.gender.toLowerCase() === elig.gender.toLowerCase()) {
      criteriaResults.push({
        criterion: 'Gender Specification',
        status: 'match',
        userValue: profile.gender,
        requiredValue: elig.gender,
        reason: `Applicant gender (${profile.gender}) qualifies for this gender-targeted initiative.`,
      });
    } else {
      criteriaResults.push({
        criterion: 'Gender Specification',
        status: 'no_match',
        userValue: profile.gender,
        requiredValue: elig.gender,
        reason: `This scheme is solely for ${elig.gender} applicants.`,
      });
    }
  }

  // 5. Land Holding Check (PM-KISAN specific)
  if (elig.land_holding_max_acres !== null && elig.land_holding_max_acres !== undefined) {
    if (profile.land_holding_acres === null || profile.land_holding_acres === undefined) {
      criteriaResults.push({
        criterion: 'Cultivable Land Holding',
        status: 'unknown',
        userValue: null,
        requiredValue: `Up to ${elig.land_holding_max_acres} acres of cultivable land`,
        reason: 'Requires confirmation of your family cultivable landholding in acres.',
      });
    } else if (profile.land_holding_acres > 0 && profile.land_holding_acres <= elig.land_holding_max_acres) {
      criteriaResults.push({
        criterion: 'Cultivable Land Holding',
        status: 'match',
        userValue: `${profile.land_holding_acres} acres`,
        requiredValue: `<= ${elig.land_holding_max_acres} acres`,
        reason: `Your registered land holding (${profile.land_holding_acres} acres) qualifies within the small & marginal farmer limit.`,
      });
    } else if (profile.land_holding_acres === 0) {
      criteriaResults.push({
        criterion: 'Cultivable Land Holding',
        status: 'no_match',
        userValue: '0 acres (Landless)',
        requiredValue: `Own cultivable land up to ${elig.land_holding_max_acres} acres`,
        reason: 'PM-KISAN requires cultivable landholding registered in your name.',
      });
    } else {
      criteriaResults.push({
        criterion: 'Cultivable Land Holding',
        status: 'no_match',
        userValue: `${profile.land_holding_acres} acres`,
        requiredValue: `<= ${elig.land_holding_max_acres} acres`,
        reason: `Your land holding (${profile.land_holding_acres} acres) exceeds the typical small & marginal land limit.`,
      });
    }
  }

  // 6. Disability Check (ADIP Scheme specific)
  if (elig.disability_min_percent !== null && elig.disability_min_percent !== undefined) {
    const hasDisabilityCondition = profile.special_conditions.some((c) =>
      c.toLowerCase().includes('disab') || c.toLowerCase().includes('divyang')
    );
    if (!hasDisabilityCondition) {
      criteriaResults.push({
        criterion: 'Disability Certification',
        status: 'unknown',
        userValue: 'Not specified in profile',
        requiredValue: `Minimum ${elig.disability_min_percent}% certified disability`,
        reason: 'Requires a valid disability certificate showing 40% or higher disability.',
      });
    } else {
      criteriaResults.push({
        criterion: 'Disability Certification',
        status: 'match',
        userValue: 'Certified Divyangjan (40%+)',
        requiredValue: `>= ${elig.disability_min_percent}% certified disability`,
        reason: 'Your profile satisfies the disability certification requirement for assistive aids.',
      });
    }
  }

  // 7. BPL / Deprivation Check (IGNOAPS, PM-JAY)
  if (elig.bpl_required) {
    const hasBplCondition = profile.special_conditions.some((c) =>
      c.toLowerCase().includes('bpl') || c.toLowerCase().includes('poverty') || c.toLowerCase().includes('ration')
    );
    if (!hasBplCondition) {
      criteriaResults.push({
        criterion: 'BPL / Low Income Household Status',
        status: 'unknown',
        userValue: 'Not declared',
        requiredValue: 'Below Poverty Line (BPL) or SECC 2011 Deprived Household',
        reason: 'Requires Below Poverty Line (BPL) card or Antyodaya/Priority Ration Card.',
      });
    } else {
      criteriaResults.push({
        criterion: 'BPL / Low Income Household Status',
        status: 'match',
        userValue: 'BPL / Priority Household Declared',
        requiredValue: 'BPL / SECC Deprived',
        reason: 'Your BPL / Priority Ration status satisfies the economic targeting criteria.',
      });
    }
  }

  // 8. State / Geographic Check
  if (elig.state && elig.state !== 'All India' && elig.state !== 'any') {
    if (!profile.state) {
      criteriaResults.push({
        criterion: 'State Domicile',
        status: 'unknown',
        userValue: null,
        requiredValue: elig.state,
        reason: `Requires residence in ${elig.state}.`,
      });
    } else if (profile.state.toLowerCase() === elig.state.toLowerCase()) {
      criteriaResults.push({
        criterion: 'State Domicile',
        status: 'match',
        userValue: profile.state,
        requiredValue: elig.state,
        reason: `Applicant is domiciled in ${profile.state}.`,
      });
    } else {
      criteriaResults.push({
        criterion: 'State Domicile',
        status: 'no_match',
        userValue: profile.state,
        requiredValue: elig.state,
        reason: `Scheme is only active in ${elig.state}, but your profile state is ${profile.state}.`,
      });
    }
  } else {
    criteriaResults.push({
      criterion: 'Geographic Scope',
      status: 'match',
      userValue: profile.state || 'All India',
      requiredValue: 'All India (Central Sector / Centrally Sponsored)',
      reason: 'This scheme is applicable across all Indian States & Union Territories.',
    });
  }

  // Group by status
  const matched = criteriaResults.filter((c) => c.status === 'match');
  const unmatched = criteriaResults.filter((c) => c.status === 'no_match');
  const unknown = criteriaResults.filter((c) => c.status === 'unknown');

  // Confidence calculation: matched criteria / total evaluable criteria
  const total = criteriaResults.length;
  let confidenceScore = 0;
  if (total > 0) {
    if (unmatched.length > 0) {
      // If there is a hard mismatch, confidence is heavily dampened but transparently calculated
      confidenceScore = Math.max(10, Math.round((matched.length / total) * 40));
    } else {
      confidenceScore = Math.round((matched.length / total) * 100);
    }
  }

  // Determine overall status
  let status: 'Eligible' | 'Not Eligible' | 'Needs More Info';
  let summaryReason = '';

  if (unmatched.length > 0) {
    status = 'Not Eligible';
    summaryReason = `Unmet criteria: ${unmatched.map((u) => u.criterion).join(', ')}.`;
  } else if (unknown.length > 0) {
    status = 'Needs More Info';
    summaryReason = `Verification pending: ${unknown.map((u) => u.criterion).join(', ')}.`;
  } else {
    status = 'Eligible';
    summaryReason = 'All mandatory criteria verified and matched against official guidelines.';
  }

  // Identify first missing field prompt for targeted conversational follow-up
  let missingFieldPrompt: { fieldKey: keyof UserProfile; questionText: string } | null = null;
  if (unknown.length > 0) {
    const firstUnknown = unknown[0];
    if (firstUnknown.criterion === 'Cultivable Land Holding') {
      missingFieldPrompt = {
        fieldKey: 'land_holding_acres',
        questionText: 'Do you or your family own cultivable agricultural land, and if so, how many acres (e.g., 2.5 acres)?',
      };
    } else if (firstUnknown.criterion.includes('Age')) {
      missingFieldPrompt = {
        fieldKey: 'age',
        questionText: 'Could you please specify your current age to verify age eligibility for this scheme?',
      };
    } else if (firstUnknown.criterion.includes('Income')) {
      missingFieldPrompt = {
        fieldKey: 'annual_income',
        questionText: `What is your approximate annual household income (e.g., ₹1,50,000)?`,
      };
    } else if (firstUnknown.criterion.includes('BPL')) {
      missingFieldPrompt = {
        fieldKey: 'special_conditions',
        questionText: 'Do you hold a Below Poverty Line (BPL) card or Antyodaya/Priority Ration Card?',
      };
    } else if (firstUnknown.criterion.includes('Disability')) {
      missingFieldPrompt = {
        fieldKey: 'special_conditions',
        questionText: 'Do you hold an official Disability Certificate or UDID card with 40% or greater disability?',
      };
    }
  }

  return {
    status,
    confidenceScore,
    matchedCriteria: matched,
    unmatchedCriteria: unmatched,
    unknownCriteria: unknown,
    missingFieldPrompt,
    summaryReason,
    isFuzzySuggestion: options?.isFuzzyOccupationMatch,
  };
}

export function rankSchemesForProfile(
  schemes: Scheme[],
  profile: UserProfile,
  fuzzyMatches?: Record<string, boolean>
): Array<{ scheme: Scheme; verdict: EligibilityVerdict }> {
  return schemes
    .map((scheme) => {
      const isFuzzy = fuzzyMatches?.[scheme.id] || false;
      const verdict = evaluateEligibility(scheme, profile, { isFuzzyOccupationMatch: isFuzzy });
      return { scheme, verdict };
    })
    .sort((a, b) => {
      // 1. Sort by Eligible first, then Needs More Info, then Not Eligible
      const statusOrder = { Eligible: 3, 'Needs More Info': 2, 'Not Eligible': 1 };
      const diff = statusOrder[b.verdict.status] - statusOrder[a.verdict.status];
      if (diff !== 0) return diff;

      // 2. Sort by confidence score descending
      return b.verdict.confidenceScore - a.verdict.confidenceScore;
    });
}
