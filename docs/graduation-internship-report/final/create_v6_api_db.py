with open('D:/EV3D/docs/graduation-internship-report/final/v5_data_apis.py', 'r', encoding='utf-8') as f:
    text = f.read().replace('v5_', 'v6_').replace('V5', 'V6')
with open('D:/EV3D/docs/graduation-internship-report/final/v6_data_apis.py', 'w', encoding='utf-8') as f:
    f.write(text)

with open('D:/EV3D/docs/graduation-internship-report/final/v5_data_database.py', 'r', encoding='utf-8') as f:
    text = f.read().replace('v5_', 'v6_').replace('V5', 'V6')
with open('D:/EV3D/docs/graduation-internship-report/final/v6_data_database.py', 'w', encoding='utf-8') as f:
    f.write(text)

print("Created v6_data_apis.py and v6_data_database.py")
