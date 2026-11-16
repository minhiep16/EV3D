with open('D:/EV3D/docs/graduation-internship-report/final/v6_chapter2.py', 'r', encoding='utf-8') as f:
    text = f.read()

old_fn = """def get_chapter_2_content():
    return CHAPTER_2_TITLE, CHAPTER_2_INTRO, CHAPTER_2_SECTIONS"""

new_fn = """def get_chapter_2():
    return {
        "title": CHAPTER_2_TITLE,
        "intro": CHAPTER_2_INTRO,
        "sections": CHAPTER_2_SECTIONS
    }

def get_chapter_2_content():
    return get_chapter_2()"""

assert old_fn in text, "old_fn not found!"
text = text.replace(old_fn, new_fn)

with open('D:/EV3D/docs/graduation-internship-report/final/v6_chapter2.py', 'w', encoding='utf-8') as f:
    f.write(text)

print("Updated get_chapter_2 in v6_chapter2.py")
