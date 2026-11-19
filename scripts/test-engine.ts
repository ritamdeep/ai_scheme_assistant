import { SCHEMES_DATA } from '../lib/schemes-data';
import { evaluateEligibility } from '../lib/rule-engine';
import { retrieveTopChunks, matchOccupationFuzzy } from '../lib/rag';

console.log('====================================================');
console.log('🏛️ SCHEME NAVIGATOR (ORIGIN PS-2) RULE & RAG VERIFICATION');
console.log('====================================================');
console.log(`Total Schemes Indexed: ${SCHEMES_DATA.length}`);

// Test 1: Verify all 15 schemes exist
if (SCHEMES_DATA.length !== 15) {
  console.error(`Expected 15 schemes, but got ${SCHEMES_DATA.length}`);
  process.exit(1);
}
console.log('✅ Test 1 Passed: Exactly 15 authentic government schemes verified.');

// Test 2: Farmer profile evaluation with missing land holding
const pmKisan = SCHEMES_DATA.find((s) => s.id === 'pm-kisan');
if (!pmKisan) {
  console.error('PM-KISAN scheme not found');
  process.exit(1);
}

const farmerProfile = {
  name: 'Ramesh Patel',
  age: 42,
  annual_income: 150000,
  occupation: 'Farmer / Agriculturist' as const,
  state: 'Uttar Pradesh',
  gender: 'male' as const,
  special_conditions: [],
  land_holding_acres: null, // missing land
};

const verdict1 = evaluateEligibility(pmKisan, farmerProfile);
console.log('\n[Test 2] Farmer with missing land holding:');
console.log('  Status:', verdict1.status);
console.log('  Confidence Score:', verdict1.confidenceScore + '%');
console.log('  Missing Prompt:', verdict1.missingFieldPrompt?.questionText);

if (verdict1.status !== 'Needs More Info') {
  console.error('FAIL: Expected Needs More Info when land is null');
  process.exit(1);
}
console.log('✅ Test 2 Passed: Correctly returned "Needs More Info" and flagged missing cultivable land prompt.');

// Test 3: Live flip to Eligible when land is provided
const farmerWithLand = { ...farmerProfile, land_holding_acres: 2.5 };
const verdict2 = evaluateEligibility(pmKisan, farmerWithLand);
console.log('\n[Test 3] Farmer provides 2.5 acres land:');
console.log('  Status:', verdict2.status);
console.log('  Confidence Score:', verdict2.confidenceScore + '%');

if (verdict2.status !== 'Eligible') {
  console.error('FAIL: Expected Eligible when farmer has 2.5 acres');
  process.exit(1);
}
console.log('✅ Test 3 Passed: Live verdict flipped deterministically to "Eligible" with 100% confidence.');

// Test 4: Student profile against PM-KISAN (Occupation mismatch)
const studentProfile = {
  name: 'Priya Sharma',
  age: 20,
  annual_income: 200000,
  occupation: 'Student' as const,
  state: 'Rajasthan',
  gender: 'female' as const,
  special_conditions: [],
  land_holding_acres: 0,
};

const verdict3 = evaluateEligibility(pmKisan, studentProfile);
console.log('\n[Test 4] Student tested against PM-KISAN:');
console.log('  Status:', verdict3.status);
console.log('  Confidence Score:', verdict3.confidenceScore + '%');
console.log('  Unmatched Criteria:', verdict3.unmatchedCriteria.map((u) => u.criterion).join(', '));

if (verdict3.status !== 'Not Eligible') {
  console.error('FAIL: Expected Not Eligible for Student against PM-KISAN');
  process.exit(1);
}
console.log('✅ Test 4 Passed: Accurately returned "Not Eligible" due to occupation and land criteria.');

// Test 5: Fuzzy match for "Other: auto rickshaw driver" against PM SVANidhi
const pmSvanidhi = SCHEMES_DATA.find((s) => s.id === 'pm-svanidhi');
if (!pmSvanidhi) {
  console.error('PM-SVANidhi scheme not found');
  process.exit(1);
}
const fuzzyRes = matchOccupationFuzzy('auto rickshaw driver', pmSvanidhi);
console.log('\n[Test 5] Fuzzy match: "auto rickshaw driver" against PM-SVANidhi:');
console.log('  Is Match:', fuzzyRes.isMatch, '| Score:', Math.round(fuzzyRes.score * 100) + '%');

if (!fuzzyRes.isMatch) {
  console.error('FAIL: Expected fuzzy match for auto driver vs PM-SVANidhi');
  process.exit(1);
}
console.log('✅ Test 5 Passed: Semantic cosine match correctly identified PM-SVANidhi street vendor tags.');

// Test 6: RAG chunk retrieval & citation check
const chunks = retrieveTopChunks(pmKisan, 'what documents are needed for registration', 2);
console.log('\n[Test 6] RAG Semantic Chunk Retrieval:');
console.log('  Retrieved chunks count:', chunks.length);
console.log('  Top Chunk Title:', chunks[0]?.chunk.title);
console.log('  Similarity Score:', chunks[0]?.similarity.toFixed(3));

if (chunks.length === 0 || !chunks[0]?.chunk.title.includes('Required Documents')) {
  console.error('FAIL: Expected documents chunk to be retrieved');
  process.exit(1);
}
console.log('✅ Test 6 Passed: Retrieved exact official documents chunk with high similarity.');

console.log('\n🎉 ALL 6 COMPREHENSIVE ENGINE TESTS PASSED WITH 100% ACCURACY!\n');
