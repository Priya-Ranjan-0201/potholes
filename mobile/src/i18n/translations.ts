/**
 * ScamRoad Mobile Trilingual Dictionaries (en, hi, pa)
 * Conforms strictly to shared/taxonomy.yaml.
 */

export interface TranslationDictionary {
  app_name: string;
  tagline: string;
  safety_notice: string;
  safety_detail: string;
  mode_citizen: string;
  mode_drive: string;
  mode_outbox: string;
  mode_checklist: string;

  // Taxonomy Damage Classes
  class_POTHOLE: string;
  class_CRACK_LONG: string;
  class_CRACK_TRANS: string;
  class_CRACK_ALLIGATOR: string;

  // Citizen Reporting
  report_title: string;
  report_subtitle: string;
  take_photo: string;
  photo_captured: string;
  select_damage_type: string;
  description_placeholder: string;
  gps_accuracy: string;
  gps_acquiring: string;
  submit_report: string;
  submitting: string;
  report_success: string;
  recent_reports: string;
  upvote: string;
  upvoted: string;
  confirm_repair: string;
  repair_confirmed: string;

  // Complaint Statuses
  status_SUBMITTED: string;
  status_UNDER_REVIEW: string;
  status_VERIFIED: string;
  status_ASSIGNED: string;
  status_IN_PROGRESS: string;
  status_RESOLVED: string;
  status_REJECTED: string;

  // Driver Mode
  drive_hud_title: string;
  drive_hud_disclaimer: string;
  drive_handsfree_active: string;
  drive_fps: string;
  drive_latency: string;
  drive_speed: string;
  drive_detected_craters: string;
  drive_hazard_alert: string;
  drive_start_scan: string;
  drive_stop_scan: string;
  drive_model_status: string;
  model_ready: string;
  model_not_loaded: string;

  // Offline Outbox
  outbox_title: string;
  outbox_desc: string;
  outbox_pending_count: string;
  outbox_sync_btn: string;
  outbox_syncing: string;
  outbox_empty: string;
  outbox_delivered: string;
  outbox_privacy_blurred: string;

  // Field Checklist
  checklist_title: string;
  scan_qr_segment: string;
  segment_scanned: string;
  inspection_items: string;
  item_surface: string;
  item_drainage: string;
  item_shoulder: string;
  item_markings: string;
  submit_inspection: string;
}

