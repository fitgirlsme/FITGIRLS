import re
import json

def update_locale(file_path, replacements):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    for pattern, repl in replacements:
        content = re.sub(pattern, repl, content)
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

# Final Spacing Fixes
ko_fixes = [
    (r'고해상도보정', r'고해상도 보정'),
    (r'고해상도 보정\s+', r'고해상도 보정 '),
]

ja_fixes = [
    (r'高解像度補正\s+', r'高解像度補正'), # No space usually needed in Japanese
    (r'分 撮影', r'分撮影'),
]

en_fixes = [
    (r'high-resretouched', r'high-res retouched'),
    (r'high-res retouched', r'high-res retouched'), # ensure single space
]

update_locale('/Users/house/Pictures/fitgirlsme/src/i18n/locales/ko.json', ko_fixes)
update_locale('/Users/house/Pictures/fitgirlsme/src/i18n/locales/ja.json', ja_fixes)
update_locale('/Users/house/Pictures/fitgirlsme/src/i18n/locales/en.json', en_fixes)

print("Final spacing cleanup complete.")
