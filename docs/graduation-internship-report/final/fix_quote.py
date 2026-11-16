with open('D:/EV3D/docs/graduation-internship-report/final/v6_chapter6_7.py', 'r', encoding='utf-8') as f:
    text = f.read()

# Replace O'Reilly with O\'Reilly
text = text.replace("O'Reilly", "O\\'Reilly")

with open('D:/EV3D/docs/graduation-internship-report/final/v6_chapter6_7.py', 'w', encoding='utf-8') as f:
    f.write(text)

print("Fixed O'Reilly quote.")
