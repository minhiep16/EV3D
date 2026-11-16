import sys, re
sys.path.append('D:/EV3D/docs/graduation-internship-report/final')
import v5_data_usecases as uc

for u in uc.ALL_USE_CASES:
    for flow_type, flow_text in [('alt_flow', u.get('alt_flow', '')), ('exception_flow', u.get('exception_flow', ''))]:
        refs = re.findall(r'bước\s+(\d+)', flow_text, flags=re.IGNORECASE)
        if refs:
            print(f"{u['id']} - {flow_type}: refs {refs}")
