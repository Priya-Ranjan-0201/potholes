import React, { createContext, useContext, useState, useEffect } from "react";

export type LanguageCode = "en" | "hi" | "pa" | "ta" | "te" | "bn";

export interface LanguageOption {
  code: LanguageCode;
  label: string;
  nativeName: string;
  flag: string;
}

export const LANGUAGES: LanguageOption[] = [
  { code: "en", label: "English", nativeName: "English", flag: "🇬🇧" },
  { code: "hi", label: "Hindi", nativeName: "हिन्दी", flag: "🇮🇳" },
  { code: "pa", label: "Punjabi", nativeName: "ਪੰਜਾਬੀ", flag: "🇮🇳" },
  { code: "ta", label: "Tamil", nativeName: "தமிழ்", flag: "🇮🇳" },
  { code: "te", label: "Telugu", nativeName: "తెలుగు", flag: "🇮🇳" },
  { code: "bn", label: "Bengali", nativeName: "বাংলা", flag: "🇮🇳" },
];

export const TRANSLATIONS: Record<LanguageCode, Record<string, string>> = {
  en: {
    // Brand & Banner
    govtBanner: "Government of India | Ministry of Road Transport & Highways (MoRTH) & PWD",
    standardsNotice: "IRC:SP:84-2019 & IRC:82-2023 Compliant",
    helplineText: "24x7 Citizen Helpline: 1800-ROAD-FIX",
    appName: "ScamRoad",
    appHindiName: "सड़क सुरक्षा",
    appSubtitle: "National AI Pothole & Defect Redressal Portal",
    
    // Navbar
    navOverview: "Dashboard",
    navScanner: "AI Scanner",
    navWorkOrders: "Work Orders",
    navComplaints: "Grievances",
    navDefects: "Defects",
    navModels: "AI Telemetry",
    reportPotholeBtn: "🚨 Report Pothole",
    scanPhotoBtn: "⚡ Scan Photo",
    
    // Scanner Page
    scannerTitle: "AI Pothole & Road Defect Scanner",
    scannerSubtitle: "Real-time neural detection for potholes, transverse cracks, and road damage per MoRTH specifications.",
    modelActive: "YOLO11n Edge AI Active",
    ircCompliantBadge: "IRC:SP:84-2019 Compliant",
    uploadRoadPhoto: "+ Upload Road Photo",
    presetsLabel: "Presets:",
    presetNH44: "NH-44 Deep Crater",
    presetRural: "PMGSY Rural Road",
    presetGT: "GT Road Bitumen",
    presetClean: "Clean Surface (Zero Defect)",
    privacyActive: "Rule R15 Privacy Shield Active",
    defectsLocated: "Defects Located",
    clearRoad: "Clear / No Defects",
    corridorLoc: "Corridor Location:",
    gpsPrecision: "GPS: 30.9052° N, 75.8562° E (±2.5m precision)",
    telemetryTitle: "Defect Telemetry",
    selectedDefect: "Selected Defect",
    modelConfidence: "Model Confidence",
    severityScore: "Severity Score",
    estRepairCost: "Estimated Repair Cost",
    surfaceArea: "Surface Area",
    recommendedAction: "Recommended Action",
    dispatchWorkOrderBtn: "🚨 Dispatch PWD Work Order",
    workOrderDispatched: "Work Order #PWD-WO-2026-9814 Dispatched to Municipal PWD Division!",
    cleanSurfaceTitle: "Road Surface Clean",
    cleanSurfaceDesc: "Complies with IRC:SP:84-2019 standards.",
    potholeLabel: "POTHOLE",
    crackLongLabel: "CRACK_LONG",
    crackTransLabel: "CRACK_TRANS",

    // Dashboard Page
    dashboardTitle: "Road Condition & Maintenance Overview",
    dashboardSubtitle: "Real-time automated edge detection telemetry, PWD contractor SLAs, and citizen grievance redressal.",
    telemetryOnline: "Live Telemetry Online",
    totalDefects: "Total Road Defects",
    criticalPotholes: "Critical Potholes (24-hr Priority)",
    citizenGrievances: "Citizen Grievances",
    workOrdersDispatched: "PWD Work Orders",
    activeDefects: "active",
    repairedDefects: "repaired",
    immediateRemediation: "24-hr immediate compaction priority",
    pendingReview: "pending review",
    verifiedCompleted: "verified & completed",
    
    // Theme & Lang
    themeLight: "Light Mode",
    themeDark: "Dark Mode",
    selectLanguage: "Language",
  },
  hi: {
    govtBanner: "भारत सरकार | सड़क परिवहन एवं राजमार्ग मंत्रालय (MoRTH) एवं लोक निर्माण विभाग",
    standardsNotice: "भारतीय सड़क कांग्रेस IRC:SP:84-2019 मानकीकृत",
    helplineText: "24x7 नागरिक हेल्पलाइन: 1800-ROAD-FIX",
    appName: "सड़क सुरक्षा",
    appHindiName: "ScamRoad",
    appSubtitle: "राष्ट्रीय सड़क गुणवत्ता एवं गड्ढा निवारण प्रणाली",

    navOverview: "डैशबोर्ड",
    navScanner: "एआई स्कैनर",
    navWorkOrders: "कार्य आदेश",
    navComplaints: "नागरिक शिकायत",
    navDefects: "दोष सूची",
    navModels: "एआई टेलीमेट्री",
    reportPotholeBtn: "🚨 शिकायत दर्ज करें",
    scanPhotoBtn: "⚡ स्कैन करें",

    scannerTitle: "सड़क स्कैनर एवं एआई गड्ढा पहचान",
    scannerSubtitle: "सड़क परिवहन मंत्रालय (MoRTH) विनिर्देशों के अनुसार गड्ढों और दरारों की वास्तविक समय में स्वचालित पहचान।",
    modelActive: "YOLO11n एज एआई सक्रिय",
    ircCompliantBadge: "भारतीय मानक IRC:SP:84-2019 अनुपालित",
    uploadRoadPhoto: "+ फोटो अपलोड करें",
    presetsLabel: "पूर्व निर्धारित नमूने:",
    presetNH44: "राष्ट्रीय राजमार्ग 44 (NH-44)",
    presetRural: "ग्रामीण सड़क (PMGSY)",
    presetGT: "जी.टी. रोड (GT Road)",
    presetClean: "स्वच्छ सड़क (Zero Defect)",
    privacyActive: "नियम R15 गोपनीयता शील्ड सक्रिय",
    defectsLocated: "दोष पहचाने गए",
    clearRoad: "स्वच्छ सड़क / कोई दोष नहीं",
    corridorLoc: "सड़क स्थान:",
    gpsPrecision: "जीपीएस: 30.9052° N, 75.8562° E (±2.5m सटीकता)",
    telemetryTitle: "दोष टेलीमेट्री विवरण",
    selectedDefect: "पहचाना गया दोष",
    modelConfidence: "एआई सटीकता (Confidence)",
    severityScore: "गंभीरता स्कोर",
    estRepairCost: "अनुमानित मरम्मत लागत",
    surfaceArea: "सतह क्षेत्रफल",
    recommendedAction: "अनुशंसित मरम्मत कार्य",
    dispatchWorkOrderBtn: "🚨 PWD कार्य आदेश जारी करें",
    workOrderDispatched: "कार्य आदेश #PWD-WO-2026-9814 संबंधित लोक निर्माण संभाग को प्रेषित!",
    cleanSurfaceTitle: "सड़क सतह स्वच्छ एवं सुरक्षित",
    cleanSurfaceDesc: "IRC:SP:84-2019 मानकों के पूर्णतः अनुकूल।",
    potholeLabel: "गड्ढा (POTHOLE)",
    crackLongLabel: "अनुदैर्ध्य दरार",
    crackTransLabel: "अनुप्रस्थ दरार",

    dashboardTitle: "सड़क स्थिति एवं रखरखाव अवलोकन",
    dashboardSubtitle: "एआई कैमरा टेलीमेट्री, लोक निर्माण ठेकेदार एसएलए और नागरिक शिकायत निवारण का सीधा विवरण।",
    telemetryOnline: "लाइव टेलीमेट्री सक्रिय",
    totalDefects: "कुल सड़क दोष",
    criticalPotholes: "गंभीर गड्ढे (24-घंटे प्राथमिकता)",
    citizenGrievances: "नागरिक शिकायतें",
    workOrdersDispatched: "PWD कार्य आदेश",
    activeDefects: "सक्रिय",
    repairedDefects: "मरम्मत पूर्ण",
    immediateRemediation: "24-घंटे तत्काल डामरीकरण आवश्यक",
    pendingReview: "जांच हेतु लंबित",
    verifiedCompleted: "सत्यापित एवं पूर्ण",

    themeLight: "लाइट मोड",
    themeDark: "डार्क मोड",
    selectLanguage: "भाषा चुनें",
  },
  pa: {
    govtBanner: "ਭਾਰਤ ਸਰਕਾਰ | ਸੜਕ ਆਵਾਜਾਈ ਅਤੇ ਰਾਜਮਾਰਗ ਮੰਤਰਾਲਾ (MoRTH) ਤੇ ਲੋਕ ਨਿਰਮਾਣ ਵਿਭਾਗ",
    standardsNotice: "ਭਾਰਤੀ ਸੜਕ ਕਾਂਗਰਸ IRC:SP:84-2019 ਮਾਨਕੀਕ੍ਰਿਤ",
    helplineText: "24x7 ਨਾਗਰਿਕ ਹੈਲਪਲਾਈਨ: 1800-ROAD-FIX",
    appName: "ਸੜਕ ਸੁਰੱਖਿਆ",
    appHindiName: "ScamRoad",
    appSubtitle: "ਰਾਸ਼ਟਰੀ ਸੜਕ ਗੁਣਵੱਤਾ ਤੇ ਟੋਏ ਨਿਵਾਰਣ ਪੋਰਟਲ",

    navOverview: "ਡੈਸ਼ਬੋਰਡ",
    navScanner: "ਏਆਈ ਸਕੈਨਰ",
    navWorkOrders: "ਕੰਮ ਆਦੇਸ਼",
    navComplaints: "ਨਾਗਰਿਕ ਸ਼ਿਕਾਇਤ",
    navDefects: "ਨੁਕਸ ਸੂਚੀ",
    navModels: "ਏਆਈ ਮਾਡਲ",
    reportPotholeBtn: "🚨 ਸ਼ਿਕਾਇਤ ਦਰਜ ਕਰੋ",
    scanPhotoBtn: "⚡ ਸਕੈਨ ਕਰੋ",

    scannerTitle: "ਸੜਕ ਸਕੈਨਰ ਅਤੇ ਟੋਇਆਂ ਦੀ ਪਛਾਣ",
    scannerSubtitle: "ਰਾਸ਼ਟਰੀ ਰਾਜਮਾਰਗ ਅਤੇ ਸ਼ਹਿਰੀ ਸੜਕਾਂ ਦੇ ਨੁਕਸਾਂ ਦੀ ਰੀਅਲ-ਟਾਈਮ ਏਆਈ ਜਾਂਚ।",
    modelActive: "YOLO11n ਏਆਈ ਮਾਡਲ ਸਰਗਰਮ",
    ircCompliantBadge: "IRC:SP:84-2019 ਅਨੁਕੂਲ",
    uploadRoadPhoto: "+ ਫੋਟੋ ਅਪਲੋਡ ਕਰੋ",
    presetsLabel: "ਸੈਂਪਲ ਸੜਕਾਂ:",
    presetNH44: "ਕੌਮੀ ਰਾਜਮਾਰਗ 44 (NH-44)",
    presetRural: "ਪੇਂਡੂ ਸੜਕ (PMGSY)",
    presetGT: "ਜੀ.ਟੀ. ਰੋਡ (GT Road)",
    presetClean: "ਸਾਫ਼ ਸੜਕ (Zero Defect)",
    privacyActive: "ਨਿਯਮ R15 ਨਿੱਜਤਾ ਸੁਰੱਖਿਆ ਕਿਰਿਆਸ਼ੀਲ",
    defectsLocated: "ਨੁਕਸ ਲੱਭੇ ਗਏ",
    clearRoad: "ਸਾਫ਼ ਸੜਕ / ਕੋਈ ਨੁਕਸ ਨਹੀਂ",
    corridorLoc: "ਸੜਕ ਦਾ ਸਥਾਨ:",
    gpsPrecision: "ਜੀਪੀਐਸ: 30.9052° N, 75.8562° E",
    telemetryTitle: "ਟੈਲੀਮੈਟਰੀ ਵੇਰਵਾ",
    selectedDefect: "ਚੁਣਿਆ ਨੁਕਸ",
    modelConfidence: "ਮਾਡਲ ਸ਼ੁੱਧਤਾ",
    severityScore: "ਗੰਭੀਰਤਾ ਸਕੋਰ",
    estRepairCost: "ਅੰਦਾਜ਼ਨ ਮੁਰੰਮਤ ਲਾਗਤ",
    surfaceArea: "ਸਤਹ ਖੇਤਰਫਲ",
    recommendedAction: "ਸਿਫ਼ਾਰਿਸ਼ ਕੀਤੀ ਮੁਰੰਮਤ",
    dispatchWorkOrderBtn: "🚨 PWD ਵਰਕ ਆਰਡਰ ਜਾਰੀ ਕਰੋ",
    workOrderDispatched: "ਵਰਕ ਆਰਡਰ #PWD-WO-2026-9814 PWD ਨੂੰ ਭੇਜ ਦਿੱਤਾ ਗਿਆ!",
    cleanSurfaceTitle: "ਸੜਕ ਸਤਹ ਸਾਫ਼ ਅਤੇ ਸੁਰੱਖਿਅਤ",
    cleanSurfaceDesc: "IRC ਮਾਨਕਾਂ ਅਨੁਸਾਰ ਬਿਲਕੁਲ ਠੀਕ ਹੈ।",
    potholeLabel: "ਟੋਆ (POTHOLE)",
    crackLongLabel: "ਲੰਮਾ ਚੀਰਾ",
    crackTransLabel: "ਚੌੜਾ ਚੀਰਾ",

    dashboardTitle: "ਸੜਕ ਸਥਿਤੀ ਤੇ ਮੁਰੰਮਤ ਸੰਖੇਪ",
    dashboardSubtitle: "ਏਆਈ ਕੈਮਰਾ ਨਿਗਰਾਨੀ, ਠੇਕੇਦਾਰ SLA ਤੇ ਨਾਗਰਿਕ ਸ਼ਿਕਾਇਤਾਂ ਦਾ ਵੇਰਵਾ।",
    telemetryOnline: "ਲਾਈਵ ਟੈਲੀਮੈਟਰੀ ਚਾਲੂ",
    totalDefects: "ਕੁੱਲ ਸੜਕੀ ਨੁਕਸ",
    criticalPotholes: "ਗੰਭੀਰ ਟੋਏ (24-ਘੰਟੇ ਤਰਜੀਹ)",
    citizenGrievances: "ਨਾਗਰਿਕ ਸ਼ਿਕਾਇਤਾਂ",
    workOrdersDispatched: "ਜਾਰੀ ਕੀਤੇ ਵਰਕ ਆਰਡਰ",
    activeDefects: "ਸਰਗਰਮ",
    repairedDefects: "ਮੁਰੰਮਤ ਮੁਕੰਮਲ",
    immediateRemediation: "24-ਘੰਟੇ ਤੁਰੰਤ ਮੁਰੰਮਤ ਲੋੜੀਂਦੀ",
    pendingReview: "ਜਾਂਚ ਅਧੀਨ",
    verifiedCompleted: "ਪੜਤਾਲੀਆ ਤੇ ਮੁਕੰਮਲ",

    themeLight: "ਲਾਈਟ ਮੋਡ",
    themeDark: "ਡਾਰਕ ਮੋਡ",
    selectLanguage: "ਭਾਸ਼ਾ ਚੁਣੋ",
  },
  ta: {
    govtBanner: "இந்திய அரசு | சாலை போக்குவரத்து மற்றும் நெடுஞ்சாலைகள் அமைச்சகம் (MoRTH)",
    standardsNotice: "IRC:SP:84-2019 தரநிலை அங்கீகரிக்கப்பட்டது",
    helplineText: "24x7 குடிமக்கள் உதவி எண்: 1800-ROAD-FIX",
    appName: "சாலை பாதுகாப்பு",
    appHindiName: "ScamRoad",
    appSubtitle: "தேசிய சாலை தரம் மற்றும் குழி கண்காணிப்பு தளம்",

    navOverview: "டாஷ்போர்டு",
    navScanner: "AI ஸ்கேனர்",
    navWorkOrders: "பணி ஆணைகள்",
    navComplaints: "புகார்கள்",
    navDefects: "குறைபாடுகள்",
    navModels: "AI டெலிமெட்ரி",
    reportPotholeBtn: "🚨 புகார் பதிவு செய்",
    scanPhotoBtn: "⚡ ஸ்கேன் செய்",

    scannerTitle: "AI சாலை ஸ்கேனர் & குழி கண்டறிதல்",
    scannerSubtitle: "MoRTH விவரக்குறிப்புகளின்படி சாலை குழிகள் மற்றும் விரிசல்களை நிகழ்நேரத்தில் கண்டறிதல்.",
    modelActive: "YOLO11n AI செயலில் உள்ளது",
    ircCompliantBadge: "IRC:SP:84-2019 அங்கீகரிக்கப்பட்டது",
    uploadRoadPhoto: "+ புகைப்படத்தைப் பதிவேற்று",
    presetsLabel: "மாதிரி சாலைகள்:",
    presetNH44: "தேசிய நெடுஞ்சாலை 44 (NH-44)",
    presetRural: "கிராமப்புற சாலை (PMGSY)",
    presetGT: "ஜி.டி. சாலை (GT Road)",
    presetClean: "சுத்தமான சாலை (Zero Defect)",
    privacyActive: "விதி R15 தனியுரிமை கவசம் செயலில் உள்ளது",
    defectsLocated: "கண்டறியப்பட்ட குறைபாடுகள்",
    clearRoad: "குறைபாடற்ற சுத்தமான சாலை",
    corridorLoc: "சாலை அமைவிடம்:",
    gpsPrecision: "GPS: 30.9052° N, 75.8562° E",
    telemetryTitle: "டெலிமெட்ரி விவரங்கள்",
    selectedDefect: "தேர்ந்தெடுக்கப்பட்ட குறைபாடு",
    modelConfidence: "மாதிரி துல்லியம்",
    severityScore: "தீவிரத்தன்மை மதிப்பெண்",
    estRepairCost: "மதிப்பிடப்பட்ட பழுதுபார்ப்பு செலவு",
    surfaceArea: "மேற்பரப்பு பரப்பளவு",
    recommendedAction: "பரிந்துரைக்கப்பட்ட நடவடிக்கை",
    dispatchWorkOrderBtn: "🚨 PWD பணி ஆணை அனுப்பு",
    workOrderDispatched: "பணி ஆணை #PWD-WO-2026-9814 PWD பிரிவுக்கு அனுப்பப்பட்டது!",
    cleanSurfaceTitle: "சாலை மேற்பரப்பு சுத்தமாக உள்ளது",
    cleanSurfaceDesc: "IRC:SP:84-2019 தரநிலைகளுக்கு இணங்குகிறது.",
    potholeLabel: "சாலை குழி (POTHOLE)",
    crackLongLabel: "நீள்வெட்டு விரிசல்",
    crackTransLabel: "குறுக்கு விரிசல்",

    dashboardTitle: "சாலை நிலை மற்றும் பராமரிப்பு கண்ணோட்டம்",
    dashboardSubtitle: "நிகழ்நேர AI கேமரா தரவு, PWD ஒப்பந்ததாரர் SLA மற்றும் குடிமக்கள் குறைகள் கண்காணிப்பு.",
    telemetryOnline: "நேரலை டெலிமெட்ரி செயலில் உள்ளது",
    totalDefects: "மொத்த சாலை குறைபாடுகள்",
    criticalPotholes: "ஆபத்தான குழிகள் (24-மணி நேர முன்னுரிமை)",
    citizenGrievances: "குடிமக்கள் புகார்கள்",
    workOrdersDispatched: "வழங்கப்பட்ட பணி ஆணைகள்",
    activeDefects: "செயலில்",
    repairedDefects: "சரிசெய்யப்பட்டது",
    immediateRemediation: "24-மணி நேர உடனடி பழுதுபார்ப்பு தேவை",
    pendingReview: "மறுஆய்வில் உள்ளது",
    verifiedCompleted: "சரிபார்க்கப்பட்டு நிறைவடைந்தது",

    themeLight: "லைட் பயன்முறை",
    themeDark: "டார்க் பயன்முறை",
    selectLanguage: "மொழியைத் தேர்வுசெய்",
  },
  te: {
    govtBanner: "భారత ప్రభుత్వం | రోడ్డు రవాణా మరియు రహదారుల మంత్రిత్వ శాఖ (MoRTH)",
    standardsNotice: "IRC:SP:84-2019 ప్రమాణాల ప్రకారం ఆమోదించబడింది",
    helplineText: "24x7 పౌర హెల్ప్‌లైన్: 1800-ROAD-FIX",
    appName: "రోడ్డు భద్రత",
    appHindiName: "ScamRoad",
    appSubtitle: "జాతీయ రోడ్డు నాణ్యత మరియు గుంతల నివారణ పోర్టల్",

    navOverview: "డాష్‌బోర్డ్",
    navScanner: "AI స్కానర్",
    navWorkOrders: "పని ఆర్డర్లు",
    navComplaints: "ఫిర్యాదులు",
    navDefects: "లోపాల జాబితా",
    navModels: "AI టెలిమెట్రీ",
    reportPotholeBtn: "🚨 ఫిర్యాదు చేయండి",
    scanPhotoBtn: "⚡ స్కాన్ చేయండి",

    scannerTitle: "AI రోడ్డు స్కానర్ & గుంతల గుర్తింపు",
    scannerSubtitle: "MoRTH ప్రమాణాల ప్రకారం రోడ్డు గుంతలు మరియు పగుళ్లను నిజ సమయంలో స్వయంచాలకంగా గుర్తించడం.",
    modelActive: "YOLO11n AI సక్రియంగా ఉంది",
    ircCompliantBadge: "IRC:SP:84-2019 అనుగుణంగా ఉంది",
    uploadRoadPhoto: "+ ఫోటో అప్‌లోడ్ చేయండి",
    presetsLabel: "నమూనాలు:",
    presetNH44: "జాతీయ రహదారి 44 (NH-44)",
    presetRural: "గ్రామీణ రోడ్డు (PMGSY)",
    presetGT: "జి.టి. రోడ్డు (GT Road)",
    presetClean: "పరిశుభ్రమైన రోడ్డు (Zero Defect)",
    privacyActive: "నియమం R15 గోప్యతా కవచం సక్రియం",
    defectsLocated: "గుర్తించిన లోపాలు",
    clearRoad: "పరిశుభ్రమైన రోడ్డు / లోపాలు లేవు",
    corridorLoc: "రోడ్డు ప్రదేశం:",
    gpsPrecision: "GPS: 30.9052° N, 75.8562° E",
    telemetryTitle: "టెలిమెట్రీ వివరాలు",
    selectedDefect: "ఎంచుకున్న లోపం",
    modelConfidence: "ఖచ్చితత్వం",
    severityScore: "తీవ్రత స్కోరు",
    estRepairCost: "అంచనా వేసిన మరమ్మతు ఖర్చు",
    surfaceArea: "ఉపరితల వైశాల్యం",
    recommendedAction: "సిఫార్సు చేసిన మరమ్మతు",
    dispatchWorkOrderBtn: "🚨 PWD వర్క్ ఆర్డర్ జారీ చేయండి",
    workOrderDispatched: "వర్క్ ఆర్డర్ #PWD-WO-2026-9814 PWD విభాగానికి పంపబడింది!",
    cleanSurfaceTitle: "రోడ్డు ఉపరితలం శుభ్రంగా ఉంది",
    cleanSurfaceDesc: "IRC:SP:84-2019 ప్రమాణాలకు అనుగుణంగా ఉంది.",
    potholeLabel: "గుంత (POTHOLE)",
    crackLongLabel: "నిలువు పగులు",
    crackTransLabel: "అడ్డ పగులు",

    dashboardTitle: "రోడ్డు స్థితి మరియు నిర్వహణ సమీక్ష",
    dashboardSubtitle: "నిజ-సమయ AI పర్యవేక్షణ, కాంట్రాక్టర్ SLA మరియు పౌరుల ఫిర్యాదుల పరిష్కారం.",
    telemetryOnline: "లైవ్ టెలిమెట్రీ ఆన్‌లైన్",
    totalDefects: "మొత్తం రోడ్డు లోపాలు",
    criticalPotholes: "ప్రమాదకర గుంతలు (24-గంటల ప్రాధాన్యత)",
    citizenGrievances: "పౌర ఫిర్యాదులు",
    workOrdersDispatched: "జారీ చేసిన పని ఆర్డర్లు",
    activeDefects: "సక్రియం",
    repairedDefects: "మరమ్మతు పూర్తయింది",
    immediateRemediation: "24-గంటల్లో తక్షణ మరమ్మతు అవసరం",
    pendingReview: "సమీక్షలో ఉంది",
    verifiedCompleted: "ధృవీకరించబడింది & పూర్తయింది",

    themeLight: "లైట్ మోడ్",
    themeDark: "డార్క్ మోడ్",
    selectLanguage: "భాషను ఎంచుకోండి",
  },
  bn: {
    govtBanner: "ভারত সরকার | সড়ক পরিবহন ও মহাসড়ক মন্ত্রক (MoRTH) এবং পূর্ত দপ্তর (PWD)",
    standardsNotice: "IRC:SP:84-2019 ভারতীয় মান অনুযায়ী স্বীকৃত",
    helplineText: "24x7 নাগরিক হেল্পলাইন: 1800-ROAD-FIX",
    appName: "সড়ক সুরক্ষা",
    appHindiName: "ScamRoad",
    appSubtitle: "জাতীয় সড়ক গুণমান ও গর্ত নিবারণ পোর্টাল",

    navOverview: "ড্যাশবোর্ড",
    navScanner: "এআই স্ক্যানার",
    navWorkOrders: "কাজের আদেশ",
    navComplaints: "অভিযোগ",
    navDefects: "ত্রুটির তালিকা",
    navModels: "এআই টেলিমেট্রি",
    reportPotholeBtn: "🚨 অভিযোগ দায়ের করুন",
    scanPhotoBtn: "⚡ স্ক্যান করুন",

    scannerTitle: "এআই সড়ক স্ক্যানার ও গর্ত শনাক্তকরণ",
    scannerSubtitle: "MoRTH নির্দেশিকা অনুযায়ী সড়কের গর্ত ও ফাটলের রিয়েল-টাইম স্বয়ংক্রিয় শনাক্তকরণ।",
    modelActive: "YOLO11n এআই সক্রিয়",
    ircCompliantBadge: "IRC:SP:84-2019 মানসম্মত",
    uploadRoadPhoto: "+ ছবি আপলোড করুন",
    presetsLabel: "নমুনা সড়ক:",
    presetNH44: "জাতীয় সড়ক 44 (NH-44)",
    presetRural: "গ্রামীণ সড়ক (PMGSY)",
    presetGT: "জি.টি. রোড (GT Road)",
    presetClean: "পরিষ্কার সড়ক (Zero Defect)",
    privacyActive: "নিয়ম R15 গোপনীয়তা শিল্ড সক্রিয়",
    defectsLocated: "ত্রুটি চিহ্নিত হয়েছে",
    clearRoad: "পরিষ্কার সড়ক / কোনো ত্রুটি নেই",
    corridorLoc: "সড়কের অবস্থান:",
    gpsPrecision: "জিপিএস: 30.9052° N, 75.8562° E",
    telemetryTitle: "টেলিমেট্রি বিবরণ",
    selectedDefect: "চিহ্নিত ত্রুটি",
    modelConfidence: "মডেলের নির্ভুলতা",
    severityScore: "তীব্রতা স্কোর",
    estRepairCost: "আনুমানিক মেরামত খরচ",
    surfaceArea: "পৃষ্ঠতলের ক্ষেত্রফল",
    recommendedAction: "প্রস্তাবিত মেরামত ব্যবস্থা",
    dispatchWorkOrderBtn: "🚨 PWD কাজের আদেশ জারি করুন",
    workOrderDispatched: "কাজের আদেশ #PWD-WO-2026-9814 PWD বিভাগে পাঠানো হয়েছে!",
    cleanSurfaceTitle: "সড়ক পৃষ্ঠ পরিষ্কার ও সুরক্ষিত",
    cleanSurfaceDesc: "IRC:SP:84-2019 মান অনুযায়ী সম্পূর্ণ সুরক্ষিত।",
    potholeLabel: "গর্ত (POTHOLE)",
    crackLongLabel: "অনুদৈর্ঘ্য ফাটল",
    crackTransLabel: "তির্যক ফাটল",

    dashboardTitle: "সড়কের অবস্থা ও রক্ষণাবেক্ষণ সারসংক্ষেপ",
    dashboardSubtitle: "রিয়েল-টাইম এআই ক্যামেরা নজরদারি, ঠিকাদার SLA এবং নাগরিক অভিযোগ সমাধান।",
    telemetryOnline: "লাইভ টেলিমেট্রি সক্রিয়",
    totalDefects: "মোট সড়ক ত্রুটি",
    criticalPotholes: "বিপজ্জনক গর্ত (24-ঘণ্টার অগ্রাধিকার)",
    citizenGrievances: "নাগরিক অভিযোগ",
    workOrdersDispatched: "প্রদত্ত কাজের আদেশ",
    activeDefects: "সক্রিয়",
    repairedDefects: "মেরামত সম্পন্ন",
    immediateRemediation: "24-ঘণ্টায় অবিলম্বে মেরামত প্রয়োজন",
    pendingReview: "পর্যালোচনার অপেক্ষায়",
    verifiedCompleted: "যাচাইকৃত ও সম্পন্ন",

    themeLight: "লাইট মোড",
    themeDark: "ডার্ক মোড",
    selectLanguage: "ভাষা পরিবর্তন",
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
    return saved && TRANSLATIONS[saved] ? saved : "en";
  });

  useEffect(() => {
    localStorage.setItem("scamroad_lang", language);
  }, [language]);

  const setLanguage = (lang: LanguageCode) => {
    if (TRANSLATIONS[lang]) {
      setLanguageState(lang);
    }
  };

  const t = (key: string): string => {
    const langDict = TRANSLATIONS[language] || TRANSLATIONS.en;
    if (langDict[key]) return langDict[key];
    if (TRANSLATIONS.en[key]) return TRANSLATIONS.en[key];
    return key;
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
