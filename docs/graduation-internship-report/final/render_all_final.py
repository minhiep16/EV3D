# -*- coding: utf-8 -*-
"""
render_all_final.py - Kết xuất toàn bộ 83 tệp PUML sang PNG chất lượng cao
Sử dụng PlantUML server với ThreadPoolExecutor và retry logic
"""
import os
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from plantuml import PlantUML

SOURCE_DIR = r"D:\EV3D\docs\graduation-internship-report\final\diagrams\source"
RENDERED_DIR = r"D:\EV3D\docs\graduation-internship-report\final\diagrams\rendered"
os.makedirs(RENDERED_DIR, exist_ok=True)

server = PlantUML(url='http://www.plantuml.com/plantuml/png/')

def render_one(filename):
    src_path = os.path.join(SOURCE_DIR, filename)
    base_name = os.path.splitext(filename)[0]
    dst_path = os.path.join(RENDERED_DIR, base_name + ".png")
    
    # Nếu file đã tồn tại và kích thước > 1KB thì bỏ qua
    if os.path.exists(dst_path) and os.path.getsize(dst_path) > 1024:
        return filename, True, "Already exists"
    
    for attempt in range(3):
        try:
            with open(src_path, "r", encoding="utf-8") as f:
                content = f.read()
            raw_png = server.processes(content)
            if raw_png and len(raw_png) > 100:
                with open(dst_path, "wb") as f_out:
                    f_out.write(raw_png)
                return filename, True, f"Rendered ({len(raw_png)} bytes)"
            else:
                time.sleep(1)
        except Exception as e:
            if attempt == 2:
                return filename, False, str(e)
            time.sleep(1.5)
    return filename, False, "Failed after 3 attempts"

def main():
    puml_files = [f for f in os.listdir(SOURCE_DIR) if f.endswith(".puml")]
    print(f"Total PUML files to process: {len(puml_files)}")
    
    success_count = 0
    failed_files = []
    
    with ThreadPoolExecutor(max_workers=6) as executor:
        futures = {executor.submit(render_one, f): f for f in puml_files}
        for future in as_completed(futures):
            fname, ok, msg = future.result()
            if ok:
                success_count += 1
                print(f"[OK] {fname}: {msg}")
            else:
                failed_files.append((fname, msg))
                print(f"[ERROR] {fname}: {msg}")
                
    print(f"\nRendered: {success_count}/{len(puml_files)}")
    if failed_files:
        print(f"Failed files ({len(failed_files)}):")
        for f, err in failed_files:
            print(f" - {f}: {err}")
    else:
        print("ALL DIAGRAMS RENDERED SUCCESSFULLY!")

if __name__ == "__main__":
    main()
