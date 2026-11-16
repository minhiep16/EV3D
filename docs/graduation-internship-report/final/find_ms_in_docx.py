import docx

doc = docx.Document('D:/EV3D/docs/graduation-internship-report/final/BAO_CAO_THUC_TAP_TOT_NGHIEP_EVSHARE_3D_V6.docx')

print("Searching paragraphs...")
for i, p in enumerate(doc.paragraphs):
    for kw in ['microservice', 'vi dịch vụ']:
        if kw in p.text.lower():
            print(f"Paragraph {i} [{kw}]: {p.text[:120]}")

print("\nSearching tables...")
for t_idx, t in enumerate(doc.tables):
    for r_idx, r in enumerate(t.rows):
        for c_idx, c in enumerate(r.cells):
            for kw in ['microservice', 'vi dịch vụ']:
                if kw in c.text.lower():
                    print(f"Table {t_idx} Row {r_idx} Col {c_idx} [{kw}]: {c.text[:120]}")