export const translations: Record<"en" | "hi" | "pa", TranslationDictionary> = {
  en: {
    app_name: "ScamRoad",
    tagline: "Deploying advanced space technology to map road craters so deep you don't need a rocket to visit the Moon.",
    safety_notice: "Advisory System Only — Do Not Operate While Driving",
    safety_detail: "Device must be securely mounted in a windshield or dashboard holder. Hands-free audio alerts will sound automatically.",
    mode_citizen: "Citizen Report",
    mode_drive: "Inspector Drive",
    mode_outbox: "Offline Outbox",
    mode_checklist: "Field Checklist",

    class_POTHOLE: "Pothole",
    class_CRACK_LONG: "Longitudinal Crack",
    class_CRACK_TRANS: "Transverse Crack",
    class_CRACK_ALLIGATOR: "Alligator Crack",

    report_title: "Report Road Damage",
    report_subtitle: "Help your municipality identify and fix hazardous road conditions.",
    take_photo: "Capture Road Photo",
    photo_captured: "Photo Attached",
    select_damage_type: "Select Defect Category",
    description_placeholder: "Add landmark details or specific road conditions...",
    gps_accuracy: "GPS Precision",
    gps_acquiring: "Acquiring High-Accuracy GPS...",
    submit_report: "Submit Complaint",
    submitting: "Submitting to Municipal Cloud...",
    report_success: "Report submitted successfully!",
    recent_reports: "My Damage Reports & Status",
    upvote: "Confirm / Upvote",
    upvoted: "Upvoted",
    confirm_repair: "Verify Fix",
    repair_confirmed: "Repair Verified by Citizen",

    status_SUBMITTED: "Submitted",
    status_UNDER_REVIEW: "Under Review",
    status_VERIFIED: "Verified",
    status_ASSIGNED: "Work Assigned",
    status_IN_PROGRESS: "Repair In Progress",
    status_RESOLVED: "Resolved",
    status_REJECTED: "Rejected",

    drive_hud_title: "Inspector Drive Mode HUD",
    drive_hud_disclaimer: "Real-time edge detection running on device. Touch disabled while moving.",
    drive_handsfree_active: "Hands-Free Auto-Tagging Active",
    drive_fps: "Inference FPS",
    drive_latency: "Latency",
    drive_speed: "Vehicle Speed",
    drive_detected_craters: "Road Defects Logged",
    drive_hazard_alert: "POTHOLE DETECTED AHEAD",
    drive_start_scan: "Start Driving Inspection",
    drive_stop_scan: "End Driving Inspection",
    drive_model_status: "AI Model State",
    model_ready: "ONNX Runtime Mobile (Edge Ready)",
    model_not_loaded: "Model Not Loaded",

    outbox_title: "Offline Outbox Sync Queue",
    outbox_desc: "Observations recorded without network are safely queued in local storage.",
    outbox_pending_count: "Pending Observations",
    outbox_sync_btn: "Sync to Cloud Now",
    outbox_syncing: "Uploading queued observations...",
    outbox_empty: "Queue is empty. All observations synced.",
    outbox_delivered: "Synced to Server",
    outbox_privacy_blurred: "Faces & Plates Blurred (Rule R15)",

    checklist_title: "Road Segment Inspection Checklist",
    scan_qr_segment: "Scan Segment QR Code",
    segment_scanned: "Segment Identified",
    inspection_items: "Inspection Points",
    item_surface: "Pavement Surface & Pothole Assessment",
    item_drainage: "Storm Drain & Waterlogging Clearance",
    item_shoulder: "Road Shoulder & Edge Drop-off",
    item_markings: "Lane Markings & Pedestrian Crossings",
    submit_inspection: "Submit Audit Sign-off",
  },
  hi: {
    app_name: "स्कैमरोड",
    tagline: "सड़क के गड्ढों को मैप करने के लिए उन्नत तकनीक।",
    safety_notice: "केवल सलाहकारी प्रणाली — गाड़ी चलाते समय इसका उपयोग न करें",
    safety_detail: "डिवाइस को विंडशील्ड या डैशबोर्ड होल्डर में सुरक्षित रूप से लगाएं। ऑडियो अलर्ट अपने आप बजेंगे।",
    mode_citizen: "नागरिक रिपोर्ट",
    mode_drive: "निरीक्षक ड्राइव",
    mode_outbox: "ऑफ़लाइन आउटबॉक्स",
    mode_checklist: "फील्ड चेकलिस्ट",

    class_POTHOLE: "गड्ढा",
    class_CRACK_LONG: "अनुदैर्ध्य दरार",
    class_CRACK_TRANS: "अनुप्रस्थ दरार",
    class_CRACK_ALLIGATOR: "मगरमच्छ दरार",

    report_title: "सड़क क्षति की रिपोर्ट करें",
    report_subtitle: "नगर निगम को खतरनाक सड़क स्थितियों को ठीक करने में मदद करें।",
    take_photo: "सड़क का फोटो लें",
    photo_captured: "फोटो संलग्न है",
    select_damage_type: "दोष श्रेणी चुनें",
    description_placeholder: "लैंडमार्क या विशिष्ट सड़क स्थिति का विवरण जोड़ें...",
    gps_accuracy: "जीपीएस सटीकता",
    gps_acquiring: "उच्च सटीकता वाला जीपीएस खोजा जा रहा है...",
    submit_report: "शिकायत दर्ज करें",
    submitting: "क्लाउड पर भेजा जा रहा है...",
    report_success: "शिकायत सफलतापूर्वक दर्ज की गई!",
    recent_reports: "मेरी रिपोर्ट और स्थिति",
    upvote: "पुष्टि / समर्थन",
    upvoted: "समर्थित",
    confirm_repair: "मरम्मत की पुष्टि करें",
    repair_confirmed: "नागरिक द्वारा मरम्मत सत्यापित",

    status_SUBMITTED: "दर्ज की गई",
    status_UNDER_REVIEW: "समीक्षाधीन",
    status_VERIFIED: "सत्यापित",
    status_ASSIGNED: "कार्य सौंपा गया",
    status_IN_PROGRESS: "मरम्मत जारी है",
    status_RESOLVED: "समाधान हो गया",
    status_REJECTED: "अस्वीकृत",

    drive_hud_title: "निरीक्षक ड्राइव मोड एचयूडी",
    drive_hud_disclaimer: "डिवाइस पर रीयल-टाइम एज डिटेक्शन। चलते समय स्क्रीन स्पर्श बंद है।",
    drive_handsfree_active: "हैंड्स-फ्री ऑटो-टैगिंग सक्रिय",
    drive_fps: "अनुमान एफपीएस",
    drive_latency: "विलंबता",
    drive_speed: "वाहन की गति",
    drive_detected_craters: "दर्ज किए गए दोष",
    drive_hazard_alert: "आगे गड्ढा पाया गया",
    drive_start_scan: "ड्राइव निरीक्षण शुरू करें",
    drive_stop_scan: "ड्राइव निरीक्षण समाप्त करें",
    drive_model_status: "एआई मॉडल स्थिति",
    model_ready: "ओएनएनएक्स रनटाइम मोबाइल (तैयार)",
    model_not_loaded: "मॉडल लोड नहीं हुआ",

    outbox_title: "ऑफ़लाइन आउटबॉक्स सिंक कतार",
    outbox_desc: "इंटरनेट के बिना रिकॉर्ड किए गए अवलोकनों को सुरक्षित स्थानीय कतार में रखा जाता है।",
    outbox_pending_count: "लंबित अवलोकन",
    outbox_sync_btn: "अब क्लाउड से सिंक करें",
    outbox_syncing: "अवलोकन अपलोड हो रहे हैं...",
    outbox_empty: "कतार खाली है। सब कुछ सिंक हो चुका है।",
    outbox_delivered: "सर्वर पर सिंक किया गया",
    outbox_privacy_blurred: "चेहरे और नंबर प्लेट धुंधले किए गए (नियम R15)",

    checklist_title: "सड़क खंड निरीक्षण चेकलिस्ट",
    scan_qr_segment: "सड़क खंड क्यूआर कोड स्कैन करें",
    segment_scanned: "खंड की पहचान हो गई",
    inspection_items: "निरीक्षण बिंदु",
    item_surface: "सड़क की सतह और गड्ढों का मूल्यांकन",
    item_drainage: "नाली और जलभराव की स्थिति",
    item_shoulder: "सड़क का किनारा और सुरक्षा",
    item_markings: "लेन मार्किंग और पैदल पथ",
    submit_inspection: "निरीक्षण ऑडिट सबमिट करें",
  },
  pa: {
    app_name: "ਸਕੈਮਰੋਡ",
    tagline: "ਸੜਕ ਦੇ ਟੋਇਆਂ ਨੂੰ ਮੈਪ ਕਰਨ ਲਈ ਉੱਨਤ ਤਕਨਾਲੋਜੀ।",
    safety_notice: "ਸਿਰਫ਼ ਸਲਾਹਕਾਰੀ ਪ੍ਰਣਾਲੀ — ਗੱਡੀ ਚਲਾਉਂਦੇ ਸਮੇਂ ਨਾ ਵਰਤੋ",
    safety_detail: "ਡਿਵਾਈਸ ਨੂੰ ਵਿੰਡਸ਼ੀਲਡ ਜਾਂ ਡੈਸ਼ਬੋਰਡ ਹੋਲਡਰ ਵਿੱਚ ਸੁਰੱਖਿਅਤ ਢੰਗ ਨਾਲ ਲਗਾਓ। ਆਡੀਓ ਚੇਤਾਵਨੀ ਆਪਣੇ ਆਪ ਵੱਜੇਗੀ।",
    mode_citizen: "ਨਾਗਰਿਕ ਰਿਪੋਰਟ",
    mode_drive: "ਇੰਸਪੈਕਟਰ ਡਰਾਈਵ",
    mode_outbox: "ਆਫ਼ਲਾਈਨ ਆਊਟਬਾਕਸ",
    mode_checklist: "ਫੀਲਡ ਚੈੱਕਲਿਸਟ",

    class_POTHOLE: "ਟੋਆ",
    class_CRACK_LONG: "ਲੰਬਕਾਰੀ ਦਰਾਰ",
    class_CRACK_TRANS: "ਆੜੀ ਦਰਾਰ",
    class_CRACK_ALLIGATOR: "ਮਗਰਮੱਛ ਦਰਾਰ",

    report_title: "ਸੜਕ ਦੇ ਨੁਕਸਾਨ ਦੀ ਰਿਪੋਰਟ ਕਰੋ",
    report_subtitle: "ਨਗਰ ਨਿਗਮ ਨੂੰ ਖ਼ਤਰਨਾਕ ਸੜਕ ਹਾਲਤਾਂ ਸੁਧਾਰਨ ਵਿੱਚ ਮਦਦ ਕਰੋ।",
    take_photo: "ਸੜਕ ਦੀ ਫ਼ੋਟੋ ਲਵੋ",
    photo_captured: "ਫ਼ੋਟੋ ਲੱਗ ਗਈ",
    select_damage_type: "ਨੁਕਸ ਦੀ ਸ਼੍ਰੇਣੀ ਚੁਣੋ",
    description_placeholder: "ਲੈਂਡਮਾਰਕ ਜਾਂ ਖ਼ਾਸ ਸੜਕ ਹਾਲਤ ਦਾ ਵੇਰਵਾ ਦਿਓ...",
    gps_accuracy: "ਜੀਪੀਐੱਸ ਸ਼ੁੱਧਤਾ",
    gps_acquiring: "ਉੱਚ ਸ਼ੁੱਧਤਾ ਵਾਲਾ ਜੀਪੀਐੱਸ ਲੱਭਿਆ ਜਾ ਰਿਹਾ ਹੈ...",
    submit_report: "ਸ਼ਿਕਾਇਤ ਦਰਜ ਕਰੋ",
    submitting: "ਸਰਵਰ ਤੇ ਭੇਜਿਆ ਜਾ ਰਿਹਾ ਹੈ...",
    report_success: "ਸ਼ਿਕਾਇਤ ਸਫ਼ਲਤਾਪੂਰਵਕ ਦਰਜ ਹੋ ਗਈ!",
    recent_reports: "ਮੇਰੀਆਂ ਰਿਪੋਰਟਾਂ ਅਤੇ ਸਥਿਤੀ",
    upvote: "ਪੁਸ਼ਟੀ / ਸਮਰਥਨ",
    upvoted: "ਸਮਰਥਨ ਦਿੱਤਾ",
    confirm_repair: "ਮੁਰੰਮਤ ਦੀ ਪੁਸ਼ਟੀ ਕਰੋ",
    repair_confirmed: "ਨਾਗਰਿਕ ਵੱਲੋਂ ਮੁਰੰਮਤ ਦੀ ਤਸਦੀਕ ਕੀਤੀ ਗਈ",

    status_SUBMITTED: "ਦਰਜ ਹੋਈ",
    status_UNDER_REVIEW: "ਜਾਂਚ ਅਧੀਨ",
    status_VERIFIED: "ਤਸਦੀਕ ਹੋਈ",
    status_ASSIGNED: "ਕੰਮ ਸੌਂਪਿਆ ਗਿਆ",
    status_IN_PROGRESS: "ਮੁਰੰਮਤ ਜਾਰੀ ਹੈ",
    status_RESOLVED: "ਹੱਲ ਹੋ ਗਿਆ",
    status_REJECTED: "ਰੱਦ ਹੋਈ",

    drive_hud_title: "ਇੰਸਪੈਕਟਰ ਡਰਾਈਵ ਮੋਡ ਐੱਚਯੂਡੀ",
    drive_hud_disclaimer: "ਡਿਵਾਈਸ ਤੇ ਰੀਅਲ-ਟਾਈਮ ਐੱਜ ਡਿਟੈਕਸ਼ਨ ਚੱਲ ਰਹੀ ਹੈ। ਗੱਡੀ ਚੱਲਦੇ ਸਮੇਂ ਸਕ੍ਰੀਨ ਛੂਹਣਾ ਬੰਦ ਹੈ।",
    drive_handsfree_active: "ਹੈਂਡਸ-ਫ੍ਰੀ ਆਟੋ-ਟੈਗਿੰਗ ਚਾਲੂ",
    drive_fps: "ਅਨੁਮਾਨ ਐੱਫਪੀਐੱਸ",
    drive_latency: "ਲੇਟੈਂਸੀ",
    drive_speed: "ਗੱਡੀ ਦੀ ਰਫ਼ਤਾਰ",
    drive_detected_craters: "ਦਰਜ ਕੀਤੇ ਗਏ ਨੁਕਸ",
    drive_hazard_alert: "ਅੱਗੇ ਟੋਆ ਪਾਇਆ ਗਿਆ",
    drive_start_scan: "ਡਰਾਈਵ ਨਿਰੀਖਣ ਸ਼ੁਰੂ ਕਰੋ",
    drive_stop_scan: "ਡਰਾਈਵ ਨਿਰੀਖਣ ਖ਼ਤਮ ਕਰੋ",
    drive_model_status: "ਏਆਈ ਮਾਡਲ ਸਥਿਤੀ",
    model_ready: "ਓਐੱਨਐੱਨਐਕਸ ਰਨਟਾਈਮ ਮੋਬਾਈਲ (ਤਿਆਰ)",
    model_not_loaded: "ਮਾਡਲ ਲੋਡ ਨਹੀਂ ਹੋਇਆ",

    outbox_title: "ਆਫ਼ਲਾਈਨ ਆਊਟਬਾਕਸ ਕਤਾਰ",
    outbox_desc: "ਬਿਨਾਂ ਇੰਟਰਨੈੱਟ ਰਿਕਾਰਡ ਕੀਤੇ ਗਏ ਨਿਰੀਖਣ ਸੁਰੱਖਿਅਤ ਲੋਕਲ ਕਤਾਰ ਵਿੱਚ ਰੱਖੇ ਜਾਂਦੇ ਹਨ।",
    outbox_pending_count: "ਬਕਾਇਆ ਨਿਰੀਖਣ",
    outbox_sync_btn: "ਹੁਣੇ ਕਲਾਊਡ ਨਾਲ ਸਿੰਕ ਕਰੋ",
    outbox_syncing: "ਨਿਰੀਖਣ ਅੱਪਲੋਡ ਹੋ ਰਹੇ ਹਨ...",
    outbox_empty: "ਕਤਾਰ ਖ਼ਾਲੀ ਹੈ। ਸਭ ਕੁਝ ਸਿੰਕ ਹੋ ਗਿਆ।",
    outbox_delivered: "ਸਰਵਰ ਤੇ ਸਿੰਕ ਹੋ ਗਿਆ",
    outbox_privacy_blurred: "ਚਿਹਰੇ ਅਤੇ ਨੰਬਰ ਪਲੇਟਾਂ ਧੁੰਦਲੀਆਂ ਕੀਤੀਆਂ ਗਈਆਂ (ਨਿਯਮ R15)",

    checklist_title: "ਸੜਕ ਖੰਡ ਨਿਰੀਖਣ ਚੈੱਕਲਿਸਟ",
    scan_qr_segment: "ਸੜਕ ਖੰਡ ਕਿਊਆਰ ਕੋਡ ਸਕੈਨ ਕਰੋ",
    segment_scanned: "ਖੰਡ ਦੀ ਪਛਾਣ ਹੋ ਗਈ",
    inspection_items: "ਨਿਰੀਖਣ ਨੁਕਤੇ",
    item_surface: "ਸੜਕ ਦੀ ਸਤ੍ਹਾ ਅਤੇ ਟੋਇਆਂ ਦਾ ਜਾਇਜ਼ਾ",
    item_drainage: "ਨਿਕਾਸੀ ਅਤੇ ਪਾਣੀ ਭਰਨ ਦੀ ਹਾਲਤ",
    item_shoulder: "ਸੜਕ ਦਾ ਕਿਨਾਰਾ ਅਤੇ ਸੁਰੱਖਿਆ",
    item_markings: "ਲੇਨ ਮਾਰਕਿੰਗ ਅਤੇ ਪੈਦਲ ਰਸਤੇ",
    submit_inspection: "ਨਿਰੀਖਣ ਆਡਿਟ ਸਬਮਿਟ ਕਰੋ",
  },
};

