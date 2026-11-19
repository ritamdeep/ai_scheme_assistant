import { Scheme, UserProfile, SupportedLanguage } from './types';
import { evaluateEligibility } from './rule-engine';

export type VerificationCriterionStatus = 'SATISFIED' | 'NOT_SATISFIED' | 'UNKNOWN';
export type Stage2VerdictStatus = 'LIKELY_ELIGIBLE' | 'POTENTIALLY_ELIGIBLE' | 'NOT_ELIGIBLE';
export type AnswerOption = 'yes' | 'no' | 'not_sure';

export interface MultilingualText {
  en: string;
  hi: string;
  bn: string;
  as: string;
  ta: string;
  te: string;
}

export interface SchemeQuestion {
  id: string;
  schemeId: string;
  criterionKey: string;
  criterionLabel: MultilingualText;
  question: MultilingualText;
  whyAsked: MultilingualText;
  requiredDocument: MultilingualText;
  howToAnswerNotSure: MultilingualText;
  isAlreadyAnsweredFromProfile: (profile: UserProfile) => {
    isAnswered: boolean;
    inferredAnswer?: AnswerOption;
  };
}

export interface EvaluatedCriterion {
  id: string;
  label: string;
  status: VerificationCriterionStatus;
  userAnswer?: AnswerOption;
  reason: string;
  requiredDocument: string;
}

export interface Stage2EvaluationResult {
  schemeId: string;
  schemeName: string;
  status: Stage2VerdictStatus;
  confidenceScore: number;
  totalCriteriaCount: number;
  satisfiedCount: number;
  uncertainCount: number;
  unmetCount: number;
  criteria: EvaluatedCriterion[];
  whyThisScheme: {
    matchedReasons: string[];
    uncertainReasons: string[];
    unmetReasons: string[];
    requiredDocuments: string[];
  };
}

