import re
import json

def update_locale(file_path, replacements):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    for pattern, repl in replacements:
        content = re.sub(pattern, repl, content)
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

# Fix Duplicates and Mixing
ja_fixes = [
    (r'(高解像度\s*)+', r'高解像度'),
    (r'파일', r'ファイル'),
    (r'분촬영', r'分撮影'),
    (r'WEB用全原本ファイル提供', r'WEB用全原本ファイル提供'), # just to be sure
]

zh_fixes = [
    (r'(高分辨率\s*)+', r'高分辨率'),
    (r'网页용', r'网页用'),
    (r'(全量\s*)+', r'全量'),
]

ko_fixes = [
    (r'(고해상도\s*)+', r'고해상도'),
    (r'전체원본파일', r'전체 원본파일'),
]

en_fixes = [
    (r'(high-res\s*)+', r'high-res '),
    (r'(all\s*)+', r'all '),
]

update_locale('/Users/house/Pictures/fitgirlsme/src/i18n/locales/ja.json', ja_fixes)
update_locale('/Users/house/Pictures/fitgirlsme/src/i18n/locales/zh.json', zh_fixes)
update_locale('/Users/house/Pictures/fitgirlsme/src/i18n/locales/ko.json', ko_fixes)
update_locale('/Users/house/Pictures/fitgirlsme/src/i18n/locales/en.json', en_fixes)

print("Cleanup complete.")
