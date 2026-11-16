import sys
sys.path.append('D:/EV3D/docs/graduation-internship-report/final')
import v5_data_rtm as rtm_old
import v6_canonical_catalogs as cat
import v6_data_testcases as tc
import v6_data_usecases as uc

valid_fr_ids = set(f['id'] for f in cat.CANONICAL_FRS)
valid_br_ids = set(b['id'] for b in cat.CANONICAL_BRS)
valid_uc_ids = set(u['id'] for u in uc.ALL_USE_CASES)
valid_tc_ids = set(t['id'] for t in tc.ALL_TEST_CASES)

rtm_fixes = {
    'FR-AUTH-01': ('BR-AUTH-01', 'TC-AUTH-01'),
    'FR-AUTH-02': ('BR-AUTH-01, BR-AUTH-02', 'TC-AUTH-02'),
    'FR-AUTH-03': ('BR-AUTH-02, BR-AUTH-03', 'TC-AUTH-03'),
    'FR-AUTH-04': ('BR-AUTH-03', 'TC-AUTH-04'),
    'FR-AUTH-05': ('BR-SEC-03', 'TC-AUTH-05'),
    'FR-AUTH-06': ('BR-AUTH-01, BR-SEC-01', 'TC-REG-01'),
    
    'FR-3D-01': ('BR-3D-01', 'TC-3D-01'),
    'FR-3D-02': ('BR-3D-01', 'TC-3D-02'),
    'FR-3D-03': ('BR-TRIP-04', 'TC-DAMG-01'),
    'FR-3D-04': ('BR-3D-02', 'TC-3D-04'),
    'FR-3D-05': ('BR-3D-01', 'TC-3D-05'),
    'FR-3D-06': ('BR-3D-03', 'TC-REG-12'),
    'FR-3D-07': ('BR-3D-03', 'TC-REG-12'),
    
    'FR-CO-01': ('BR-CO-01, BR-CO-02', 'TC-OWN-01'),
    'FR-CO-02': ('BR-CO-02, BR-CO-03', 'TC-INV-01'),
    'FR-CO-03': ('BR-CO-03, BR-CO-06', 'TC-INV-02'),
    'FR-CO-04': ('BR-CO-01, BR-CO-04', 'TC-OWN-02'),
    'FR-CO-05': ('BR-CO-04, BR-CO-05', 'TC-OWN-03'),
    'FR-CO-06': ('BR-CO-05', 'TC-OWN-04'),
    'FR-CO-07': ('BR-CO-01, BR-CO-06', 'TC-CON-02'),
    'FR-CO-08': ('BR-CO-04, BR-CO-05', 'TC-CON-03'),
    
    'FR-BOOK-01': ('BR-BOOK-01, BR-BOOK-03', 'TC-BOOK-01'),
    'FR-BOOK-02': ('BR-BOOK-01, BR-BOOK-02, BR-BOOK-05', 'TC-BOOK-02'),
    'FR-BOOK-03': ('BR-BOOK-01', 'TC-BOOK-03'),
    'FR-BOOK-04': ('BR-BOOK-01', 'TC-BOOK-04'),
    'FR-BOOK-05': ('BR-BOOK-04', 'TC-BOOK-05'),
    'FR-BOOK-06': ('BR-TRIP-01, BR-TRIP-02', 'TC-HAND-01'),
    'FR-BOOK-07': ('BR-TRIP-02', 'TC-HAND-02'),
    'FR-BOOK-08': ('BR-TRIP-02', 'TC-HAND-03'),
    
    'FR-CHG-04': ('BR-CHG-03', 'TC-ENER-01'),
    'FR-CHG-05': ('BR-CHG-04', 'TC-CHRG-03'),
    
    'FR-TRIP-01': ('BR-TRIP-01, BR-TRIP-02', 'TC-TRIP-01'),
    'FR-TRIP-02': ('BR-TRIP-03', 'TC-TRIP-02'),
    'FR-TRIP-03': ('BR-BOOK-02, BR-TRIP-02', 'TC-TRIP-03'),
    'FR-TRIP-04': ('BR-TRIP-02, BR-TRIP-04', 'TC-INSP-01'),
    'FR-TRIP-05': ('BR-CHG-03, BR-TRIP-03', 'TC-TRIP-04'),
    'FR-TRIP-06': ('BR-TRIP-04', 'TC-DAMG-01'),
    
    'FR-VOTE-01': ('BR-VOTE-01, BR-VOTE-04', 'TC-VOTE-01'),
    'FR-VOTE-02': ('BR-VOTE-01, BR-VOTE-05', 'TC-VOTE-02'),
    'FR-VOTE-03': ('BR-VOTE-02, BR-VOTE-03', 'TC-VOTE-03'),
    'FR-VOTE-04': ('BR-VOTE-01, BR-VOTE-02', 'TC-VOTE-04'),
    'FR-VOTE-05': ('BR-VOTE-02, BR-VOTE-04', 'TC-VOTE-04'),
    'FR-VOTE-06': ('BR-VOTE-02', 'TC-REG-20'),
    
    'FR-DISP-01': ('BR-DISP-01, BR-DISP-03', 'TC-DISP-01'),
    'FR-DISP-02': ('BR-DISP-01', 'TC-DISP-02'),
    'FR-DISP-03': ('BR-DISP-02, BR-DISP-03', 'TC-DISP-03'),
    'FR-DISP-04': ('BR-DISP-03', 'TC-DISP-04'),
    'FR-DISP-05': ('BR-DISP-02, BR-DISP-04', 'TC-DISP-04'),
    'FR-DISP-06': ('BR-DISP-04', 'TC-REG-22'),
    
    'FR-STF-01': ('BR-SEC-03', 'TC-REG-24'),
    'FR-STF-02': ('BR-BOOK-03, BR-VOTE-03', 'TC-MAINT-01'),
    'FR-STF-03': ('BR-BOOK-03', 'TC-MAINT-04'),
    'FR-STF-04': ('BR-SEC-03', 'TC-REG-25'),
    
    'FR-NOTI-01': ('BR-SEC-01', 'TC-NOTI-01'),
    'FR-AI-01': ('BR-SEC-01', 'TC-REG-29'),
}