export const SCHEME_QUESTIONS: SchemeQuestion[] = [
  // 1. PM-KISAN
  {
    id: 'pm_kisan_land_owner',
    schemeId: 'pm-kisan',
    criterionKey: 'cultivable_land_ownership',
    criterionLabel: {
      en: 'Cultivable Agricultural Land Ownership',
      hi: 'कृषि योग्य भूमि का स्वामित्व',
      bn: 'চাষযোগ্য কৃষিজমির মালিকানা',
      as: 'খেতি উপযোগী কৃষিভূমিৰ মালিকীস্বত্ব',
      ta: 'பயிரிடக்கூடிய விவசாய நில உரிமை',
      te: 'సాగు వ్యవసాయ భూమి యాజమాన్యం',
    },
    question: {
      en: 'Do you or your family own cultivable agricultural land?',
      hi: 'क्या आपके या आपके परिवार के पास कृषि योग्य भूमि है?',
      bn: 'আপনার বা আপনার পরিবারের কি চাষযোগ্য কৃষিজমি আছে?',
      as: 'আপোনাৰ বা আপোনাৰ পৰিয়ালৰ খেতি উপযোগী কৃষিভূমি আছেনে?',
      ta: 'உங்களுக்கோ அல்லது உங்கள் குடும்பத்திற்கோ பயிரிடக்கூடிய விவசாய நிலம் உள்ளதா?',
      te: 'మీకు లేదా మీ కుటుంబానికి సాగు చేయదగిన వ్యవసాయ భూమి ఉందా?',
    },
    whyAsked: {
      en: 'PM-KISAN provides direct income support exclusively to landholding farmer families.',
      hi: 'पीएम-किसान केवल भूमिधारी किसान परिवारों को प्रत्यक्ष आय सहायता प्रदान करता है।',
      bn: 'পিএম-কিসান শুধুমাত্র জমিসম্পন্ন কৃষক পরিবারকে সরাসরি আর্থিক সহায়তা প্রদান করে।',
      as: 'পিএম-কিষাণে কেৱল ভূমিস্বত্ব থকা কৃষক পৰিয়ালক পোনপটীয়া আৰ্থিক সাহায্য প্ৰদান কৰে।',
      ta: 'பி.எம்-கிசான் நிலமுள்ள விவசாய குடும்பங்களுக்கு மட்டுமே நேரடி வருமான உதவியை வழங்குகிறது.',
      te: 'పీఎం-కిసాన్ భూమి ఉన్న రైతు కుటుంబాలకు మాత్రమే నేరుగా నగదు సహాయం అందిస్తుంది.',
    },
    requiredDocument: {
      en: 'Land Record Document (Khatauni / Record of Rights - RoR / Patta / 7/12 Extract)',
      hi: 'भूमि अभिलेख दस्तावेज (खतौनी / अधिकार अभिलेख - RoR / पट्टा)',
      bn: 'জমির রেকর্ড নথি (খতিয়ান / পরচা / আরওআর / পাট্টা)',
      as: 'ভূমিৰ নথিপত্ৰ (খতিয়ান / পট্টা / ৰেকৰ্ড অৱ ৰাইটছ)',
      ta: 'நில ஆவணங்கள் (பட்டா / சிட்டா / அடங்கல் / உரிமைப் பதிவு)',
      te: 'భూ రికార్డు పత్రాలు (పట్టాదారు పాస్‌బుక్ / అడంగల్ / పహాణీ)',
    },
    howToAnswerNotSure: {
      en: 'If you are unsure of your exact family title, you can verify your details on your state land records portal (e.g. Bhulekh/Bhoomi).',
      hi: 'यदि आप भूमि स्वामित्व के बारे में निश्चित नहीं हैं, तो अपने राज्य के भूलेख पोर्टल पर खतौनी की जांच कर सकते हैं।',
      bn: 'জমির খতিয়ান সম্পর্কে নিশ্চিত না হলে রাজ্যের ভূমি রেকর্ড পোর্টালে (বাংলারভূমি) দেখে নিতে পারেন।',
      as: "ভূমিৰ মালিকীস্বত্ব নিশ্চিত নহ'লে ৰাজ্যৰ ভূমিলেখ পৰ্টেলত পৰীক্ষা কৰিব পাৰে।",
      ta: 'நிலத்தின் உரிமை குறித்து உறுதியாக தெரியவில்லை என்றால், பட்டா/சிட்டா ஆன்லைன் போர்ட்டலில் சரிபார்க்கலாம்.',
      te: 'భూ యాజమాన్యం గురించి ఖచ్చితంగా తెలియకపోతే మీ రాష్ట్ర భూ రికార్డుల పోర్టల్‌లో తనిఖీ చేయవచ్చు.',
    },
    isAlreadyAnsweredFromProfile: (profile) => {
      if (profile.land_holding_acres !== null && profile.land_holding_acres !== undefined) {
        return {
          isAnswered: true,
          inferredAnswer: profile.land_holding_acres > 0 ? 'yes' : 'no',
        };
      }
      return { isAnswered: false };
    },
  },
  {
    id: 'pm_kisan_land_registered',
    schemeId: 'pm-kisan',
    criterionKey: 'land_revenue_registry',
    criterionLabel: {
      en: 'Land Registered in State Revenue Records',
      hi: 'राज्य राजस्व रिकॉर्ड में पंजीकृत भूमि',
      bn: 'রাজস্ব রেকর্ডে নথিভুক্ত জমি',
      as: 'ৰাজহ নথিপত্ৰত পঞ্জীয়নভুক্ত ভূমি',
      ta: 'வருவாய்த்துறை பதிவேட்டில் பதிவான நிலம்',
      te: 'రెవెన్యూ రికార్డులలో నమోదైన భూమి',
    },
    question: {
      en: 'Is the cultivable land registered in your name (or your family name) in official state revenue records?',
      hi: 'क्या यह कृषि योग्य भूमि आधिकारिक राज्य राजस्व रिकॉर्ड में आपके (या परिवार के) नाम पर पंजीकृत है?',
      bn: 'চাষের জমিটি কি রাজ্য রাজস্ব রেকর্ডে আপনার বা আপনার পরিবারের নামে নথিভুক্ত?',
      as: 'এই কৃষিভূমি চৰকাৰী ৰাজহ নথিপত্ৰত আপোনাৰ বা পৰিয়ালৰ নামত পঞ্জীয়ন হৈ আছেনে?',
      ta: 'பயிரிடக்கூடிய நிலம் அரசு வருவாய்த்துறை ஆவணங்களில் உங்கள் பெயரில் பதிவு செய்யப்பட்டுள்ளதா?',
      te: 'ఈ సాగుభూమి ప్రభుత్వ రెవెన్యూ రికార్డులలో మీ పేరున (లేదా కుటుంబం పేరున) నమోదై ఉందా?',
    },
    whyAsked: {
      en: 'Scheme guidelines mandate that land records must be updated and verifiable in digital state databases.',
      hi: 'योजना के अनुसार भूमि रिकॉर्ड डिजिटल राज्य डेटाबेस में अद्यतन और सत्यापन योग्य होना अनिवार्य है।',
      bn: 'প্রকল্পের নির্দেশিকা অনুযায়ী জমির রেকর্ড ডিজিটাল ডেটাবেসে যাচাইযোগ্য হওয়া বাধ্যতামূলক।',
      as: "আঁচনিৰ নিয়ম অনুসৰি ভূমিৰ তথ্য ডিজিটেল ডাটাবেছত উপলব্ধ আৰু সত্যাপনযোগ্য হ'ব লাগিব।",
      ta: 'நில ஆவணங்கள் அரசு இணையதளத்தில் பதிவாகி இருக்க வேண்டியது கட்டாயமாகும்.',
      te: 'ప్రభుత్వ డిజిటల్ డేటాబేస్‌లో భూమి వివరాలు ఖచ్చితంగా నమోదై ఉండాలి.',
    },
    requiredDocument: {
      en: 'Registered Land Deed / Mutation Certificate / Digital Revenue Record Copy',
      hi: 'पंजीकृत भूमि दस्तावेज / दाखिल-खारिज प्रमाणपत्र / डिजिटल राजस्व प्रति',
      bn: 'দাখিল-খারিজ শংসাপত্র / ডিজিটাল পরচার কপি',
      as: 'দাখিল-খাৰিজ প্ৰমাণপত্ৰ / ডিজিটেল ৰাজহ প্ৰতিলিপি',
      ta: 'பட்டா மாறுதல் சான்றிதழ் / வருவாய்த் துறை ஆவண நகல்',
      te: 'మ్యుటేషన్ ధృవీకరణ పత్రం / డిజిటల్ పట్టాదారు కాపీ',
    },
    howToAnswerNotSure: {
      en: 'You can check your name on PM-KISAN Beneficiary Status using your Aadhaar or Mobile Number.',
      hi: 'आप अपने आधार या मोबाइल नंबर का उपयोग करके पीएम-किसान लाभार्थी स्थिति पर अपना नाम देख सकते हैं।',
      bn: 'আধার বা মোবাইল নম্বর ব্যবহার করে পিএম-কিসান পোর্টালে সুবিধাভোগীর তালিকায় দেখতে পারেন।',
      as: "আধাৰ বা ম'বাইল নম্বৰৰ সহায়ত পিএম-কিষাণ পৰ্টেলত হিতাধিকাৰীৰ স্থিতি পৰীক্ষা কৰিব পাৰে।",
      ta: 'பி.எம்-கிசான் தளத்தில் உங்கள் ஆதார் எண்ணைப் பயன்படுத்தி நில விபரங்களை சரிபார்க்கலாம்.',
      te: 'మీ ఆధార్ లేదా మొబైల్ నంబర్ ఉపయోగించి పీఎం-కిసాన్ పోర్టల్‌లో పేరు పరిశీలించవచ్చు.',
    },
    isAlreadyAnsweredFromProfile: () => ({ isAnswered: false }),
  },

  // 2. PM-JAY
  {
    id: 'pm_jay_deprived_household',
    schemeId: 'pm-jay',
    criterionKey: 'secc_deprivation_or_ration',
    criterionLabel: {
      en: 'SECC 2011 Deprived Household or Priority Ration Card',
      hi: 'SECC 2011 वंचित परिवार या प्राथमिकता राशन कार्ड',
      bn: 'এসইসিসি ২০১১ দরিদ্র পরিবার বা অগ্রাধিকার রেশন কার্ড',
      as: 'দৰিদ্ৰতা সীমাৰেখাৰ তলৰ পৰিয়াল বা প্ৰাথমিক ৰেচন কাৰ্ড',
      ta: 'வறுமைக் கோட்டிற்குட்பட்ட அல்லது முன்னுரிமை ரேஷன் அட்டை',
      te: 'SECC 2011 పేద కుటుంబం లేదా ప్రాధాన్యత రేషన్ కార్డు',
    },
    question: {
      en: 'Does your household belong to SECC 2011 deprivation criteria or hold a BPL / Antyodaya / Priority Ration Card?',
      hi: 'क्या आपका परिवार SECC 2011 वंचित वर्ग में आता है या आपके पास बीपीएल / अंत्योदय / प्राथमिकता राशन कार्ड है?',
      bn: 'আপনার পরিবারের কি বিপিএল / অন্ত্যোদয় / অগ্রাধিকার রেশন কার্ড রয়েছে?',
      as: 'আপোনাৰ পৰিয়ালৰ বিপিএল / অন্ত্যোদয় / প্ৰাথমিক ৰেচন কাৰ্ড আছেনে?',
      ta: 'உங்கள் குடும்பத்திடம் பிபிஎல் / அந்தியோதயா / முன்னுரிமை ரேஷன் அட்டை உள்ளதா?',
      te: 'మీ కుటుంబానికి బీపీఎల్ / అంత్యోదయ / ప్రాధాన్యత రేషన్ కార్డు ఉందా?',
    },
    whyAsked: {
      en: 'Ayushman Bharat PM-JAY covers the bottom 40% economically vulnerable population based on SECC 2011 and eligible ration categories.',
      hi: 'आयुष्मान भारत पीएम-जेएवाई SECC 2011 और पात्र राशन कार्डों के आधार पर देश के निचले 40% गरीब परिवारों को ₹5 लाख का कैशलेस स्वास्थ्य कवर देता है।',
      bn: 'আয়ুষ্মান ভারত পিএম-জেএওয়াই আর্থিকভাবে দুর্বল পরিবারগুলিকে প্রতি বছর ₹৫ লক্ষ টাকার বিনামূল্যে স্বাস্থ্য বীমা প্রদান করে।',
      as: 'আয়ুষ্মান ভাৰত আঁচনিয়ে যোগ্য দৰিদ্ৰ পৰিয়ালক বছৰি ৫ লাখ টকা পৰ্যন্ত বিনামূলীয়া চিকিৎসা সাহায্য প্ৰদান কৰে।',
      ta: 'ஆயுஷ்மான் பாரத் திட்டம் தகுதியுள்ள ஏழை குடும்பங்களுக்கு ஆண்டுக்கு ₹5 லட்சம் மருத்துவ காப்பீடு வழங்குகிறது.',
      te: 'ఆయుష్మాన్ భారత్ పేద కుటుంబాలకు సంవత్సరానికి ₹5 లక్షల వరకు ఉచిత నగదు రహిత వైద్య సహాయం అందిస్తుంది.',
    },
    requiredDocument: {
      en: 'Ration Card (BPL/Antyodaya/PHH) or PM-JAY Family Identification Letter (HH ID)',
      hi: 'राशन कार्ड (बीपीएल/अंत्योदय/प्राथमिकता) या आयुष्मान भारत परिवार पहचान पत्र (HH ID)',
      bn: 'রেশন কার্ড (বিপিএল/অন্ত্যোদয়) অথবা আয়ুষ্মান ভারত ফ্যামিলি আইডি লেটার',
      as: 'ৰেচন কাৰ্ড (বিপিএল/অন্ত্যোদয়) বা আয়ুষ্মান ভাৰত পৰিয়াল পৰিচয় পত্ৰ',
      ta: 'ரேஷன் அட்டை (பிபிஎல்/அந்தியோதயா) அல்லது ஆயுஷ்மான் பாரத் குடும்ப கடிதம்',
      te: 'రేషన్ కార్డు (బీపీఎల్/అంత్యోదయ) లేదా ఆయుష్మాన్ భారత్ ఫ్యామిలీ ఐడీ లెటర్',
    },
    howToAnswerNotSure: {
      en: 'You can check your name on mera.pmjay.gov.in using your mobile number or ration card number.',
      hi: 'आप mera.pmjay.gov.in पर अपने मोबाइल नंबर या राशन कार्ड नंबर से नाम जांच सकते हैं।',
      bn: 'mera.pmjay.gov.in ওয়েবসাইটে গিয়ে মোবাইল নম্বর বা রেশন কার্ড দিয়ে নিজের নাম যাচাই করতে পারেন।',
      as: "mera.pmjay.gov.in ৱেবছাইটত ম'বাইল বা ৰেচন কাৰ্ড নম্বৰ ব্যৱহাৰ কৰি নাম পৰীক্ষা কৰিব পাৰে।",
      ta: 'mera.pmjay.gov.in இணையதளத்தில் உங்கள் மொபைல் அல்லது ரேஷன் அட்டை எண்ணை உள்ளிட்டு சரிபார்க்கலாம்.',
      te: 'mera.pmjay.gov.in వెబ్‌సైట్‌లో మొబైల్ లేదా రేషన్ కార్డు నంబర్ ఉపయోగించి మీ పేరు తనిఖీ చేయవచ్చు.',
    },
    isAlreadyAnsweredFromProfile: (profile) => {
      const hasBpl = profile.special_conditions.some((c) =>
        c.toLowerCase().includes('bpl') || c.toLowerCase().includes('ration')
      );
      if (hasBpl) return { isAnswered: true, inferredAnswer: 'yes' };
      return { isAnswered: false };
    },
  },

  // 3. PM-SVANidhi
  {
    id: 'pm_svanidhi_lor_certificate',
    schemeId: 'pm-svanidhi',
    criterionKey: 'vending_lor_or_certificate',
    criterionLabel: {
      en: 'Street Vending Certificate or ULB LoR',
      hi: 'स्ट्रीट वेंडिंग प्रमाणपत्र या नगर निकाय LoR',
      bn: 'স্ট্রিট ভেন্ডিং সার্টিফিকেট বা পুরসভার এলওআর',
      as: 'ভেণ্ডিং প্ৰমাণপত্ৰ বা নগৰ নিকায়ৰ স্বীকৃতি পত্ৰ',
      ta: 'தெரு வியாபார சான்றிதழ் அல்லது நகராட்சி பரிந்துரை கடிதம் (LoR)',
      te: 'స్ట్రీట్ వెండింగ్ సర్టిఫికేట్ లేదా మునిసిపల్ LoR',
    },
    question: {
      en: 'Do you hold a Street Vending Certificate / ID Card, or a Letter of Recommendation (LoR) issued by your Urban Local Body (Municipality)?',
      hi: 'क्या आपके पास अपने नगर निगम/नगर पालिका द्वारा जारी स्ट्रीट वेंडिंग प्रमाणपत्र, पहचान पत्र या अनुशंसा पत्र (LoR) है?',
      bn: 'আপনার কাছে কি পুরসভা বা নগর নিগম কর্তৃক প্রদত্ত ভেন্ডিং সার্টিফিকেট বা সুপারিশপত্র (LoR) আছে?',
      as: 'আপোনাৰ ওচৰত পৌৰসভাৰ দ্বাৰা প্ৰদত্ত ষ্ট্ৰীট ভেণ্ডিং প্ৰমাণপত্ৰ বা অনুমোদন পত্ৰ (LoR) আছেনে?',
      ta: 'உங்களிடம் நகராட்சி அல்லது மாநகராட்சி வழங்கிய தெரு வியாபார அடையாள அட்டை அல்லது பரிந்துரைக் கடிதம் உள்ளதா?',
      te: 'మీ వద్ద మునిసిపాలిటీ జారీ చేసిన స్ట్రీట్ వెండింగ్ సర్టిఫికేట్ లేదా సిఫార్సు లేఖ (LoR) ఉందా?',
    },
    whyAsked: {
      en: 'PM SVANidhi provides working capital loans to street vendors identified by Urban Local Bodies.',
      hi: 'पीएम स्वनिधि शहरी स्थानीय निकायों द्वारा सत्यापित स्ट्रीट वेंडरों को कार्यशील पूंजी ऋण प्रदान करता है।',
      bn: 'পিএম স্বনিধি পুরসভা কর্তৃক চিহ্নিত হকারদের মূলধনী ঋণ প্রদান করে।',
      as: 'পিএম স্বনিধিয়ে পৌৰসভাৰ দ্বাৰা চিনাক্ত পদপথৰ ব্যৱসায়ীক ঋণ সাহায্য প্ৰদান কৰে।',
      ta: 'பி.எம் ஸ்வநிதி திட்டம் நகராட்சிகளால் அங்கீகரிக்கப்பட்ட தெருவோர வியாபாரிகளுக்கு மூலதனக் கடன் வழங்குகிறது.',
      te: 'పీఎం స్వనిధి పథకం మునిసిపాలిటీ ద్వారా గుర్తించబడిన వీధి వ్యాపారులకు మూలధన రుణాలు అందిస్తుంది.',
    },
    requiredDocument: {
      en: 'Certificate of Vending / Vendor ID Card / ULB Letter of Recommendation (LoR)',
      hi: 'वेंडिंग प्रमाणपत्र / वेंडर पहचान पत्र / नगर निकाय अनुशंसा पत्र (LoR)',
      bn: 'ভেন্ডিং সার্টিফিকেট / হকার পরিচয়পত্র / পুরসভার সুপারিশপত্র',
      as: "ভেণ্ডিং প্ৰমাণপত্ৰ / ব্যৱসায়িক পৰিচয় পত্ৰ / এলঅ'আৰ (LoR)",
      ta: 'வியாபார சான்றிதழ் / வியாபாரி அடையாள அட்டை / நகராட்சி LoR கடிதம்',
      te: 'వెండింగ్ సర్టిఫికేట్ / వెండర్ ఐడీ కార్డు / మునిసిపల్ సిఫార్సు లేఖ',
    },
    howToAnswerNotSure: {
      en: 'If you do not have a vending ID, you can apply for an LoR through your local Municipal Ward Office or the PM SVANidhi portal.',
      hi: 'यदि आपके पास वेंडिंग आईडी नहीं है, तो आप अपने स्थानीय नगर निगम कार्यालय या पीएम स्वनिधि पोर्टल के माध्यम से LoR के लिए आवेदन कर सकते हैं।',
      bn: 'আপনার কাছে ভেন্ডিং আইডি না থাকলে স্থানীয় পুরসভা অফিস থেকে LoR-এর জন্য আবেদন করতে পারেন।',
      as: 'ভেণ্ডিং আইডি না থাকিলে পৌৰসভা কাৰ্যালয়ৰ পৰা LoR-ৰ বাবে আবেদন কৰিব পাৰে।',
      ta: 'அடையாள அட்டை இல்லையென்றால், உங்கள் பகுதி நகராட்சி அலுவலகத்தில் LoR கடிதத்திற்கு விண்ணப்பிக்கலாம்.',
      te: 'వెండింగ్ ఐడీ లేకపోతే మీ స్థానిక మునిసిపల్ కార్యాలయంలో LoR కోసం దరఖాస్తు చేసుకోవచ్చు.',
    },
    isAlreadyAnsweredFromProfile: () => ({ isAnswered: false }),
  },

  // 4. PM-SYM
  {
    id: 'pm_sym_social_security_exclusion',
    schemeId: 'pm-sym',
    criterionKey: 'non_epfo_esic_nps',
    criterionLabel: {
      en: 'Not Enrolled in EPFO / ESIC / NPS',
      hi: 'EPFO / ESIC / NPS में नामांकित नहीं',
      bn: 'ইপিএফও / ইএসআইসি / এনপিএস-এর অন্তর্ভুক্ত নয়',
      as: "ইপিএফঅ' / ইএছআইচি / এনপিএছৰ অধীন নহয়",
      ta: 'EPFO / ESIC / NPS திட்டங்களில் சேராதவர்',
      te: 'EPFO / ESIC / NPS పరిధిలో లేనివారు',
    },
    question: {
      en: 'Can you confirm that you are NOT enrolled in EPFO (Provident Fund), ESIC (ESI Scheme), or NPS (National Pension System)?',
      hi: 'क्या आप पुष्टि कर सकते हैं कि आप EPFO (भविष्य निधि), ESIC या NPS के सदस्य नहीं हैं?',
      bn: 'আপনি কি নিশ্চিত করতে পারেন যে আপনি ইপিএফও, ইএসআইসি বা এনপিএস-এর অন্তর্ভুক্ত নন?',
      as: 'আপুনি নিশ্চিতনে যে আপুনি EPFO, ESIC বা NPS ৰ অন্তৰ্ভুক্ত নহয়?',
      ta: 'நீங்கள் EPFO, ESIC அல்லது அரசு NPS ஓய்வூதியத் திட்டத்தில் சேரவில்லை என்பதை உறுதிப்படுத்த முடியுமா?',
      te: 'మీరు EPFO, ESIC లేదా NPS పెన్షన్ పరిధిలో లేరని ధృవీకరించగలరా?',
    },
    whyAsked: {
      en: 'PM-SYM is reserved solely for unorganized workers without formal retirement or health benefits.',
      hi: 'पीएम-एसवाईएम विशेष रूप से उन असंगठित कामगारों के लिए है जिनके पास कोई औपचारिक सामाजिक सुरक्षा नहीं है।',
      bn: 'পিএম-এসওয়াইএম শুধুমাত্র অসংগঠিত শ্রমিকদের জন্য যাঁদের কোনো আনুষ্ঠানিক সামাজিক সুরক্ষা নেই।',
      as: 'পিএম-এছৱাইএম কেৱল কোনো চৰকাৰী পেঞ্চন বা সামাজিক সুৰক্ষা নথকা অসংগঠিত শ্ৰমিকৰ বাবে।',
      ta: 'பி.எம்-எஸ்.ஒய்.எம் முறைசாரா தொழிலாளர்களுக்காக மட்டுமே பிரத்யேகமாக உருவாக்கப்பட்டது.',
      te: 'పీఎం-ఎస్‌వైఎం పథకం ఎటువంటి వ్యవస్థీకృత సామాజిక భద్రత లేని అసంఘటిత కార్మికుల కోసం మాత్రమే.',
    },
    requiredDocument: {
      en: 'Aadhaar Card, e-Shram Card (if available), and Bank Account with auto-debit consent',
      hi: 'आधार कार्ड, ई-श्रम कार्ड (यदि हो) और बचत बैंक खाता',
      bn: 'আধার কার্ড, ই-শ্রম কার্ড (যদি থাকে) এবং ব্যাঙ্ক অ্যাকাউন্ট',
      as: 'আধাৰ কাৰ্ড, ই-শ্ৰম কাৰ্ড আৰু বেংক একাউণ্ট',
      ta: 'ஆதார் அட்டை, இ-ஷ்ரம் அட்டை மற்றும் வங்கி கணக்கு புத்தகம்',
      te: 'ఆధార్ కార్డు, ఈ-శ్రమ్ కార్డు మరియు బ్యాంక్ ఖాతా పుస్తకం',
    },
    howToAnswerNotSure: {
      en: 'If you do not receive PF deductions on your pay slip, you are generally not enrolled in EPFO.',
      hi: 'यदि आपकी कमाई से कोई पीएफ (भविष्य निधि) नहीं कटता है, तो आप सामान्यतः इसमें शामिल नहीं हैं।',
      bn: 'যদি আপনার বেতন থেকে কোনো পিএফ না কাটা হয়, তবে আপনি এতে অন্তর্ভুক্ত নন।',
      as: "দৰমহাৰ পৰা পিএফ কটা নহ'লে আপুনি ইয়াৰ অন্তৰ্ভুক্ত নহয়।",
      ta: 'உங்கள் ஊதியத்தில் பி.எஃப் பிடித்தம் செய்யப்படவில்லை என்றால், நீங்கள் தகுதியுடையவர்.',
      te: 'మీ సంపాదనలో పీఎఫ్ కట్ కాకపోతే మీరు సాధారణంగా అర్హులు.',
    },
    isAlreadyAnsweredFromProfile: () => ({ isAnswered: false }),
  },

  // 5. ADIP Scheme
  {
    id: 'adip_disability_certificate',
    schemeId: 'adip',
    criterionKey: 'disability_40_percent',
    criterionLabel: {
      en: 'Certified 40%+ Disability (UDID)',
      hi: 'प्रमाणित 40%+ दिव्यांगता (UDID)',
      bn: '৪০%+ প্রত্যয়িত প্রতিবন্ধকতা (UDID)',
      as: '৪০%+ প্ৰমাণিত দিব্যাংগতা (UDID)',
      ta: '40%+ மாற்றுத்திறனாளி சான்றிதழ் (UDID)',
      te: '40%+ ధృవీకరించబడిన దివ్యాంగులు (UDID)',
    },
    question: {
      en: 'Do you possess an official Disability Certificate or UDID card indicating 40% or greater disability?',
      hi: 'क्या आपके पास 40% या अधिक दिव्यांगता दर्शाने वाला आधिकारिक दिव्यांगता प्रमाणपत्र या यूडीआईडी कार्ड है?',
      bn: 'আপনার কাছে কি ৪০% বা ততোধিক প্রতিবন্ধকতা নির্দেশক ইউডিআইডি কার্ড বা মেডিকেল সার্টিফিকেট আছে?',
      as: 'আপোনাৰ ওচৰত ৪০% বা অধিক দিব্যাংগতা সূচোৱা চৰকাৰী ইউডিআইডি (UDID) কাৰ্ড আছেনে?',
      ta: 'உங்களிடம் 40% அல்லது அதற்கு மேற்பட்ட குறைபாடுடைய அதிகாரப்பூர்வ UDID அட்டை உள்ளதா?',
      te: 'మీ వద్ద 40% లేదా అంతకంటే ఎక్కువ వైకల్యాన్ని తెలిపే అధికారిక UDID కార్డు ఉందా?',
    },
    whyAsked: {
      en: 'ADIP provides free or subsidized modern assistive aids (wheelchairs, hearing aids, tricycles) to persons with certified disability.',
      hi: 'एडिप योजना 40% या अधिक दिव्यांग व्यक्तियों को आधुनिक सहायक उपकरण (व्हीलचेयर, श्रवण यंत्र आदि) निःशुल्क प्रदान करती है।',
      bn: 'এডিপ প্রকল্পের মাধ্যমে প্রত্যয়িত প্রতিবন্ধী ব্যক্তিদের বিনামূল্যে সহায়ক সরঞ্জাম প্রদান করা হয়।',
      as: 'এডিপ আঁচনিৰ জৰিয়তে যোগ্য দিব্যাংগ ব্যক্তিক বিনামূলীয়াকৈ সহায়ক সামগ্ৰী যোগান ধৰা হয়।',
      ta: 'ADIP திட்டம் மாற்றுத்திறனாளிகளுக்கு சக்கர நாற்காலி, செவிப்புலன் கருவிகள் போன்றவற்றை இலவசமாக வழங்குகிறது.',
      te: 'ADIP పథకం దివ్యాంగులకు చక్రాల కుర్చీలు, వినికిడి పరికరాలు వంటి సహాయక సామాగ్రిని ఉచితంగా అందిస్తుంది.',
    },
    requiredDocument: {
      en: 'UDID Card or Disability Certificate issued by a District Medical Board',
      hi: 'जिला चिकित्सा बोर्ड द्वारा जारी यूडीआईडी (UDID) कार्ड या दिव्यांगता प्रमाणपत्र',
      bn: 'ইউডিআইডি কার্ড অথবা জেলা মেডিকেল বোর্ডের প্রতিবন্ধী শংসাপত্র',
      as: "জিলা চিকিৎসা ব'ৰ্ডৰ দ্বাৰা প্ৰদত্ত ইউডিআইডি কাৰ্ড বা প্ৰমাণপত্ৰ",
      ta: 'மருத்துவ வாரியம் வழங்கிய UDID அட்டை அல்லது மாற்றுத்திறனாளி சான்றிதழ்',
      te: 'జిల్లా వైద్య బోర్డు జారీ చేసిన UDID కార్డు లేదా వైకల్య ధృవీకరణ పత్రం',
    },
    howToAnswerNotSure: {
      en: 'You can apply for UDID certification through your District Civil Hospital or at swavlambancard.gov.in.',
      hi: 'आप अपने जिला अस्पताल या swavlambancard.gov.in पर जाकर यूडीआईडी कार्ड के लिए आवेदन कर सकते हैं।',
      bn: 'জেলা হাসপাতাল বা swavlambancard.gov.in পোর্টাল থেকে ইউডিআইডি কার্ডের জন্য আবেদন করা যায়।',
      as: 'জিলা অসামৰিক চিকিৎসালয় বা swavlambancard.gov.in পৰ্টেলৰ পৰা ইউডিআইডিৰ আবেদন কৰিব পাৰি।',
      ta: 'அரசு தலைமை மருத்துவமனை அல்லது swavlambancard.gov.in மூலம் UDID அட்டைக்கு விண்ணப்பிக்கலாம்.',
      te: 'జిల్లా ఆసుపత్రి లేదా swavlambancard.gov.in ద్వారా UDID కార్డు కోసం దరఖాస్తు చేసుకోవచ్చు.',
    },
    isAlreadyAnsweredFromProfile: (profile) => {
      const isDis = profile.special_conditions.some((c) =>
        c.toLowerCase().includes('disab') || c.toLowerCase().includes('udid')
      );
      if (isDis) return { isAnswered: true, inferredAnswer: 'yes' };
      return { isAnswered: false };
    },
  },

  // 6. IGNOAPS (Senior Pension)
  {
    id: 'ignoaps_bpl_senior',
    schemeId: 'nsap-ignoaps',
    criterionKey: 'senior_bpl_card',
    criterionLabel: {
      en: 'Below Poverty Line (BPL) Status',
      hi: 'गरीबी रेखा से नीचे (BPL) स्थिति',
      bn: 'দারিদ্র্যসীমার নিচে (BPL) মর্যাদা',
      as: 'দৰিদ্ৰতা সীমাৰেখাৰ তলৰ (BPL) স্থিতি',
      ta: 'வறுமைக் கோட்டிற்கு கீழ் (BPL) நிலை',
      te: 'దారిద్య్రరేఖకు దిగువన (BPL) స్థితి',
    },
    question: {
      en: 'Does your household possess an official Below Poverty Line (BPL) card or Antyodaya Ration Card?',
      hi: 'क्या आपके परिवार के पास आधिकारिक बीपीएल (BPL) कार्ड या अंत्योदय राशन कार्ड है?',
      bn: 'আপনার পরিবারের কি অফিসিয়াল বিপিএল বা অন্ত্যোদয় রেশন কার্ড আছে?',
      as: 'আপোনাৰ পৰিয়ালৰ চৰকাৰী বিপিএল বা অন্ত্যোদয় ৰেচন কাৰ্ড আছেনে?',
      ta: 'உங்கள் குடும்பத்திடம் அதிகாரப்பூர்வ பிபிஎல் அல்லது அந்தியோதயா ரேஷன் அட்டை உள்ளதா?',
      te: 'మీ కుటుంబానికి అధికారిక బీపీఎల్ లేదా అంత్యోదయ రేషన్ కార్డు ఉందా?',
    },
    whyAsked: {
      en: 'National Social Assistance Programme (IGNOAPS) mandates that the senior applicant must belong to a BPL household.',
      hi: 'इंदिरा गांधी राष्ट्रीय वृद्धावस्था पेंशन योजना के लिए वरिष्ठ नागरिक का बीपीएल परिवार से होना अनिवार्य है।',
      bn: 'জাতীয় সামাজিক সহায়তা প্রকল্পের নিয়ম অনুযায়ী আবেদনকারী প্রবীণ নাগরিককে বিপিএল ভুক্ত হতে হবে।',
      as: 'এই পেঞ্চন আঁচনিৰ বাবে জ্যেষ্ঠ নাগৰিকজন বিপিএল পৰিয়ালৰ হোৱাটো বাধ্যতামূলক।',
      ta: 'தேசிய முதியோர் ஓய்வூதிய திட்டத்திற்கு விண்ணப்பதாரர் வறுமைக் கோட்டிற்கு கீழ் இருக்க வேண்டும்.',
      te: 'ఇందిరా గాంధీ వృద్ధాప్య పెన్షన్ కోసం దరఖాస్తుదారుడు బీపీఎల్ కుటుంబానికి చెంది ఉండాలి.',
    },
    requiredDocument: {
      en: 'BPL Card / Antyodaya Ration Card / State Social Welfare BPL Verification Certificate',
      hi: 'बीपीएल कार्ड / अंत्योदय राशन कार्ड / समाज कल्याण सत्यापन प्रमाणपत्र',
      bn: 'বিপিএল কার্ড / অন্ত্যোদয় রেশন কার্ড',
      as: 'বিপিএল কাৰ্ড / অন্ত্যোদয় ৰেচন কাৰ্ড',
      ta: 'பிபிஎல் அட்டை / அந்தியோதயா ரேஷன் அட்டை',
      te: 'బీపీఎల్ కార్డు / అంత్యోదయ రేషన్ కార్డు',
    },
    howToAnswerNotSure: {
      en: 'Check your ration card category. If it is yellow or marked AAY/PHH, you qualify under state BPL norms.',
      hi: 'अपने राशन कार्ड की श्रेणी जांचें। यदि यह गुलाबी/पीला या AAY/PHH लिखा है, तो यह बीपीएल के अंतर्गत आता है।',
      bn: 'রেশন কার্ডের ধরন দেখে নিন। AAY বা PHH লেখা থাকলে এটি বিপিএল সমতুল্য।',
      as: 'ৰেচন কাৰ্ডত AAY বা PHH লিখা থাকিলে ই বিপিএল শ্ৰেণীত পৰে।',
      ta: 'உங்கள் ரேஷன் அட்டையில் AAY அல்லது PHH எனக் குறிப்பிடப்பட்டிருந்தால் தகுதியுடையவர்.',
      te: 'మీ రేషన్ కార్డులో AAY లేదా PHH అని ఉంటే అది బీపీఎల్ కిందకు వస్తుంది.',
    },
    isAlreadyAnsweredFromProfile: (profile) => {
      const hasBpl = profile.special_conditions.some((c) =>
        c.toLowerCase().includes('bpl') || c.toLowerCase().includes('ration')
      );
      if (hasBpl) return { isAnswered: true, inferredAnswer: 'yes' };
      return { isAnswered: false };
    },
  },
];

