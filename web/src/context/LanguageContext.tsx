import React, { createContext, useContext, useState, useEffect } from "react";

export type LanguageCode = "en" | "hi" | "pa" | "ta" | "te" | "bn";

export interface LanguageOption {
  code: LanguageCode;
  label: string;
  nativeName: string;
}

export const LANGUAGES: LanguageOption[] = [
  { code: "en", label: "English", nativeName: "English" },
  { code: "hi", label: "Hindi", nativeName: "हिन्दी" },
  { code: "pa", label: "Punjabi", nativeName: "ਪੰਜਾਬੀ" },
  { code: "ta", label: "Tamil", nativeName: "தமிழ்" },
  { code: "te", label: "Telugu", nativeName: "తెలుగు" },
  { code: "bn", label: "Bengali", nativeName: "বাংলা" },
];

export const TRANSLATIONS: Record<LanguageCode, Record<string, string>> = {
  en: {
    govtBanner: "Student Research Project | Road Defect & Maintenance Portal (Not an official government portal)",
    standardsNotice: "Severity rubric inspired by IRC:82-2023",
    footerNotice: "Student research project. Not an official government system. Not safety-certified.",
    navOverview: "Overview",
    navScanner: "Scanner",
    navMaintenance: "Maintenance",
    navBenchmarks: "Benchmarks",
    scannerTitle: "Road Scanner",
    scannerSubtitle: "Upload a road photo or select a sample to detect potholes and cracks.",
    uploadPhoto: "Upload Photo",
    cameraBtn: "Camera",
    photoModeBtn: "Photo Mode",
    hideBoxes: "Hide Boxes",
    showBoxes: "Show Boxes",
    potholesLabel: "Potholes",
    cracksLabel: "Cracks",
    statusLabel: "Status",
    goodStatus: "Good",
    sensitivity: "Sensitivity",
    cleanRoad: "Clean Road",
    noDefectsDetected: "No potholes or cracks detected.",
    saveToMaintenance: "Save to Maintenance",
    savedToMaintenance: "Saved to Maintenance",
  },
  hi: {
    govtBanner: "छात्र अनुसंधान परियोजना | सड़क दोष एवं रखरखाव पोर्टल (गैर-सरकारी / अनुसंधान हेतु)",
    standardsNotice: "IRC:82-2023 (खण्ड 4.2) से प्रेरित गंभीरता मानक",
    footerNotice: "छात्र अनुसंधान परियोजना। यह कोई आधिकारिक सरकारी प्रणाली नहीं है। सुरक्षा-प्रमाणित नहीं है।",
    navOverview: "सारांश",
    navScanner: "स्कैनर",
    navMaintenance: "रखरखाव",
    navBenchmarks: "बेंचमार्क",
    scannerTitle: "सड़क स्कैनर",
    scannerSubtitle: "गड्ढे और दरारें पहचानने के लिए सड़क की फोटो अपलोड करें या नमूना चुनें।",
    uploadPhoto: "फोटो अपलोड करें",
    cameraBtn: "कैमरा",
    photoModeBtn: "फोटो मोड",
    hideBoxes: "बॉक्स छिपाएं",
    showBoxes: "बॉक्स दिखाएं",
    potholesLabel: "गड्ढे",
    cracksLabel: "दरारें",
    statusLabel: "स्थिति",
    goodStatus: "साफ़",
    sensitivity: "संवेदनशीलता",
    cleanRoad: "साफ़ सड़क",
    noDefectsDetected: "कोई गड्ढा या दरार नहीं मिली।",
    saveToMaintenance: "रखरखाव में सहेजें",
    savedToMaintenance: "रखरखाव में सहेजा गया",
  },
  pa: {
    govtBanner: "ਵਿਦਿਆਰਥੀ ਖੋਜ ਪ੍ਰੋਜੈਕਟ | ਸੜਕ ਨੁਕਸ ਤੇ ਮੁਰੰਮਤ ਪੋਰਟਲ (ਗ਼ੈਰ-ਸਰਕਾਰੀ ਖੋਜ ਪ੍ਰਣਾਲੀ)",
    standardsNotice: "IRC:82-2023 (ਧਾਰਾ 4.2) ਤੋਂ ਪ੍ਰੇਰਿਤ ਗੰਭੀਰਤਾ ਰੂਬਰਿਕ",
    footerNotice: "ਵਿਦਿਆਰਥੀ ਖੋਜ ਪ੍ਰੋਜੈਕਟ। ਕੋਈ ਅਧਿਕਾਰਤ ਸਰਕਾਰੀ ਪ੍ਰਣਾਲੀ ਨਹੀਂ। ਸੁਰੱਖਿਆ-ਪ੍ਰਮਾਣਿਤ ਨਹੀਂ।",
    navOverview: "ਸੰਖੇਪ",
    navScanner: "ਸਕੈਨਰ",
    navMaintenance: "ਮੁਰੰਮਤ",
    navBenchmarks: "ਬੈਂਚਮਾਰਕ",
    scannerTitle: "ਸੜਕ ਸਕੈਨਰ",
    scannerSubtitle: "ਟੋਏ ਅਤੇ ਤਰੇੜਾਂ ਲੱਭਣ ਲਈ ਸੜਕ ਦੀ ਫੋਟੋ ਅਪਲੋਡ ਕਰੋ ਜਾਂ ਨਮੂਨਾ ਚੁਣੋ।",
    uploadPhoto: "ਫੋਟੋ ਅਪਲੋਡ ਕਰੋ",
    cameraBtn: "ਕੈਮਰਾ",
    photoModeBtn: "ਫੋਟੋ ਮੋਡ",
    hideBoxes: "ਬਾਕਸ ਲੁਕਾਓ",
    showBoxes: "ਬਾਕਸ ਦਿਖਾਓ",
    potholesLabel: "ਟੋਏ",
    cracksLabel: "ਤਰੇੜਾਂ",
    statusLabel: "ਸਥਿਤੀ",
    goodStatus: "ਠੀਕ",
    sensitivity: "ਸੰਵੇਦਨਸ਼ੀਲਤਾ",
    cleanRoad: "ਸਾਫ਼ ਸੜਕ",
    noDefectsDetected: "ਕੋਈ ਟੋਆ ਜਾਂ ਤਰੇੜ ਨਹੀਂ ਮਿਲੀ।",
    saveToMaintenance: "ਮੁਰੰਮਤ ਵਿੱਚ ਸੇਵ ਕਰੋ",
    savedToMaintenance: "ਮੁਰੰਮਤ ਵਿੱਚ ਸੇਵ ਹੋਇਆ",
  },
  ta: {
    govtBanner: "மாணவர் ஆராய்ச்சி திட்டம் | சாலை குறைபாடு மற்றும் பராமரிப்பு தளம் (அரசு தளம் அல்ல)",
    standardsNotice: "IRC:82-2023 (பிரிவு 4.2) வழிகாட்டல்",
    footerNotice: "மாணவர் ஆராய்ச்சி திட்டம். அதிகாரப்பூர்வ அரசு அமைப்பு அல்ல. பாதுகாப்பு சான்றிதழ் பெறப்படவில்லை.",
    navOverview: "மேலோட்டம்",
    navScanner: "ஸ்கேனர்",
    navMaintenance: "பராமரிப்பு",
    navBenchmarks: "மதிப்பீடுகள்",
    scannerTitle: "சாலை ஸ்கேனர்",
    scannerSubtitle: "குழிகள் மற்றும் விரிசல்களை கண்டறிய சாலை புகைப்படத்தை பதிவேற்றவும்.",
    uploadPhoto: "படம் பதிவேற்று",
    cameraBtn: "கேமரா",
    photoModeBtn: "புகைப்பட முறை",
    hideBoxes: "பெட்டிகளை மறை",
    showBoxes: "பெட்டிகளை காட்டு",
    potholesLabel: "குழிகள்",
    cracksLabel: "விரிசல்கள்",
    statusLabel: "நிலை",
    goodStatus: "நல்லது",
    sensitivity: "உணர்திறன்",
    cleanRoad: "சுத்தமான சாலை",
    noDefectsDetected: "குழிகள் அல்லது விரிசல்கள் இல்லை.",
    saveToMaintenance: "பராமரிப்பில் சேமி",
    savedToMaintenance: "பராமரிப்பில் சேமிக்கப்பட்டது",
  },
  te: {
    govtBanner: "విద్యార్థి పరిశోధన ప్రాజెక్ట్ | రోడ్డు లోపాల మరియు నిర్వహణ పోర్టల్ (ప్రభుత్వ అధికారికం కాదు)",
    standardsNotice: "IRC:82-2023 (క్లాజ్ 4.2) ప్రేరిత తీవ్రత వర్గీకరణ",
    footerNotice: "విద్యార్థి పరిశోధన ప్రాజెక్ట్. అధికారిక ప్రభుత్వ వ్యవస్థ కాదు. భద్రతా-ధృవీకరించబడలేదు.",
    navOverview: "సారాంశం",
    navScanner: "స్కానర్",
    navMaintenance: "నిర్వహణ",
    navBenchmarks: "బెంచ్‌మార్క్‌లు",
    scannerTitle: "రోడ్డు స్కానర్",
    scannerSubtitle: "గుంతలు మరియు పగుళ్లను గుర్తించడానికి రోడ్డు ఫోటోను అప్‌లోడ్ చేయండి.",
    uploadPhoto: "ఫోటో అప్‌లోడ్",
    cameraBtn: "కెమెరా",
    photoModeBtn: "ఫోటో మోడ్",
    hideBoxes: "బాక్స్‌లను దాచు",
    showBoxes: "బాక్స్‌లను చూపు",
    potholesLabel: "గుంతలు",
    cracksLabel: "పగుళ్లు",
    statusLabel: "స్థితి",
    goodStatus: "మంచిది",
    sensitivity: "సున్నితత్వం",
    cleanRoad: "శుభ్రమైన రోడ్డు",
    noDefectsDetected: "గుంతలు లేదా పగుళ్లు కనుగొనబడలేదు.",
    saveToMaintenance: "నిర్వహణలో సేవ్ చేయి",
    savedToMaintenance: "నిర్వహణలో సేవ్ అయింది",
  },
  bn: {
    govtBanner: "শিক্ষার্থী গবেষণা প্রকল্প | সড়ক ত্রুটি ও রক্ষণাবেক্ষণ পোর্টাল (সরকারী পোর্টাল নয়)",
    standardsNotice: "IRC:82-2023 (ধারা ৪.২) অনুপ্রাণিত তীব্রতা রুব্রিক",
    footerNotice: "শিক্ষার্থী গবেষণা প্রকল্প। কোনও সরকারী ব্যবস্থা নয়। সুরক্ষা-প্রত্যয়িত নয়।",
    navOverview: "সারাংশ",
    navScanner: "স্ক্যানার",
    navMaintenance: "রক্ষণাবেক্ষণ",
    navBenchmarks: "বেঞ্চমার্ক",
    scannerTitle: "সড়ক স্ক্যানার",
    scannerSubtitle: "গর্ত ও ফাটল শনাক্ত করতে সড়কের ছবি আপলোড করুন বা নমুনা বেছে নিন।",
    uploadPhoto: "ছবি আপলোড",
    cameraBtn: "ক্যামেরা",
    photoModeBtn: "ছবি মোড",
    hideBoxes: "বক্স লুকান",
    showBoxes: "বক্স দেখান",
    potholesLabel: "গর্ত",
    cracksLabel: "ফাটল",
    statusLabel: "অবস্থা",
    goodStatus: "ভালো",
    sensitivity: "সংবেদনশীলতা",
    cleanRoad: "পরিষ্কার সড়ক",
    noDefectsDetected: "কোনও গর্ত বা ফাটল পাওয়া যায়নি।",
    saveToMaintenance: "রক্ষণাবেক্ষণে সেভ করুন",
    savedToMaintenance: "রক্ষণাবেক্ষণে সেভ হয়েছে",
  },
};

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (key: string) => string;
  currentOption: LanguageOption;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<LanguageCode>(() => {
    const saved = localStorage.getItem("scamroad_lang") as LanguageCode;
    if (saved && TRANSLATIONS[saved]) return saved;
    return "en";
  });

  useEffect(() => {
    localStorage.setItem("scamroad_lang", language);
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = (lang: LanguageCode) => {
    setLanguageState(lang);
  };

  const t = (key: string): string => {
    const langDict = TRANSLATIONS[language];
    if (langDict && langDict[key]) {
      return langDict[key];
    }
    return TRANSLATIONS.en[key] || key;
  };

  const currentOption = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, currentOption }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
