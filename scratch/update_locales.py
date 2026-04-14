import re
import json

def update_locale(file_path, replacements):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    for pattern, repl in replacements:
        content = re.sub(pattern, repl, content)
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

# Update ja.json
ja_replacements = [
    (r'補正(\s*\d+\s*枚)', r'高解像度補正\1'),
    (r'トータル補正', r'トータル高解像度補正'),
    (r'WEB[用용]\s*(?:全体)?(?:全)?原本[파일ファイル]+提供', r'WEB用全原本파일提供'), # Keeping mixing for now if that's what they had, or unify? User said '웹용 전체 원본파일 제공'
    (r'(\d+)\s*[분分]\s*撮影', r'\1分撮影'),
    (r'(\d+)\s*[분分]\s*촬영', r'\1分撮影'),
    (r'ウォ원', r'ウォン'),
    (r'补正', r'補正'), # Fix Chinese char in Japanese file
]

# Better unify WEB description in Japanese
ja_replacements.append((r'WEB[用용].*?提供', r'WEB用全原本파일提供'))

# Update zh.json
zh_replacements = [
    (r'精修(\s*\d+\s*张)', r'高分辨率精修\1'),
    (r'总精修', r'总高分辨率精修'),
    (r'提供网页用(?:全部)?原片文件', r'提供网页用全量原片文件'),
    (r'网页용', r'网页用'),
]

update_locale('/Users/house/Pictures/fitgirlsme/src/i18n/locales/ja.json', ja_replacements)
update_locale('/Users/house/Pictures/fitgirlsme/src/i18n/locales/zh.json', zh_replacements)

print("Updates complete.")
