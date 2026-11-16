import sys
sys.path.append('D:/EV3D/docs/graduation-internship-report/final')

import v6_canonical_catalogs as cat
import v6_data_rtm as rtm
import v6_data_usecases as uc
import v6_data_testcases as tc
import v6_data_apis as apis
import v6_data_database as db
import v6_chapter1 as c1
import v6_chapter2 as c2
import v6_chapter3 as c3
import v6_chapter5 as c5
import v6_chapter6_7 as c67
import v6_appendices_narratives as app
import v6_chapters_data as cd

print("=== V6 MODULE AUDIT ===")
print("Canonical FRs:", len(cat.CANONICAL_FRS))
print("Canonical BRs:", len(cat.CANONICAL_BRS))
print("RTM rows:", len(rtm.RTM_ROWS))
print("Use Cases:", len(uc.ALL_USE_CASES))
print("Test Cases:", len(tc.ALL_TEST_CASES))
print("APIs:", len(apis.ALL_APIS))
print("DB Tables:", len(db.ALL_TABLES))
print("Chapter 2 sections:", len(c2.CHAPTER_2_SECTIONS))
print("Chapter 5 sections:", len(c5.CHAPTER_5_SECTIONS))
print("Chapter 6 sections:", len(c67.CHAPTER_6['sections']))
print("Chapter 7 sections:", len(c67.CHAPTER_7['sections']))
print("Bibliography entries:", len(c67.BIBLIOGRAPHY))
print("Appendices:", len(app.APPENDICES_NARRATIVES))
print("All modules loaded successfully!")
