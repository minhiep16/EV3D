with open('D:/EV3D/docs/graduation-internship-report/final/build_v6_master_docx.py', 'r', encoding='utf-8') as f:
    lines = f.readlines()

print("=== UC GENERATION ===")
for i in range(370, min(415, len(lines))):
    print(f"{i+1}: {lines[i]}", end='')

print("\n=== TC GENERATION ===")
for i in range(590, min(635, len(lines))):
    print(f"{i+1}: {lines[i]}", end='')
