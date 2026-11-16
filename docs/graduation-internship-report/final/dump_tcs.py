import sys
sys.path.append(r'D:\EV3D\docs\graduation-internship-report\final')
import v4_data_testcases as tc
tcs = tc.get_all_test_cases()
with open(r'D:\EV3D\docs\graduation-internship-report\final\tcs_dump.txt', 'w', encoding='utf-8') as f:
    for t in tcs:
        f.write(f"{t['id']}: req={t.get('req_id')} | uc={t.get('related_uc')} | {t.get('name')}\n")
print(f'Wrote {len(tcs)} test cases to tcs_dump.txt')
