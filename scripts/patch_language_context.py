import re

path = "web/src/context/LanguageContext.tsx"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

replacements = [
    # English
    ('govtBanner: "Government of India | Ministry of Road Transport & Highways (MoRTH) & PWD"',
     'govtBanner: "Student Research Project | AI Road Defect & Municipal Workflow Portal (Not an official government portal)"'),
    ('standardsNotice: "IRC:SP:84-2019 & IRC:82-2023 Compliant"',
     'standardsNotice: "Severity rubric inspired by IRC:82-2023 (Clause 4.2)"'),
    ('appSubtitle: "National AI Road Defect & Pothole Redressal Portal"',
     'appSubtitle: "Autonomous Edge AI Pothole & Road Defect Portal (Student Research)"'),
    ('ircCompliantBadge: "IRC:SP:84-2019 Compliant"',
     'ircCompliantBadge: "IRC:82-2023 Inspired Rubric"'),
    ('footerNotice: "Government of India | Ministry of Road Transport & Highways (MoRTH) & PWD"',
     'footerNotice: "Student research project. Not an official government system. Not safety-certified."'),
    ('footerCompliance: "IRC:SP:84-2019 & IRC:82-2023 Compliant"',
     'footerCompliance: "Severity rubric inspired by IRC:82-2023 Clause 4.2 & IRC:SP:84-2019"'),
    ('allRightsReserved: "Government of India. All rights reserved."',
     'allRightsReserved: "Student Research Project. Open for academic and civic research."'),

    # Hindi
    ('govtBanner: "भारत सरकार | सड़क परिवहन एवं राजमार्ग मंत्रालय (MoRTH) एवं लोक निर्माण विभाग"',
     'govtBanner: "छात्र अनुसंधान परियोजना | सड़क एआई पोर्टल (गैर-सरकारी / अनुसंधान हेतु)"'),
    ('standardsNotice: "भारतीय सड़क कांग्रेस IRC:SP:84-2019 एवं IRC:82-2023 मानकीकृत"',
     'standardsNotice: "IRC:82-2023 (खण्ड 4.2) से प्रेरित गंभीरता मानक"'),
    ('appSubtitle: "राष्ट्रीय एआई सड़क दोष एवं गड्ढा निवारण पोर्टल"',
     'appSubtitle: "स्वायत्त एज एआई सड़क दोष एवं गड्ढा निवारण प्रणाली (छात्र अनुसंधान)"'),
    ('ircCompliantBadge: "भारतीय मानक IRC:SP:84-2019 अनुपालित"',
     'ircCompliantBadge: "IRC:82-2023 प्रेरित मानक"'),
    ('footerNotice: "भारत सरकार | सड़क परिवहन एवं राजमार्ग मंत्रालय (MoRTH) एवं लोक निर्माण विभाग"',
     'footerNotice: "छात्र अनुसंधान परियोजना। यह कोई आधिकारिक सरकारी प्रणाली नहीं है। सुरक्षा-प्रमाणित नहीं।"'),
    ('footerCompliance: "IRC:SP:84-2019 एवं IRC:82-2023 मानक अनुरूप"',
     'footerCompliance: "IRC:82-2023 (खण्ड 4.2) एवं IRC:SP:84-2019 से प्रेरित मानक"'),
    ('allRightsReserved: "भारत सरकार। सर्वाधिकार सुरक्षित।"',
     'allRightsReserved: "छात्र अनुसंधान परियोजना। शैक्षणिक एवं नागरिक अनुसंधान हेतु।"'),

    # Punjabi
    ('govtBanner: "ਭਾਰਤ ਸਰਕਾਰ | ਸੜਕ ਆਵਾਜਾਈ ਅਤੇ ਰਾਜਮਾਰਗ ਮੰਤਰਾਲਾ (MoRTH) ਤੇ ਲੋਕ ਨਿਰਮਾਣ ਵਿਭਾਗ"',
     'govtBanner: "ਵਿਦਿਆਰਥੀ ਖੋਜ ਪ੍ਰੋਜੈਕਟ | ਸੜਕ ਏਆਈ ਪੋਰਟਲ (ਗ਼ੈਰ-ਸਰਕਾਰੀ ਖੋਜ ਪ੍ਰਣਾਲੀ)"'),
    ('standardsNotice: "ਭਾਰਤੀ ਸੜਕ ਕਾਂਗਰਸ IRC:SP:84-2019 ਤੇ IRC:82-2023 ਮਾਨਕੀਕ੍ਰਿਤ"',
     'standardsNotice: "IRC:82-2023 (ਧਾਰਾ 4.2) ਤੋਂ ਪ੍ਰੇਰਿਤ ਗੰਭੀਰਤਾ ਰੂਬਰਿਕ"'),
    ('appSubtitle: "ਰਾਸ਼ਟਰੀ ਏਆਈ ਸੜਕ ਗੁਣਵੱਤਾ ਤੇ ਟੋਏ ਨਿਵਾਰਣ ਪੋਰਟਲ"',
     'appSubtitle: "ਏਆਈ ਸੜਕ ਗੁਣਵੱਤਾ ਤੇ ਟੋਏ ਨਿਵਾਰਣ ਪੋਰਟਲ (ਵਿਦਿਆਰਥੀ ਖੋਜ)"'),
    ('ircCompliantBadge: "IRC:SP:84-2019 ਅਨੁਕੂਲ"',
     'ircCompliantBadge: "IRC:82-2023 ਪ੍ਰੇਰਿਤ ਰੂਬਰਿਕ"'),
    ('footerNotice: "ਭਾਰਤ ਸਰਕਾਰ | ਸੜਕ ਆਵਾਜਾਈ ਅਤੇ ਰਾਜਮਾਰਗ ਮੰਤਰਾਲਾ ਤੇ ਲੋਕ ਨਿਰਮਾਣ ਵਿਭਾਗ"',
     'footerNotice: "ਵਿਦਿਆਰਥੀ ਖੋਜ ਪ੍ਰੋਜੈਕਟ। ਕੋਈ ਅਧਿਕਾਰਤ ਸਰਕਾਰੀ ਪ੍ਰਣਾਲੀ ਨਹੀਂ। ਸੁਰੱਖਿਆ-ਪ੍ਰਮਾਣਿਤ ਨਹੀਂ।"'),
    ('footerCompliance: "IRC:SP:84-2019 ਮਾਨਕਾਂ ਅਨੁਕੂਲ"',
     'footerCompliance: "IRC:82-2023 (ਧਾਰਾ 4.2) ਤੇ IRC:SP:84-2019 ਤੋਂ ਪ੍ਰੇਰਿਤ ਰੂਬਰਿਕ"'),
    ('allRightsReserved: "ਭਾਰਤ ਸਰਕਾਰ। ਸਾਰੇ ਹੱਕ ਰਾਖਵੇਂ ਹਨ।"',
     'allRightsReserved: "ਵਿਦਿਆਰਥੀ ਖੋਜ ਪ੍ਰੋਜੈਕਟ। ਅਕਾਦਮਿਕ ਖੋਜ ਹਿੱਤ ਉਪਲਬਧ।"'),

    # Tamil
    ('govtBanner: "இந்திய அரசு | சாலை போக்குவரத்து மற்றும் நெடுஞ்சாலைகள் அமைச்சகம் (MoRTH)"',
     'govtBanner: "மாணவர் ஆராய்ச்சி திட்டம் | சாலை AI தளம் (அரசு தளம் அல்ல)"'),
    ('standardsNotice: "இந்திய சாலை காங்கிரஸ் IRC:SP:84-2019 தரநிலை அங்கீகரிக்கப்பட்டது"',
     'standardsNotice: "IRC:82-2023 (பிரிவு 4.2) வழிகாட்டல்"'),
    ('appSubtitle: "தேசிய சாலை குறைபாடு மற்றும் குழி தீர்வு தளம்"',
     'appSubtitle: "சாலை குறைபாடு மற்றும் குழி கண்காணிப்பு தளம் (மாணவர் ஆய்வு)"'),
    ('ircCompliantBadge: "IRC:SP:84-2019 அங்கீகரிக்கப்பட்டது"',
     'ircCompliantBadge: "IRC:82-2023 வழிகாட்டல்"'),
    ('footerNotice: "இந்திய அரசு | சாலை போக்குவரத்து மற்றும் நெடுஞ்சாலைகள் அமைச்சகம் & PWD"',
     'footerNotice: "மாணவர் ஆராய்ச்சி திட்டம். அதிகாரப்பூர்வ அரசு அமைப்பு அல்ல. பாதுகாப்பு சான்றிதழ் பெறப்படவில்லை."'),
    ('footerCompliance: "IRC:SP:84-2019 தரநிலைகளுக்கு இணங்குகிறது"',
     'footerCompliance: "IRC:82-2023 (பிரிவு 4.2) மற்றும் IRC:SP:84-2019 வழிகாட்டல்"'),
    ('allRightsReserved: "இந்திய அரசு. அனைத்து உரிமைகளும் பாதுகாக்கப்பட்டவை."',
     'allRightsReserved: "மாணவர் ஆராய்ச்சி திட்டம். கல்வி மற்றும் ஆய்வு பயன்பாட்டிற்கு."'),

    # Telugu
    ('govtBanner: "భారత ప్రభుత్వం | రోడ్డు రవాణా మరియు రహదారుల మంత్రిత్వ శాఖ (MoRTH)"',
     'govtBanner: "విద్యార్థి పరిశోధన ప్రాజెక్ట్ | రోడ్డు AI పోర్టల్ (ప్రభుత్వ అధికారికం కాదు)"'),
    ('standardsNotice: "భారతీయ రోడ్డు కాంగ్రెస్ IRC:SP:84-2019 ప్రమాణాల ప్రకారం ఆమోదించబడింది"',
     'standardsNotice: "IRC:82-2023 (క్లాజ్ 4.2) ప్రేరిత తీవ్రత వర్గీకరణ"'),
    ('appSubtitle: "జాతీయ రోడ్డు నాణ్యత మరియు గుంతల నివారణ పోర్టల్"',
     'appSubtitle: "రోడ్డు నాణ్యత మరియు గుంతల పర్యవేక్షణ పోర్టల్ (పరిశోధన)"'),
    ('ircCompliantBadge: "IRC:SP:84-2019 నిబంధనల ప్రకారం"',
     'ircCompliantBadge: "IRC:82-2023 ఆధారితం"'),
    ('footerNotice: "భారత ప్రభుత్వం | రోడ్డు రవాణా మరియు రహదారుల మంత్రిత్వ శాఖ & PWD"',
     'footerNotice: "విద్యార్థి పరిశోధన ప్రాజెక్ట్. అధికారిక ప్రభుత్వ వ్యవస్థ కాదు. భద్రతా-ధృవీకరించబడలేదు."'),
    ('footerCompliance: "IRC:SP:84-2019 ప్రమాణాలకు అనుగుణంగా ఉంది"',
     'footerCompliance: "IRC:82-2023 (క్లాజ్ 4.2) మరియు IRC:SP:84-2019 ప్రమాణాల ప్రేరణ"'),
    ('allRightsReserved: "భారత ప్రభుత్వం. సర్వ హక్కులు ప్రత్యేకించబడ్డాయి."',
     'allRightsReserved: "విద్యార్థి పరిశోధన ప్రాజెక్ట్. విద్యా మరియు పరిశోధన ప్రయోజనాల కోసం."'),

    # Bengali
    ('govtBanner: "ভারত সরকার | সড়ক পরিবহন ও মহাসড়ক মন্ত্রক (MoRTH) এবং পূর্ত বিভাগ"',
     'govtBanner: "শিক্ষার্থী গবেষণা প্রকল্প | সড়ক AI পোর্টাল (সরকারী পোর্টাল নয়)"'),
    ('standardsNotice: "ভারতীয় সড়ক কংগ্রেস IRC:SP:84-2019 ও IRC:82-2023 অনুমোদিত"',
     'standardsNotice: "IRC:82-2023 (ধারা ৪.২) অনুপ্রাণিত তীব্রতা রুব্রিক"'),
    ('appSubtitle: "জাতীয় এআই সড়ক ত্রুটি ও গর্ত প্রতিকার পোর্টাল"',
     'appSubtitle: "স্বায়ত্তশাসিত এজ এআই সড়ক ত্রুটি ও গর্ত নজরদারি পোর্টাল (গবেষণা)"'),
    ('ircCompliantBadge: "IRC:SP:84-2019 অনুগত"',
     'ircCompliantBadge: "IRC:82-2023 অনুপ্রাণিত"'),
    ('footerNotice: "ভারত সরকার | সড়ক পরিবহন ও মহাসড়ক মন্ত্রক এবং পূর্ত বিভাগ"',
     'footerNotice: "শিক্ষার্থী গবেষণা প্রকল্প। কোনও সরকারী ব্যবস্থা নয়। সুরক্ষা-প্রত্যয়িত নয়।"'),
    ('footerCompliance: "IRC:SP:84-2019 মানদণ্ড অনুগত"',
     'footerCompliance: "IRC:82-2023 (ধারা ৪.২) ও IRC:SP:84-2019 অনুপ্রাণিত রুব্রিক"'),
    ('allRightsReserved: "ভারত সরকার। সর্বস্বত্ব সংরক্ষিত।"',
     'allRightsReserved: "শিক্ষার্থী গবেষণা প্রকল্প। প্রাতিষ্ঠানিক ও নাগরিক গবেষণার জন্য উন্মুক্ত।"'),
]

count = 0
for old, new in replacements:
    if old in content:
        content = content.replace(old, new)
        count += 1
    else:
        print(f"Warning: pattern not found: {old[:40]}...")

with open(path, "w", encoding="utf-8") as f:
    f.write(content)

print(f"Successfully applied {count}/{len(replacements)} replacements in LanguageContext.tsx")
