import { Scheme } from './types';

export const SCHEMES_DATA: Scheme[] = [
  {
    id: 'pm-kisan',
    name: 'Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)',
    hindi_name: 'प्रधानमंत्री किसान सम्मान निधि',
    ministry: 'Ministry of Agriculture & Farmers Welfare',
    category: 'Agriculture & Farming',
    benefit_summary: 'Direct income support of ₹6,000 per year paid in three equal 4-monthly installments into bank accounts via DBT.',
    benefit_amount: '₹6,000 / year',
    eligibility: {
      occupation: ['Farmer / Agriculturist'],
      age_min: 18,
      age_max: null,
      income_max: null,
      state: 'All India',
      gender: 'any',
      land_holding_max_acres: 5,
      bpl_required: false,
    },
    occupation_tags: ['farmer', 'kisan', 'agriculturist', 'cultivator', 'grower', 'landholder', 'krishi', 'horticulturist', 'tenant farmer', 'small farmer'],
    source_text: `Official PM-KISAN Scheme Guidelines (myscheme.gov.in & pmkisan.gov.in):
Pradhan Mantri Kisan Samman Nidhi is a Central Sector Scheme launched by the Government of India to augment the income of all landholding farmers' families in the country.
Under the Scheme, direct financial assistance of Rs. 6000/- per annum is provided to all eligible landholding farmers families across the country, subject to certain exclusion criteria relating to higher income brackets.
The financial benefit is directly credited into the bank accounts of the beneficiaries in three equal 4-monthly installments of Rs. 2000/- each via Aadhaar-seeded Public Financial Management System (PFMS).
Eligibility Criteria:
1. The scheme is open to all landholding farmer families who hold cultivable landholding in their names.
2. The beneficiary family comprises husband, wife, and minor children.
3. Land ownership documents must be up to date and verified in the State/UT land records database.
4. E-KYC is mandatory for all registered PM-KISAN beneficiaries.
Exclusions:
Institutional land holders, former and present holders of constitutional posts, former and present Ministers, MPs, MLAs, MLCs, Mayors, Chairpersons of District Panchayats, serving or retired officers and employees of Central/State Government Ministries and PSUs (except multi-tasking staff / Class IV / Group D), all superannuated/retired pensioners whose monthly pension is Rs. 10,000/- or more, persons who paid income tax in last assessment year, and professionals like Doctors, Engineers, Lawyers, Chartered Accountants, and Architects.
Required Documents:
Aadhaar Card, Land Record / RoR (Record of Rights / Khasra-Khatauni), Active Bank Account passbook (Aadhaar linked), Mobile Number.`,
    official_apply_url: 'https://pmkisan.gov.in',
    required_documents: ['Aadhaar Card', 'Land Ownership Records (RoR / 7/12 / Khasra)', 'Aadhaar-seeded Bank Account Passbook', 'Active Mobile Number'],
    last_verified: '2026-09-01',
  },
  {
    id: 'pmmsy',
    name: 'Pradhan Mantri Matsya Sampada Yojana (PMMSY)',
    hindi_name: 'प्रधानमंत्री मत्स्य संपदा योजना',
    ministry: 'Ministry of Fisheries, Animal Husbandry and Dairying',
    category: 'Agriculture & Farming',
    benefit_summary: 'Subsidies up to 40% (General) to 60% (Women, SC, ST) for modern fishing craft, safety gear, biofloc, cold storage, and aquaculture.',
    benefit_amount: '40% - 60% Project Cost Subsidy',
    eligibility: {
      occupation: ['Fisherman'],
      age_min: 18,
      age_max: 65,
      income_max: null,
      state: 'All India',
      gender: 'any',
      bpl_required: false,
    },
    occupation_tags: ['fisherman', 'fisherfolk', 'fisher', 'fish farmer', 'aquaculture', 'trawler worker', 'marine worker', 'boat operator', 'fish vendor', 'matsya'],
    source_text: `Official PMMSY Guidelines (pmmsy.dof.gov.in & myscheme.gov.in):
Pradhan Mantri Matsya Sampada Yojana (PMMSY) is a flagship scheme of the Department of Fisheries to address critical gaps in fish production and productivity, quality, technology, post-harvest infrastructure and management, and modernization of value chains.
The scheme aims to enhance fish production to 22 million metric tons, generate 55 lakh direct and indirect employment opportunities, and double fishers' and fish farmers' incomes.
Beneficiaries:
Fishers, Fish farmers, Fish workers, Fish vendors, Fisheries Development corporations, Self Help Groups (SHGs) and Joint Liability Groups (JLGs) in fisheries sector, Fisheries Cooperatives, and Entrepreneurs.
Financial Assistance Pattern:
For Individual / Group Beneficiaries:
- General category: Government financial assistance is 40% of the project cost (Central share + State share).
- SC, ST, and Women beneficiaries: Government financial assistance is up to 60% of the project cost.
Eligible Activities:
Purchase of new traditional/motorized fishing boats, biofloc aquaculture units, recirculatory aquaculture systems (RAS), ice plants and cold storage units, refrigerated transport vehicles, ornamental fish breeding, open sea cage culture, and deep sea fishing vessels.
Required Documents:
Aadhaar Card, Fishermen ID / Registration Card or Coastal Biometric Card, Bank Passbook, Land/Water lease or ownership document (for aquaculture ponds), Detailed Project Report (DPR).`,
    official_apply_url: 'https://pmmsy.dof.gov.in',
    required_documents: ['Aadhaar Card', 'Fisherman Registration ID / Coastal Biometric Card', 'Bank Account details', 'Pond Lease or Ownership Document (if aquaculture)'],
    last_verified: '2026-09-01',
  },
  {
    id: 'pm-svanidhi',
    name: "PM Street Vendor's AtmaNirbhar Nidhi (PM SVANidhi)",
    hindi_name: 'पीएम स्ट्रीट वेंडर्स आत्मनिर्भर निधि',
    ministry: 'Ministry of Housing and Urban Affairs',
    category: 'Business & MSME',
    benefit_summary: 'Collateral-free working capital micro-credit starting at ₹10,000, scaling to ₹20,000 and ₹50,000, with 7% interest subsidy and cashback on digital transactions.',
    benefit_amount: '₹10,000 to ₹50,000 Collateral-free Loan',
    eligibility: {
      occupation: ['Self-Employed / Street Vendor'],
      age_min: 18,
      age_max: null,
      income_max: null,
      state: 'All India',
      gender: 'any',
      bpl_required: false,
    },
    occupation_tags: ['street vendor', 'hawker', 'thela wala', 'vendor', 'cart puller', 'roadside seller', 'petty trader', 'auto driver', 'rickshaw puller', 'daily seller', 'self employed'],
    source_text: `Official PM SVANidhi Guidelines (pmsvanidhi.mohua.gov.in & myscheme.gov.in):
PM SVANidhi is a central sector scheme launched to provide affordable working capital loans to urban street vendors who were severely impacted during lockdowns and economic shocks.
Key Scheme Benefits:
1. First Tranche: Working capital loan up to Rs. 10,000/- with tenure of 1 year.
2. Second Tranche: On timely repayment of 1st loan, eligible for 2nd loan up to Rs. 20,000/-.
3. Third Tranche: On timely repayment of 2nd loan, eligible for 3rd loan up to Rs. 50,000/-.
4. Interest Subsidy: 7% per annum interest subsidy credited directly to the vendor's bank account on a quarterly basis.
5. Digital Incentive: Monthly cashback up to Rs. 100/- for accepting digital payments using BHIM, UPI, Paytm, PhonePe, or Google Pay.
Eligibility Criteria:
- Vendors possessing Certificate of Vending / Identity Card issued by Urban Local Bodies (ULBs).
- Vendors who have been identified in the survey but have not been issued Certificate of Vending / Identity Card (can apply using Provisional Vending Certificate).
- Street vendors left out of ULB-led identification survey or who started vending after completion of the survey can obtain a Letter of Recommendation (LoR) from ULB / Town Vending Committee (TVC).
- Vendors of surrounding peri-urban/rural areas vending in the geographical limits of the ULBs.
Required Documents:
Aadhaar Card, Vending Certificate / ID Card or Letter of Recommendation (LoR) from Municipality, Bank Account Details, Mobile Number linked with Aadhaar.`,
    official_apply_url: 'https://pmsvanidhi.mohua.gov.in',
    required_documents: ['Aadhaar Card', 'Vending Certificate / Urban Local Body Identity Card or Letter of Recommendation (LoR)', 'Bank Account Passbook'],
    last_verified: '2026-09-01',
  },
  {
    id: 'pmegp',
    name: 'Prime Minister’s Employment Generation Programme (PMEGP)',
    hindi_name: 'प्रधानमंत्री रोजगार सृजन कार्यक्रम',
    ministry: 'Ministry of Micro, Small and Medium Enterprises (MSME)',
    category: 'Business & MSME',
    benefit_summary: 'Government capital subsidy (Margin Money) of 15% to 35% on bank-financed micro-enterprises up to ₹50 Lakhs (Manufacturing) or ₹20 Lakhs (Services).',
    benefit_amount: 'Up to 35% Capital Subsidy (₹17.5 Lakh max subsidy)',
    eligibility: {
      occupation: ['Entrepreneur / Small Business Owner'],
      age_min: 18,
      age_max: null,
      income_max: null,
      state: 'All India',
      gender: 'any',
      min_education: '8th Standard Pass (for projects above ₹10L in Mfg / ₹5L in Service)',
    },
    occupation_tags: ['entrepreneur', 'business owner', 'shopkeeper', 'manufacturer', 'service provider', 'start up founder', 'small business', 'msme', 'workshop owner', 'trader'],
    source_text: `Official PMEGP Scheme Guidelines (kviconline.gov.in & myscheme.gov.in):
Prime Minister’s Employment Generation Programme (PMEGP) is a credit-linked subsidy programme administered by the Ministry of MSME through Khadi and Village Industries Commission (KVIC) as the national nodal agency.
Objectives:
To generate continuous and sustainable employment opportunities in rural and urban areas through setting up of new micro-enterprises, small manufacturing units, and service ventures.
Financial Quantum:
- Maximum project cost eligible for subsidy in Manufacturing Sector: Rs. 50 Lakhs.
- Maximum project cost eligible for subsidy in Business / Service Sector: Rs. 20 Lakhs.
Margin Money Subsidy Rates:
- General Category: Urban project: 15% subsidy; Rural project: 25% subsidy. Beneficiary own contribution: 10%.
- Special Category (SC / ST / OBC / Minorities / Women / Ex-servicemen / Differently-abled / NER / Border areas): Urban project: 25% subsidy; Rural project: 35% subsidy. Beneficiary own contribution: 5%.
Eligibility:
1. Any individual above 18 years of age.
2. For setting up of project costing above Rs. 10 lakh in the manufacturing sector and above Rs. 5 lakh in the business/service sector, the beneficiary should possess at least VIII standard pass educational qualification.
3. Only new projects are eligible for assistance under PMEGP.
Required Documents:
Aadhaar Card, Passport photo, Educational Qualification Certificate (8th / 10th / Degree), Caste/Special Category Certificate (if claiming 25-35%), Detailed Project Profile / Business Plan, Rural Area Certificate (from Tehsildar/Gram Panchayat if applicable).`,
    official_apply_url: 'https://www.kviconline.gov.in/pmegpeportal',
    required_documents: ['Aadhaar Card', 'Project Report / Business Proposal', '8th Pass or Higher Education Marksheet', 'Category / Caste Certificate (if applicable)', 'Bank Passbook'],
    last_verified: '2026-09-01',
  },
  {
    id: 'naps',
    name: 'National Apprenticeship Promotion Scheme (NAPS)',
    hindi_name: 'राष्ट्रीय शिक्षुता संवर्धन योजना',
    ministry: 'Ministry of Skill Development and Entrepreneurship',
    category: 'Jobs & Employment',
    benefit_summary: '25% stipend support (up to ₹1,500/month) paid directly to apprentices by Government of India, plus national on-the-job industrial skill training.',
    benefit_amount: 'Up to ₹1,500/month Govt Stipend Support',
    eligibility: {
      occupation: ['Unemployed / Job-Seeker'],
      age_min: 14,
      age_max: 35,
      income_max: null,
      state: 'All India',
      gender: 'any',
      min_education: '5th / 8th / 10th / 12th / ITI / Polytechnic / Graduate',
    },
    occupation_tags: ['unemployed', 'job seeker', 'youth', 'fresher', 'iti trainee', 'apprentice', 'intern', 'diploma holder', 'graduate', 'skill seeker'],
    source_text: `Official NAPS Guidelines (apprenticeshipindia.gov.in & myscheme.gov.in):
The National Apprenticeship Promotion Scheme (NAPS) was launched by the Government of India to promote apprenticeship training and incentivize employers to engage apprentices across manufacturing and service establishments.
Components of the Scheme:
1. Sharing of basic training cost in respect of apprentices who come without any formal training (up to Rs. 7,500 for 3 months / 500 hours).
2. Sharing of 25% of prescribed stipend subject to a maximum of Rs. 1,500 per month per apprentice directly transferred to the apprentice's bank account via Direct Benefit Transfer (DBT).
Eligibility for Apprentices:
- Candidate must be at least 14 years of age (18 years for hazardous industries).
- Candidate must possess minimum educational qualifications prescribed for the designated or optional trade (ranging from 5th class to ITI/Diploma/Graduate).
- Candidate must register on the Apprenticeship Portal (apprenticeshipindia.gov.in) with eKYC.
- Must not be currently employed or already completed apprenticeship in the same trade.
Required Documents:
Aadhaar Card, Educational Marksheets, Active Bank Account with Aadhaar mapping, Passport Size Photograph, Category Certificate (if applicable).`,
    official_apply_url: 'https://www.apprenticeshipindia.gov.in',
    required_documents: ['Aadhaar Card', 'Educational Certificate / ITI Marksheet', 'Aadhaar-linked Bank Account details', 'Resume / Bio-data'],
    last_verified: '2026-09-01',
  },
  {
    id: 'pm-usp-scholarship',
    name: 'PM-USP Central Sector Scheme of Scholarship for College and University Students',
    hindi_name: 'कॉलेज और विश्वविद्यालय के छात्रों के लिए केंद्रीय क्षेत्र छात्रवृत्ति योजना',
    ministry: 'Ministry of Education',
    category: 'Education & Youth',
    benefit_summary: 'Financial scholarship of ₹12,000/year for undergraduate degrees and ₹20,000/year for postgraduate courses to meritorious students.',
    benefit_amount: '₹12,000 to ₹20,000 / year',
    eligibility: {
      occupation: ['Student'],
      age_min: 17,
      age_max: 25,
      income_max: 450000,
      state: 'All India',
      gender: 'any',
      min_education: '12th Pass above 80th percentile in relevant board',
    },
    occupation_tags: ['student', 'college student', 'university student', 'scholar', 'undergraduate', 'postgraduate', '12th pass', 'merit student', 'learner', 'degree student'],
    source_text: `Official PM-USP Scheme Guidelines (scholarships.gov.in & education.gov.in):
The Central Sector Scheme of Scholarship for College and University Students is implemented by the Department of Higher Education, Ministry of Education, to provide financial assistance to meritorious students from low-income families.
Scholarship Amount:
- Undergraduate Studies: Rs. 12,000/- per annum for the first three years of college.
- Postgraduate Studies: Rs. 20,000/- per annum for the 4th and 5th year (or 2 years of Master's degree).
- Professional degree courses (B.Tech, MBBS): Rs. 20,000/- per annum in 4th and 5th year.
Eligibility Criteria:
1. Students must be above the 80th percentile of successful candidates in the relevant stream from a recognized Board of Examination in Class XII (10+2).
2. Pursuing a regular course (not correspondence, distance, or diploma) in a recognized College/Institution.
3. Gross parental/family annual income must not exceed Rs. 4,50,000/- per annum from all sources.
4. Not receiving any other Central or State government scholarship or fee reimbursement.
5. Minimum 50% marks in annual university exams required for renewal each year.
Required Documents:
Aadhaar Card, Class 12th Board Marksheet, Income Certificate issued by competent Revenue Authority, Proof of Admission / Fee Receipt in regular college course, Bank Account Passbook.`,
    official_apply_url: 'https://scholarships.gov.in',
    required_documents: ['Aadhaar Card', 'Class 12th Marksheet showing percentile', 'Income Certificate (family income <= 4.5 Lakhs)', 'College Admission Receipt / Bonafide Student Certificate', 'Bank Account details'],
    last_verified: '2026-09-01',
  },
  {
    id: 'nsigse-samagra',
    name: 'National Scheme of Incentive to Girls for Secondary Education (NSIGSE)',
    hindi_name: 'माध्यमिक शिक्षा के लिए बालिकाओं को प्रोत्साहन की राष्ट्रीय योजना',
    ministry: 'Ministry of Education',
    category: 'Education & Youth',
    benefit_summary: 'Fixed deposit of ₹3,000 in the name of the girl student upon enrollment in Class IX, redeemable with accrued interest (approx ₹10,000) on passing Class X and attaining age 18.',
    benefit_amount: '₹3,000 FD + Interest (Total ~₹10,000)',
    eligibility: {
      occupation: ['Student'],
      age_min: 13,
      age_max: 18,
      income_max: null,
      state: 'All India',
      gender: 'female',
      min_education: 'Class 8th Pass enrolled in Class 9th in Govt / Aided School',
    },
    occupation_tags: ['girl student', 'female student', 'school girl', 'girl child', 'secondary student', 'class 9 student', 'sc st girl', 'kasturba student', 'student'],
    source_text: `Official NSIGSE Guidelines (education.gov.in & myscheme.gov.in):
The Centrally Sponsored Scheme "National Scheme of Incentive to Girls for Secondary Education (NSIGSE)" was launched to establish an enabling environment to reduce the drop-out rate and to promote the enrollment of girl children, mainly belonging to SC/ST communities in secondary schools.
Benefit Structure:
A sum of Rs. 3,000/- is deposited in the name of eligible unmarried girls as fixed deposit in a nationalized bank or post office. The girl is entitled to withdraw the principal along with accumulated interest upon reaching 18 years of age and passing the Class X examination.
Target Group:
1. All SC/ST girls who pass class VIII and enroll in Class IX in State Government, Government-aided and Local Body schools.
2. All girls who pass class VIII examination from Kasturba Gandhi Balika Vidyalayas (irrespective of whether they belong to SC/ST) and enroll in Class IX in Government or Local Body schools.
Exclusions:
Girls studying in private un-aided schools or schools affiliated to CBSE/ICSE or Central Government residential schools like Jawahar Navodaya Vidyalayas and Kendriya Vidyalayas.
Required Documents:
Aadhaar Card of girl child, Class 8th Pass Certificate, Caste Certificate (SC/ST), School Enrollment Certificate for Class 9th in Govt School, Bank/Post Office Account Details.`,
    official_apply_url: 'https://scholarships.gov.in',
    required_documents: ['Aadhaar Card', 'Class 8th Marksheet', 'School Bonafide Certificate (Class 9th enrollment)', 'Caste Certificate (SC/ST, if applicable)', 'Bank Passbook'],
    last_verified: '2026-09-01',
  },
  {
    id: 'nishtha-teacher-awards',
    name: 'National Awards to Teachers & NISHTHA Capacity Building Scheme',
    hindi_name: 'राष्ट्रीय शिक्षक पुरस्कार एवं निष्ठा योजना',
    ministry: 'Ministry of Education',
    category: 'Education & Youth',
    benefit_summary: 'Silver medal, Certificate of Merit, Cash Award of ₹50,000, and fully sponsored national & international pedagogical leadership training programs.',
    benefit_amount: '₹50,000 Cash Award + Silver Medal + Training',
    eligibility: {
      occupation: ['Teacher'],
      age_min: 25,
      age_max: 65,
      income_max: null,
      state: 'All India',
      gender: 'any',
      min_education: 'B.Ed / D.El.Ed / Relevant Teaching Certification with min 10 years service',
    },
    occupation_tags: ['teacher', 'headmaster', 'principal', 'educator', 'school teacher', 'professor', 'tutor', 'faculty', 'instructor', 'guru', 'adhyapak'],
    source_text: `Official National Awards to Teachers Guidelines (nationalawardstoteachers.education.gov.in & myscheme.gov.in):
The purpose of National Awards to Teachers is to celebrate the unique contribution of some of the finest teachers in the country and to honor those teachers who through their commitment and industry have not only improved the quality of school education but also enriched the lives of their students.
Eligibility:
1. Regular teachers and Heads of Schools working in recognized primary, middle, high and higher secondary schools belonging to:
   - Schools run by State Government/UT Administrations, Local Bodies, and aided schools.
   - Central Government Schools (Kendriya Vidyalayas, Navodaya Vidyalayas, Sainik Schools, Eklavya Model Residential Schools, Atomic Energy Education Society).
   - Schools affiliated to CBSE and CISCE.
2. Normally retired teachers are not eligible, but teachers who served at least a major part of the academic calendar can be considered.
3. Minimum 10 years of regular teaching experience is required.
4. Educational administrators, inspectors, and coaching institute teachers are not eligible.
Award Package:
- A Certificate of Merit.
- Cash award of Rs. 50,000/-.
- A Silver Medal.
- Invitation to national felicitation by the President of India on Teachers' Day (5th September).
Required Documents:
Service Proof, Performance Appraisal, Details of Innovative Pedagogy / Publications / ICT Initiatives, Testimonials from Students and School Management Committee.`,
    official_apply_url: 'https://nationalawardstoteachers.education.gov.in',
    required_documents: ['Service Verification Certificate (min 10 years)', 'Aadhaar Card', 'Portfolio of teaching innovations and student outcomes', 'NOC from State/District Education Officer'],
    last_verified: '2026-09-01',
  },
  {
    id: 'cghs',
    name: 'Central Government Health Scheme (CGHS)',
    hindi_name: 'केंद्रीय सरकार स्वास्थ्य योजना',
    ministry: 'Ministry of Health and Family Welfare',
    category: 'Social Security & Health',
    benefit_summary: 'Comprehensive cashless inpatient and outpatient medical treatment, specialist consultations, and free generic/branded medicines across 2,000+ empaneled hospitals.',
    benefit_amount: 'Comprehensive Cashless Healthcare',
    eligibility: {
      occupation: ['Government Employee (state/central)'],
      age_min: 18,
      age_max: null,
      income_max: null,
      state: 'All India',
      gender: 'any',
      bpl_required: false,
    },
    occupation_tags: ['government employee', 'sarkari karmachari', 'central govt servant', 'state govt employee', 'railway employee', 'postal worker', 'civil servant', 'bureaucrat', 'public sector worker'],
    source_text: `Official CGHS Guidelines (cghs.nic.in & myscheme.gov.in):
The Central Government Health Scheme (CGHS) provides comprehensive health care facilities to Central Government employees and pensioners and their enrolled family members residing in CGHS covered cities.
Coverage & Facilities:
- Outpatient Department (OPD) care including issue of medicines from wellness centres.
- Specialist consultations at polyclinics and empaneled private hospitals upon referral.
- Cashless hospitalization and diagnostic investigations at hundreds of empaneled private hospitals and diagnostic centres across India.
- Reimbursement of emergency treatment expenses incurred in non-empaneled government or private hospitals.
Eligible Beneficiaries:
1. All Central Government employees paid from Central Civil Estimates (other than Railways and Delhi Administration).
2. Pensioners of Central Government and their dependent family members.
3. Sitting and former Members of Parliament.
4. Ex-Governors and Lt. Governors.
5. Sitting and retired Judges of Supreme Court and High Courts.
6. Freedom Fighters.
Dependent Definition:
Spouse, legitimate children, stepchildren, parents mainly dependent on the government servant (whose monthly income from all sources does not exceed prescribed limit, currently Rs. 9,000 + DA).
Required Documents:
CGHS Plastic Card or Application Form certified by Head of Department/Office, Pay Slip / PPO (Pension Payment Order), Aadhaar Card, Passport photos of self and dependents.`,
    official_apply_url: 'https://cghs.nic.in',
    required_documents: ['Aadhaar Card', 'Latest Salary Slip / Pension Payment Order (PPO)', 'Office ID Card / Service Proof', 'Photographs of Dependent Family Members'],
    last_verified: '2026-09-01',
  },
  {
    id: 'echs',
    name: 'Ex-Servicemen Contributory Health Scheme (ECHS)',
    hindi_name: 'भूतपूर्व सैनिक अंशदायी स्वास्थ्य योजना',
    ministry: 'Ministry of Defence',
    category: 'Social Security & Health',
    benefit_summary: 'All-inclusive, cashless healthcare treatment for Ex-Servicemen pensioners, war widows, and their dependents through military hospitals and civilian empaneled facilities.',
    benefit_amount: 'Comprehensive Cashless Defence Healthcare',
    eligibility: {
      occupation: ['Army / Defence Personnel & Veterans'],
      age_min: 18,
      age_max: null,
      income_max: null,
      state: 'All India',
      gender: 'any',
      bpl_required: false,
    },
    occupation_tags: ['army', 'defence personnel', 'veteran', 'ex servicemen', 'military', 'navy', 'air force', 'fauji', 'jawan', 'armed forces pensioner', 'war widow'],
    source_text: `Official ECHS Guidelines (echs.gov.in & myscheme.gov.in):
The Ex-Servicemen Contributory Health Scheme (ECHS) was approved by the Union Cabinet to provide quality allopathic and AYUSH healthcare to Ex-Servicemen (ESM) pensioners and their authorized dependents.
Scope of Treatment:
- Full medical care without any financial ceiling for OPD and IPD treatments.
- Direct cashless treatment in 2,500+ empaneled private multi-specialty hospitals, cancer centres, and diagnostic labs nationwide.
- Access to Service Hospitals of Army, Navy, and Air Force.
- Free medicines and artificial limbs/implants.
Eligibility:
1. Any person who has served in any rank (combatant or non-combatant) in the Regular Army, Navy, and Air Force of the Indian Union and draws a defence pension.
2. War widows, family pensioners, and dependent children (sons up to 26 years of age or until employed; daughters until married).
3. Dependents parents whose monthly income does not exceed Rs. 9,000 + DA per month.
One-time Contribution:
Defence personnel contribute a nominal one-time deduction upon retirement based on pay level; war widows and disabled soldiers are 100% exempted from any contribution.
Required Documents:
Discharge Book / Certificate, Pension Payment Order (PPO), Aadhaar Card of ESM and dependents, ECHS 64-KB Smart Card application.`,
    official_apply_url: 'https://echs.gov.in',
    required_documents: ['Military Discharge Book / Certificate', 'Pension Payment Order (PPO)', 'Aadhaar Card', 'ECHS 64-KB Smart Card / Application Form'],
    last_verified: '2026-09-01',
  },
  {
    id: 'pm-sym',
    name: 'Pradhan Mantri Shram Yogi Maan-dhan (PM-SYM)',
    hindi_name: 'प्रधानमंत्री श्रम योगी मान-धन योजना',
    ministry: 'Ministry of Labour and Employment',
    category: 'Social Security & Health',
    benefit_summary: 'Guaranteed minimum monthly pension of ₹3,000 upon attaining 60 years of age, with 50% matching co-contribution by the Central Government.',
    benefit_amount: '₹3,000 / month Guaranteed Pension',
    eligibility: {
      occupation: ['Unorganized Sector Worker / Daily Wage Labourer'],
      age_min: 18,
      age_max: 40,
      income_max: 180000, // Monthly <= 15,000
      state: 'All India',
      gender: 'any',
      unorganized_worker_only: true,
    },
    occupation_tags: ['unorganized worker', 'daily wage worker', 'labourer', 'construction worker', 'mazdoor', 'maid', 'domestic worker', 'brick kiln worker', 'rickshaw puller', 'coolie', 'carpenter', 'painter'],
    source_text: `Official PM-SYM Guidelines (maandhan.in & myscheme.gov.in):
Pradhan Mantri Shram Yogi Maan-dhan (PM-SYM) is a voluntary and contributory pension scheme for unorganized workers to ensure old age protection.
Benefits:
- Minimum Assured Pension: Each subscriber under the PM-SYM will receive minimum assured monthly pension of Rs. 3,000/- after attaining the age of 60 years.
- Family Pension: During the receipt of pension, if the subscriber dies, the spouse shall be entitled to receive 50% of the pension (Rs. 1,500/month) as family pension.
- 50:50 Matching Contribution: Depending on entry age (18 to 40 years), the beneficiary deposits between Rs. 55/- and Rs. 200/- per month, and an equal 50% amount is matched and deposited by the Central Government.
Eligibility Criteria:
1. Must be an unorganized worker (home-based worker, street vendor, mid-day meal worker, head loader, brick kiln worker, cobbler, rag picker, domestic worker, washerman, rickshaw puller, landless agricultural labourer, construction worker, etc.).
2. Entry age must be between 18 and 40 years.
3. Monthly income must not exceed Rs. 15,000/- per month (approx Rs. 1,80,000/year).
4. Should NOT be covered under New Pension Scheme (NPS), Employees' State Insurance Corporation (ESIC) scheme, or Employees' Provident Fund Organisation (EPFO).
5. Should NOT be an income tax assessee.
Required Documents:
Aadhaar Card, Savings Bank Account Passbook / Jan Dhan Account with auto-debit consent, Mobile Number.`,
    official_apply_url: 'https://maandhan.in',
    required_documents: ['Aadhaar Card', 'Savings Bank Account Passbook or Jan Dhan Account', 'Mobile Number', 'Self-declaration of unorganized worker status'],
    last_verified: '2026-09-01',
  },
  {
    id: 'ignoaps',
    name: 'Indira Gandhi National Old Age Pension Scheme (IGNOAPS)',
    hindi_name: 'इंदिरा गांधी राष्ट्रीय वृद्धावस्था पेंशन योजना',
    ministry: 'Ministry of Rural Development',
    category: 'Social Security & Health',
    benefit_summary: 'Monthly social pension of ₹200–₹500 from Central Govt plus State top-ups (totaling ₹1,000 to ₹3,000/month depending on State) for elderly citizens living below poverty line.',
    benefit_amount: '₹1,000 to ₹3,000 / month (Central + State)',
    eligibility: {
      occupation: ['Senior Citizen'],
      age_min: 60,
      age_max: null,
      income_max: 100000,
      state: 'All India',
      gender: 'any',
      bpl_required: true,
    },
    occupation_tags: ['senior citizen', 'elderly', 'old age', 'aged person', 'retiree', 'pensioner', 'vridha', '60 plus', 'senior'],
    source_text: `Official IGNOAPS Guidelines (nsap.nic.in & myscheme.gov.in):
The Indira Gandhi National Old Age Pension Scheme (IGNOAPS) is a non-contributory component of the National Social Assistance Programme (NSAP) administered by the Ministry of Rural Development.
Objective:
To provide social security and financial independence to impoverished elderly persons who have little or no regular means of subsistence from their own sources or through support from family members.
Benefit Scale:
- For persons aged 60 to 79 years: Central Government contribution is Rs. 200/- per month, with State Governments adding their own top-up ranging from Rs. 800/- to Rs. 2,300/- per month (e.g. Haryana: Rs. 3,000/month total, Delhi: Rs. 2,500/month, Tamil Nadu: Rs. 1,000/month).
- For persons aged 80 years and above: Central contribution increases to Rs. 500/- per month plus State top-up.
Eligibility:
1. The applicant must be aged 60 years or higher.
2. The applicant must belong to a household living Below Poverty Line (BPL) according to the criteria prescribed by the Government of India.
3. Verification is carried out through the BPL Census list or SECC 2011 database by the Gram Panchayat / Urban Municipality.
Required Documents:
Aadhaar Card, Proof of Age (Birth Certificate, Voter ID, or Medical Officer certificate), BPL Card / Ration Card showing household status, Bank Account details.`,
    official_apply_url: 'https://nsap.nic.in',
    required_documents: ['Aadhaar Card', 'Proof of Age (Voter ID or Birth Certificate)', 'BPL Ration Card / BPL Certificate', 'Bank Passbook'],
    last_verified: '2026-09-01',
  },
  {
    id: 'adip',
    name: 'ADIP Scheme (Assistance to Disabled Persons for Purchase/Fitting of Aids and Appliances)',
    hindi_name: 'दिव्यांगजनों को सहायक उपकरण वितरण योजना (एडिप)',
    ministry: 'Ministry of Social Justice and Empowerment',
    category: 'Social Security & Health',
    benefit_summary: '100% free distribution and surgical fitting of modern assistive devices, motorized tricycles, braille kits, digital hearing aids, and cochlear implants.',
    benefit_amount: '100% Free Assistive Devices (Up to ₹70,000+ equipment)',
    eligibility: {
      occupation: ['Person with Disability'],
      age_min: null,
      age_max: null,
      income_max: 360000, // Up to 20k/mo full subsidy, 30k/mo 50%
      state: 'All India',
      gender: 'any',
      disability_min_percent: 40,
    },
    occupation_tags: ['person with disability', 'disabled', 'divyang', 'divyangjan', 'physically challenged', 'wheelchair user', 'hearing impaired', 'visually impaired', 'handicapped', 'blind'],
    source_text: `Official ADIP Scheme Guidelines (adip.depwd.gov.in & myscheme.gov.in):
The main objective of the Assistance to Disabled Persons for Purchase/Fitting of Aids and Appliances (ADIP) Scheme is to assist needy persons with disabilities in procuring durable, sophisticated, and scientifically manufactured standard aids and appliances that can promote their physical, social, and psychological rehabilitation.
Aids Provided:
Motorized tricycles, manual wheelchairs, crutches, walking sticks, artificial limbs and calipers, behind-the-ear digital hearing aids, braille slates, screen-reader smartphones, daisies players, and cochlear implant surgeries (up to Rs. 6,00,000 for children under 5 years).
Eligibility Criteria:
1. Any Indian citizen of any age holding a valid Disability Certificate with 40% or more disability issued by a Competent Medical Board.
2. Monthly family income:
   - Up to Rs. 20,000/- per month: Full 100% cost of the aid/appliance is borne by Government of India.
   - Rs. 20,001/- to Rs. 30,000/- per month: 50% cost of the aid/appliance is provided as subsidy.
3. The person should not have received financial assistance for the same aid/appliance from the Government during the last 3 years (last 1 year for children under 12 years).
Required Documents:
Unique Disability ID (UDID) Card or Medical Disability Certificate (40%+), Income Certificate, Aadhaar Card, Passport size photo showing the disability.`,
    official_apply_url: 'https://adip.depwd.gov.in',
    required_documents: ['UDID Card / Disability Certificate (min 40%)', 'Aadhaar Card', 'Income Certificate issued by Revenue Authority', 'Passport size photograph showing disability'],
    last_verified: '2026-09-01',
  },
  {
    id: 'pm-jay',
    name: 'Ayushman Bharat - Pradhan Mantri Jan Arogya Yojana (PM-JAY)',
    hindi_name: 'आयुष्मान भारत - प्रधानमंत्री जन आरोग्य योजना',
    ministry: 'Ministry of Health and Family Welfare / NHA',
    category: 'Social Security & Health',
    benefit_summary: 'Cashless and paperless secondary and tertiary hospitalisation coverage of ₹5 Lakhs per family per year across 28,000+ empaneled public and private hospitals.',
    benefit_amount: '₹5 Lakhs / year Family Health Cover',
    eligibility: {
      occupation: ['any'],
      age_min: null,
      age_max: null,
      income_max: 250000,
      state: 'All India',
      gender: 'any',
      bpl_required: true,
    },
    occupation_tags: ['general', 'health cover', 'bpl', 'ayushman', 'poor', 'low income', 'family insurance', 'all citizens', 'universal health', 'medical patient', 'hospital patient'],
    source_text: `Official Ayushman Bharat PM-JAY Guidelines (pmjay.gov.in & myscheme.gov.in):
Ayushman Bharat PM-JAY is the world's largest government-funded healthcare assurance scheme. It provides a health cover of Rs. 5 Lakhs per family per year for secondary and tertiary care hospitalization to over 12 crore poor and vulnerable families (approximately 55 crore beneficiaries).
Features:
- Completely cashless and paperless at point of service in any empaneled hospital (Public or Private) across India.
- No cap on family size, age, or gender.
- All pre-existing conditions are covered from day one.
- Covers up to 3 days of pre-hospitalization and 15 days of post-hospitalization expenses such as diagnostics and medicines.
- Includes approx 1,949 medical packages covering surgeries, day-care treatments, and intensive care.
Beneficiary Entitlement:
Entitlement is decided automatically based on deprivation criteria under the Socio-Economic and Caste Census (SECC 2011) database for rural and urban areas, or State-level Antyodaya Anna Yojana (AAY) and Priority Household (PHH) ration card rosters. Senior citizens aged 70 and above receive an additional top-up cover of Rs. 5 Lakhs regardless of income.
Required Documents:
Aadhaar Card or Ration Card, Ayushman Card (generated instantly via PM-JAY Beneficiary Portal / App).`,
    official_apply_url: 'https://pmjay.gov.in',
    required_documents: ['Aadhaar Card', 'Ration Card / SECC Household Letter', 'Ayushman Card / Golden Card (if already issued)'],
    last_verified: '2026-09-01',
  },
  {
    id: 'pmay',
    name: 'Pradhan Mantri Awas Yojana (PMAY - Urban / Gramin)',
    hindi_name: 'प्रधानमंत्री आवास योजना (शहरी / ग्रामीण)',
    ministry: 'Ministry of Housing and Urban Affairs & Ministry of Rural Development',
    category: 'Housing & Urban Welfare',
    benefit_summary: 'Direct construction grant of ₹1.2 to ₹2.5 Lakhs (Gramin) or interest subsidy up to 6.5% on home loans (CLSS) up to ₹2.67 Lakhs for pucca house construction.',
    benefit_amount: '₹1.2 Lakh to ₹2.67 Lakh Subsidy/Grant',
    eligibility: {
      occupation: ['any'],
      age_min: 18,
      age_max: 70,
      income_max: 300000, // EWS / low income
      state: 'All India',
      gender: 'any',
      bpl_required: false,
    },
    occupation_tags: ['housing', 'pucca house', 'home loan', 'shelter', 'makaan', 'kaccha house', 'rural home', 'urban home', 'ews', 'homeless', 'tenant'],
    source_text: `Official PMAY Scheme Guidelines (pmaymis.gov.in & pmayg.nic.in):
Pradhan Mantri Awas Yojana addresses rural and urban housing shortage by providing pucca houses with basic amenities (piped water, sanitation, electricity, LPG) to all eligible houseless and families living in kutcha or dilapidated houses.
Components:
1. PMAY-Gramin: Direct financial assistance of Rs. 1,20,000/- in plain areas and Rs. 1,30,000/- in hilly, difficult, and IAP districts, plus 90/95 days of unskilled labour wage under MGNREGS (approx Rs. 25,000) and Rs. 12,000 assistance for toilet construction under Swachh Bharat Mission.
2. PMAY-Urban Credit Linked Subsidy Scheme (CLSS): Interest subsidy of 6.5% for Economically Weaker Section (EWS - annual household income up to Rs. 3 Lakh) and Low Income Group (LIG - income up to Rs. 6 Lakh) on home loans up to Rs. 6 Lakhs for 20 years.
Mandatory Eligibility Criteria:
- The beneficiary family must not own a pucca house in their name or in the name of any member of their family in any part of India.
- Female ownership or co-ownership of the house is mandatory in urban components.
Required Documents:
Aadhaar Card of all family members, Bank Account Passbook, Proof of Land/House site or Kaccha house photograph, Income Certificate, Affidavit declaring non-ownership of any pucca house.`,
    official_apply_url: 'https://pmaymis.gov.in',
    required_documents: ['Aadhaar Card', 'Income Certificate / Self-Declaration', 'Bank Account details', 'Photographs of existing kutcha house / site', 'Affidavit of no pucca house ownership'],
    last_verified: '2026-09-01',
  },
];
