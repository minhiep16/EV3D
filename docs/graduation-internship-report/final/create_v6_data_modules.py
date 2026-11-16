# Create v6_chapter1.py
with open('D:/EV3D/docs/graduation-internship-report/final/v5_chapter1.py', 'r', encoding='utf-8') as f:
    c1 = f.read().replace('v5_', 'v6_').replace('V5', 'V6')
with open('D:/EV3D/docs/graduation-internship-report/final/v6_chapter1.py', 'w', encoding='utf-8') as f:
    f.write(c1)

# Create v6_chapter3.py
with open('D:/EV3D/docs/graduation-internship-report/final/v5_chapter3.py', 'r', encoding='utf-8') as f:
    c3 = f.read().replace('v5_', 'v6_').replace('V5', 'V6')
with open('D:/EV3D/docs/graduation-internship-report/final/v6_chapter3.py', 'w', encoding='utf-8') as f:
    f.write(c3)

# Create v6_appendices_narratives.py
with open('D:/EV3D/docs/graduation-internship-report/final/v5_appendices_narratives.py', 'r', encoding='utf-8') as f:
    app = f.read().replace('v5_', 'v6_').replace('V5', 'V6')
with open('D:/EV3D/docs/graduation-internship-report/final/v6_appendices_narratives.py', 'w', encoding='utf-8') as f:
    f.write(app)

# Create v6_chapters_data.py
with open('D:/EV3D/docs/graduation-internship-report/final/v5_chapters_data.py', 'r', encoding='utf-8') as f:
    cd = f.read().replace('v5_', 'v6_').replace('V5', 'V6')
with open('D:/EV3D/docs/graduation-internship-report/final/v6_chapters_data.py', 'w', encoding='utf-8') as f:
    f.write(cd)

print("Created v6_chapter1.py, v6_chapter3.py, v6_appendices_narratives.py, and v6_chapters_data.py")