/**
 * Returns ONLY the questions applicable to this scheme that haven't already been
 * answered in the session or inferred from the citizen's Stage 1 profile.
 */
export function getSchemeSpecificQuestions(
  schemeId: string,
  profile: UserProfile,
  currentAnswers: Record<string, AnswerOption>
): SchemeQuestion[] {
  const schemeQuestions = SCHEME_QUESTIONS.filter((q) => q.schemeId === schemeId);

  return schemeQuestions.filter((q) => {
    // Check if answered in this Stage 2 session
    if (currentAnswers[q.id]) {
      return false;
    }

    // Check if inferred already from profile
    const profileCheck = q.isAlreadyAnsweredFromProfile(profile);
    if (profileCheck.isAnswered && profileCheck.inferredAnswer) {
      return false;
    }

    return true;
  });
}

/**
 * Evaluates Stage 2 eligibility combining Stage 1 rule engine baseline
 * and Stage 2 scheme-specific answers.
 */
export function evaluateStage2Eligibility(
  scheme: Scheme,
  profile: UserProfile,
  schemeAnswers: Record<string, AnswerOption>,
  locale: SupportedLanguage = 'en'
): Stage2EvaluationResult {
  // 1. Evaluate baseline criteria from deterministic rule engine
  const baseVerdict = evaluateEligibility(scheme, profile);

  const criteria: EvaluatedCriterion[] = [];
  const matchedReasons: string[] = [];
  const uncertainReasons: string[] = [];
  const unmetReasons: string[] = [];
  const requiredDocuments: string[] = [...scheme.required_documents];

  // Map baseline criteria
  baseVerdict.matchedCriteria.forEach((c) => {
    matchedReasons.push(`${c.criterion}: ${c.reason}`);
    criteria.push({
      id: `base_${c.criterion}`,
      label: c.criterion,
      status: 'SATISFIED',
      reason: c.reason,
      requiredDocument: 'Identity Proof (Aadhaar / Voter ID)',
    });
  });

  baseVerdict.unmatchedCriteria.forEach((c) => {
    unmetReasons.push(`${c.criterion}: ${c.reason}`);
    criteria.push({
      id: `base_${c.criterion}`,
      label: c.criterion,
      status: 'NOT_SATISFIED',
      reason: c.reason,
      requiredDocument: 'Official guideline specification unmet',
    });
  });

  baseVerdict.unknownCriteria.forEach((c) => {
    // Only add if not covered by a specific Stage 2 question
    const coversQuestion = SCHEME_QUESTIONS.some(
      (q) => q.schemeId === scheme.id && q.criterionKey.toLowerCase().includes(c.criterion.toLowerCase().slice(0, 4))
    );
    if (!coversQuestion) {
      uncertainReasons.push(`${c.criterion}: ${c.reason}`);
      criteria.push({
        id: `base_${c.criterion}`,
        label: c.criterion,
        status: 'UNKNOWN',
        reason: c.reason,
        requiredDocument: 'Official documentary proof',
      });
    }
  });

  // 2. Evaluate scheme-specific verification questions
  const relevantQuestions = SCHEME_QUESTIONS.filter((q) => q.schemeId === scheme.id);

  for (const q of relevantQuestions) {
    const label = q.criterionLabel[locale] || q.criterionLabel.en;
    const doc = q.requiredDocument[locale] || q.requiredDocument.en;

    let userAns = schemeAnswers[q.id];

    // Check if inferred from profile if not explicitly answered in questionnaire
    if (!userAns) {
      const inferred = q.isAlreadyAnsweredFromProfile(profile);
      if (inferred.isAnswered && inferred.inferredAnswer) {
        userAns = inferred.inferredAnswer;
      }
    }

    if (userAns === 'yes') {
      criteria.push({
        id: q.id,
        label,
        status: 'SATISFIED',
        userAnswer: 'yes',
        reason: q.whyAsked[locale] || q.whyAsked.en,
        requiredDocument: doc,
      });
      matchedReasons.push(`${label}: Verified by citizen declaration.`);
      if (!requiredDocuments.includes(doc)) {
        requiredDocuments.push(doc);
      }
    } else if (userAns === 'no') {
      criteria.push({
        id: q.id,
        label,
        status: 'NOT_SATISFIED',
        userAnswer: 'no',
        reason: `Does not satisfy mandatory requirement: ${q.whyAsked[locale] || q.whyAsked.en}`,
        requiredDocument: doc,
      });
      unmetReasons.push(`${label}: Requirement not met.`);
    } else {
      // 'not_sure' or unanswered
      criteria.push({
        id: q.id,
        label,
        status: 'UNKNOWN',
        userAnswer: userAns || 'not_sure',
        reason: q.howToAnswerNotSure[locale] || q.howToAnswerNotSure.en,
        requiredDocument: doc,
      });
      uncertainReasons.push(`${label}: Verification pending (${doc}).`);
      if (!requiredDocuments.includes(doc)) {
        requiredDocuments.push(doc);
      }
    }
  }

  // Count totals
  const totalCriteriaCount = criteria.length;
  const satisfiedCount = criteria.filter((c) => c.status === 'SATISFIED').length;
  const uncertainCount = criteria.filter((c) => c.status === 'UNKNOWN').length;
  const unmetCount = criteria.filter((c) => c.status === 'NOT_SATISFIED').length;

  // Determine overall status
  let status: Stage2VerdictStatus;
  if (unmetCount > 0) {
    status = 'NOT_ELIGIBLE';
  } else if (uncertainCount > 0) {
    status = 'POTENTIALLY_ELIGIBLE';
  } else {
    status = 'LIKELY_ELIGIBLE';
  }

  const confidenceScore =
    totalCriteriaCount > 0
      ? unmetCount > 0
        ? Math.max(15, Math.round((satisfiedCount / totalCriteriaCount) * 40))
        : Math.round((satisfiedCount / totalCriteriaCount) * 100)
      : 50;

  return {
    schemeId: scheme.id,
    schemeName: scheme.name,
    status,
    confidenceScore,
    totalCriteriaCount,
    satisfiedCount,
    uncertainCount,
    unmetCount,
    criteria,
    whyThisScheme: {
      matchedReasons,
      uncertainReasons,
      unmetReasons,
      requiredDocuments,
    },
  };
}
