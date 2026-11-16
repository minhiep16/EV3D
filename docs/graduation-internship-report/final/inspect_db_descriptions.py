import sys
sys.path.append(r'D:\EV3D\docs\graduation-internship-report\final')
import v4_data_database as db

tables = db.get_all_tables()
print(f'Total tables: {len(tables)}')

with open(r'D:\EV3D\docs\graduation-internship-report\final\db_generic_cols.txt', 'w', encoding='utf-8') as f:
    for tname in sorted(tables.keys()):
        tinfo = tables[tname]
        f.write(f"\n=== BẢNG: {tname} (Mục đích: {tinfo.get('purpose', '')}) ===\n")
        for c in tinfo.get('columns', []):
            f.write(f"  - {c['name']} ({c['type']}, PK={c['pk']}, FK={c['fk']}, Null={c['nullable']}): {c['desc']}\n")

print("Wrote db_generic_cols.txt")
