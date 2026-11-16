# -*- coding: utf-8 -*-
"""
render_remaining.py - Kết xuất các tệp PUML còn thiếu sang PNG
"""
import os
import sys
import time
from plantuml import PlantUML

SRC = r"D:\EV3D\docs\graduation-internship-report\final\diagrams\source"
DST = r"D:\EV3D\docs\graduation-internship-report\final\diagrams\rendered"
os.makedirs(DST, exist_ok=True)

server = PlantUML(url='http://www.plantuml.com/plantuml/png/')

def main():
    src_files = sorted([f for f in os.listdir(SRC) if f.endswith('.puml')])
    missing = []
    for f in src_files:
        png_name = f.replace('.puml', '.png')
        png_path = os.path.join(DST, png_name)
        if not os.path.exists(png_path) or os.path.getsize(png_path) < 500:
            missing.append(f)
            
    print(f"Total missing: {len(missing)}", flush=True)
    
    success = 0
    failed = []
    
    for idx, fname in enumerate(missing, 1):
        src_path = os.path.join(SRC, fname)
        dst_path = os.path.join(DST, fname.replace('.puml', '.png'))
        
        with open(src_path, "r", encoding="utf-8") as f:
            content = f.read()
            
        rendered = False
        for attempt in range(3):
            try:
                raw_png = server.processes(content)
                if raw_png and len(raw_png) > 100:
                    with open(dst_path, "wb") as f_out:
                        f_out.write(raw_png)
                    success += 1
                    rendered = True
                    print(f"[{idx}/{len(missing)}] OK: {fname} ({len(raw_png)} bytes)", flush=True)
                    time.sleep(0.3)
                    break
                else:
                    time.sleep(1)
            except Exception as e:
                time.sleep(1.5)
                
        if not rendered:
            failed.append(fname)
            print(f"[{idx}/{len(missing)}] FAILED: {fname}", flush=True)
            
    print(f"\nRendered: {success}/{len(missing)}", flush=True)
    if failed:
        print(f"Failed files: {failed}", flush=True)

if __name__ == "__main__":
    main()
