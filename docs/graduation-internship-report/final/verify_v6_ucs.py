import sys, re
sys.path.append('D:/EV3D/docs/graduation-internship-report/final')
import v6_data_usecases as uc

print(f"Total UCs: {len(uc.ALL_USE_CASES)}")
keywords = ['quỹ chung', 'quỹ bảo trì', 'shared_fund', 'sharedfund', 'quỹ tập trung']

invalid_steps = 0
for u in uc.ALL_USE_CASES:
    full_text = (u.get('name', '') + '\n' + 
                 u.get('description', '') + '\n' + 
                 u.get('main_flow', '') + '\n' + 
                 u.get('alt_flow', '') + '\n' + 
                 u.get('exception_flow', ''))
    
    # check keywords in flows
    for kw in keywords:
        for flow_type in ['main_flow', 'alt_flow', 'exception_flow']:
            txt = u.get(flow_type, '').lower()
            if kw in txt:
                # ignore historical note in UC-FIN-07 main_flow step 4
                if u['id'] == 'UC-FIN-07' and 'lịch sử các khoản đóng góp quỹ cũ' in txt:
                    continue
                print(f"[ACTIVE FUND KEYWORD '{kw}'] found in {u['id']} ({flow_type})")

    # count main flow steps
    steps = re.findall(r'^\s*(\d+)\.', u.get('main_flow', ''), flags=re.MULTILINE)
    max_step = max([int(s) for s in steps]) if steps else 0
    
    # find step refs in alt_flow and exception_flow
    for flow_type, flow_text in [('alt_flow', u.get('alt_flow', '')), ('exception_flow', u.get('exception_flow', ''))]:
        refs = re.findall(r'bước\s+(\d+)', flow_text, flags=re.IGNORECASE)
        for r in refs:
            if int(r) > max_step:
                print(f"[INVALID STEP REF] {u['id']}: {flow_type} refers to step {r}, but max step in main_flow is {max_step}!")
                invalid_steps += 1

print(f"Total invalid step references: {invalid_steps}")
