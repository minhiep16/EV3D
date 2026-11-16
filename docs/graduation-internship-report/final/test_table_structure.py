import docx

doc = docx.Document('D:/EV3D/docs/graduation-internship-report/final/BAO_CAO_THUC_TAP_TOT_NGHIEP_EVSHARE_3D_V6.docx')

uc_cnt = 0
tc_cnt = 0
db_cnt = 0
callout_cnt = 0

for t_idx, table in enumerate(doc.tables):
    rows_cnt = len(table.rows)
    cols_cnt = len(table.columns)
    
    if rows_cnt == 1 and cols_cnt == 1:
        callout_cnt += 1
    elif rows_cnt == 16 and cols_cnt == 2:
        uc_cnt += 1
    elif rows_cnt == 11 and cols_cnt == 2:
        tc_cnt += 1
    elif cols_cnt == 7 and rows_cnt > 1:
        header = [c.text.strip().lower() for c in table.rows[0].cells]
        if "tên cột" in header[0] or "kiểu dữ liệu" in header[1]:
            db_cnt += 1

print(f"Callouts (1x1): {callout_cnt}")
print(f"UC tables (16x2): {uc_cnt}")
print(f"TC tables (11x2): {tc_cnt}")
print(f"DB tables (7 cols): {db_cnt}")