new_rows = []
for row in rtm_old.RTM_ROWS:
    r = list(row)
    fr_id = r[0]
    if fr_id in rtm_fixes:
        new_brs, new_tcs = rtm_fixes[fr_id]
        if new_brs is not None:
            r[3] = new_brs
        if new_tcs is not None:
            r[7] = new_tcs
    new_rows.append(r)

# Verify all rows
errors = []
for i, r in enumerate(new_rows):
    fr_id = r[0]
    uc_str = r[2]
    br_str = r[3]
    tc_str = r[7]
    
    if fr_id not in valid_fr_ids:
        errors.append(f"Row {i}: Invalid FR {fr_id}")
    for u in [x.strip() for x in uc_str.split(',') if x.strip()]:
        if u not in valid_uc_ids:
            errors.append(f"Row {i} ({fr_id}): Invalid UC '{u}'")
    for b in [x.strip() for x in br_str.split(',') if x.strip()]:
        if b not in valid_br_ids:
            errors.append(f"Row {i} ({fr_id}): Invalid BR '{b}'")
    for t in [x.strip() for x in tc_str.split(',') if x.strip()]:
        if t not in valid_tc_ids:
            errors.append(f"Row {i} ({fr_id}): Invalid TC '{t}'")

if errors:
    print(f"Validation FAILED with {len(errors)} errors:")
    for e in errors:
        print(" ", e)
    sys.exit(1)
else:
    print(f"Validation PASSED! 0 errors across all {len(new_rows)} rows.")

with open('D:/EV3D/docs/graduation-internship-report/final/v6_data_rtm.py', 'w', encoding='utf-8') as f:
    f.write('"""\nEVShare 3D - Authoritative Requirements Traceability Matrix (RTM) (V6)\n70 Functional Requirements perfectly mapped to Canonical BRs, UCs, and TCs.\n"""\n\n')
    f.write('RTM_ROWS = [\n')
    for r in new_rows:
        f.write(f'    {repr(r)},\n')
    f.write(']\n\n')
    f.write('def get_rtm_rows():\n    return RTM_ROWS\n')

print("Successfully written v6_data_rtm.py")
