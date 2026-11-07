path = "web/src/context/LanguageContext.tsx"
with open(path, "r", encoding="utf-8") as f:
    text = f.read()

replacements = [
    ('navScanner: "AI Scanner",', 'navScanner: "AI Scanner",\n    navMap: "GIS Map",'),
    ('navScanner: "एआई स्कैनर",', 'navScanner: "एआई स्कैनर",\n    navMap: "मानचित्र",'),
    ('navScanner: "ਏਆਈ ਸਕੈਨਰ",', 'navScanner: "ਏਆਈ ਸਕੈਨਰ",\n    navMap: "ਨਕਸ਼ਾ",'),
    ('navScanner: "AI ஸ்கேனர்",', 'navScanner: "AI ஸ்கேனர்",\n    navMap: "வரைபடம்",'),
    ('navScanner: "AI స్కానర్",', 'navScanner: "AI స్కానర్",\n    navMap: "నక్షా",'),
    ('navScanner: "এআই স্ক্যানার",', 'navScanner: "এআই স্ক্যানার",\n    navMap: "মানচিত্র",'),
]

for old, new in replacements:
    text = text.replace(old, new)

with open(path, "w", encoding="utf-8") as f:
    f.write(text)

print("Added navMap key across all 6 languages in LanguageContext.tsx")
