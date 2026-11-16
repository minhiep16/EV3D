# -*- coding: utf-8 -*-
"""
gen_group6_erd.py - Tạo các sơ đồ thực thể quan hệ cơ sở dữ liệu phân rã (ERD-01 đến ERD-08)
"""
import os

BASE_DIR = r"D:\EV3D\docs\graduation-internship-report\final\diagrams\source"
os.makedirs(BASE_DIR, exist_ok=True)

SKIN_HEADER = """
skinparam backgroundColor #FFFFFF
skinparam defaultFontName "Segoe UI"
skinparam defaultFontSize 11
skinparam roundCorner 8
skinparam shadowing false
skinparam handwritten false
skinparam ArrowColor #2C3E50
skinparam ArrowThickness 1.2
"""

erd_diagrams = {
    "erd_01_overall_conceptual.puml": f"""@startuml
title LƯỢC ĐỒ CƠ SỞ DỮ LIỆU TỔNG QUAN (CONCEPTUAL ERD)
{SKIN_HEADER}

entity "users" as users {{
    * id : CHAR(36) [PK]
    --
    email : VARCHAR(255)
    role : VARCHAR(20)
}}

entity "vehicles" as vehicles {{
    * id : CHAR(36) [PK]
    --
    vin : VARCHAR(50)
    license_plate : VARCHAR(20)
    status : VARCHAR(30)
}}

entity "co_ownership_groups" as groups {{
    * id : CHAR(36) [PK]
    --
    group_code : VARCHAR(50)
}}

entity "ownership_shares" as shares {{
    * id : CHAR(36) [PK]
    --
    percentage : DECIMAL(7,4)
}}

entity "bookings" as bookings {{
    * id : CHAR(36) [PK]
    --
    start_time : TIMESTAMP
    end_time : TIMESTAMP
    status : VARCHAR(30)
}}

entity "trips" as trips {{
    * id : CHAR(36) [PK]
    --
    energy_consumed_kwh : DECIMAL(8,3)
    status : VARCHAR(30)
}}

entity "vehicle_energy_inventories" as energy {{
    * id : CHAR(36) [PK]
    --
    available_energy_kwh : DECIMAL(12,3)
    weighted_avg_cost_per_kwh : DECIMAL(10,2)
}}

entity "expenses" as expenses {{
    * id : CHAR(36) [PK]
    --
    amount : DECIMAL(15,2)
    allocation_policy : VARCHAR(50)
}}

users ||--o{{ bookings
vehicles ||--o{{ bookings
bookings ||--o| trips
vehicles ||--|| energy
vehicles ||--|| groups
groups ||--|{{ shares
users ||--o{{ shares
vehicles ||--o{{ expenses

@enduml
""",

    "erd_02_auth_users.puml": f"""@startuml
title LƯỢC ĐỒ CƠ SỞ DỮ LIỆU: NGƯỜI DÙNG VÀ BẢO MẬT (ERD-02)
{SKIN_HEADER}

entity "users" as users {{
    * id : CHAR(36) [PK]
    --
    email : VARCHAR(255) [UNIQUE]
    password_hash : VARCHAR(255)
    full_name : VARCHAR(100)
    phone_number : VARCHAR(20)
    role : VARCHAR(20)
    status : VARCHAR(20)
    created_at : TIMESTAMP
    updated_at : TIMESTAMP
}}

entity "refresh_tokens" as refresh_tokens {{
    * id : CHAR(36) [PK]
    --
    * user_id : CHAR(36) [FK]
    token : VARCHAR(500) [UNIQUE]
    expiry_date : TIMESTAMP
    revoked : BOOLEAN
    created_at : TIMESTAMP
}}

entity "audit_logs" as audit_logs {{
    * id : CHAR(36) [PK]
    --
    user_id : CHAR(36) [FK]
    action : VARCHAR(100)
    entity_name : VARCHAR(50)
    entity_id : CHAR(36)
    details : TEXT
    ip_address : VARCHAR(50)
    created_at : TIMESTAMP
}}

users ||--o{{ refresh_tokens : owns
users ||--o{{ audit_logs : triggers

@enduml
""",

    "erd_03_vehicles_ownership.puml": f"""@startuml
title LƯỢC ĐỒ CƠ SỞ DỮ LIỆU: PHƯƠNG TIỆN VÀ ĐỒNG SỞ HỮU (ERD-03)
{SKIN_HEADER}

entity "vehicles" as vehicles {{
    * id : CHAR(36) [PK]
    --
    vin : VARCHAR(50) [UNIQUE]
    license_plate : VARCHAR(20) [UNIQUE]
    model_name : VARCHAR(100)
    exterior_color : VARCHAR(50)
    battery_capacity_kwh : DECIMAL(8,2)
    current_battery_level : INT
    current_odometer_km : DECIMAL(10,2)
    status : VARCHAR(30)
}}

entity "co_ownership_groups" as groups {{
    * id : CHAR(36) [PK]
    --
    group_code : VARCHAR(50) [UNIQUE]
    group_name : VARCHAR(100)
    max_members : INT
    status : VARCHAR(20)
}}

entity "group_members" as members {{
    * id : CHAR(36) [PK]
    --
    * group_id : CHAR(36) [FK]
    * user_id : CHAR(36) [FK]
    member_role : VARCHAR(20)
    joined_at : TIMESTAMP
    removed_at : TIMESTAMP
}}

entity "ownership_shares" as shares {{
    * id : CHAR(36) [PK]
    --
    * member_id : CHAR(36) [FK]
    * vehicle_id : CHAR(36) [FK]
    percentage : DECIMAL(7,4)
    capital_contribution : DECIMAL(15,2)
}}

entity "ownership_change_histories" as histories {{
    * id : CHAR(36) [PK]
    --
    * share_id : CHAR(36) [FK]
    change_type : VARCHAR(50)
    old_percentage : DECIMAL(7,4)
    new_percentage : DECIMAL(7,4)
    recorded_at : TIMESTAMP
}}

vehicles ||--|| groups
groups ||--|{{ members
members ||--|{{ shares
vehicles ||--o{{ shares
shares ||--o{{ histories

@enduml
""",

    "erd_04_bookings_trips_handovers.puml": f"""@startuml
title LƯỢC ĐỒ CƠ SỞ DỮ LIỆU: ĐẶT LỊCH, BÀN GIAO VÀ CHUYẾN ĐI (ERD-04)
{SKIN_HEADER}

entity "bookings" as bookings {{
    * id : CHAR(36) [PK]
    --
    * vehicle_id : CHAR(36) [FK]
    * user_id : CHAR(36) [FK]
    start_time : TIMESTAMP
    end_time : TIMESTAMP
    status : VARCHAR(30)
    purpose : VARCHAR(255)
    created_at : TIMESTAMP
}}

entity "vehicle_handovers" as handovers {{
    * id : CHAR(36) [PK]
    --
    * booking_id : CHAR(36) [FK, UNIQUE]
    * staff_user_id : CHAR(36) [FK]
    start_odometer : DECIMAL(10,2)
    start_battery_level : INT
    owner_condition_acknowledged_at : TIMESTAMP
    status : VARCHAR(30)
}}

entity "trips" as trips {{
    * id : CHAR(36) [PK]
    --
    * booking_id : CHAR(36) [FK, UNIQUE]
    * vehicle_id : CHAR(36) [FK]
    * user_id : CHAR(36) [FK]
    started_at : TIMESTAMP
    ended_at : TIMESTAMP
    start_odometer : DECIMAL(10,2)
    end_odometer : DECIMAL(10,2)
    start_battery_level : INT
    end_battery_level : INT
    energy_consumed_kwh : DECIMAL(8,3)
    return_requested_at : TIMESTAMP
    return_verified_by_user_id : CHAR(36) [FK]
    status : VARCHAR(30)
}}

entity "trip_extension_requests" as extensions {{
    * id : CHAR(36) [PK]
    --
    * trip_id : CHAR(36) [FK]
    requested_minutes : INT
    status : VARCHAR(30)
    reason : VARCHAR(255)
}}

bookings ||--|| handovers
bookings ||--o| trips
trips ||--o{{ extensions

@enduml
""",

    "erd_05_inspections_damages.puml": f"""@startuml
title LƯỢC ĐỒ CƠ SỞ DỮ LIỆU: KIỂM ĐỊNH VÀ HƯ HỎNG 3D (ERD-05)
{SKIN_HEADER}

entity "vehicle_inspections" as inspections {{
    * id : CHAR(36) [PK]
    --
    * vehicle_id : CHAR(36) [FK]
    * staff_user_id : CHAR(36) [FK]
    trip_id : CHAR(36) [FK]
    inspection_type : VARCHAR(30)
    overall_result : VARCHAR(30)
    verified_odometer : DECIMAL(10,2)
    verified_battery_level : INT
    inspected_at : TIMESTAMP
}}

entity "vehicle_inspection_items" as items {{
    * id : CHAR(36) [PK]
    --
    * inspection_id : CHAR(36) [FK]
    item_code : VARCHAR(50)
    item_name : VARCHAR(100)
    is_passed : BOOLEAN
    notes : VARCHAR(255)
}}

entity "damage_records" as damages {{
    * id : CHAR(36) [PK]
    --
    * vehicle_id : CHAR(36) [FK]
    inspection_id : CHAR(36) [FK]
    part_code : VARCHAR(50)
    severity : VARCHAR(20)
    description : VARCHAR(500)
    hotspot_x : DECIMAL(8,4)
    hotspot_y : DECIMAL(8,4)
    hotspot_z : DECIMAL(8,4)
    status : VARCHAR(30)
    reported_by_user_id : CHAR(36) [FK]
}}

inspections ||--|{{ items
inspections ||--o{{ damages

@enduml
""",

    "erd_06_charging_energy_inventory.puml": f"""@startuml
title LƯỢC ĐỒ CƠ SỞ DỮ LIỆU: TRẠM SẠC VÀ KHO NĂNG LƯỢNG WAC (ERD-06)
{SKIN_HEADER}

entity "charging_stations" as stations {{
    * id : CHAR(36) [PK]
    --
    station_code : VARCHAR(50) [UNIQUE]
    power_kw : DECIMAL(8,2)
    price_per_kwh : DECIMAL(10,2)
    status : VARCHAR(20)
}}

entity "charging_sessions" as sessions {{
    * id : CHAR(36) [PK]
    --
    * station_id : CHAR(36) [FK]
    * vehicle_id : CHAR(36) [FK]
    * user_id : CHAR(36) [FK]
    started_at : TIMESTAMP
    ended_at : TIMESTAMP
    energy_delivered_kwh : DECIMAL(8,3)
    stored_energy_kwh : DECIMAL(8,3)
    energy_loss_kwh : DECIMAL(8,3)
    session_cost : DECIMAL(15,2)
    status : VARCHAR(30)
}}

entity "vehicle_energy_inventories" as inventories {{
    * id : CHAR(36) [PK]
    --
    * vehicle_id : CHAR(36) [FK, UNIQUE]
    available_energy_kwh : DECIMAL(12,3)
    total_inventory_cost : DECIMAL(15,2)
    weighted_avg_cost_per_kwh : DECIMAL(10,2)
    total_energy_charged_kwh : DECIMAL(12,3)
    total_energy_consumed_kwh : DECIMAL(12,3)
    is_reconciliation_required : BOOLEAN
}}

entity "vehicle_energy_transactions" as transactions {{
    * id : CHAR(36) [PK]
    --
    * inventory_id : CHAR(36) [FK]
    source_reference_id : CHAR(36)
    transaction_type : VARCHAR(50)
    energy_amount_kwh : DECIMAL(8,3)
    unit_price_vnd : DECIMAL(10,2)
    total_amount_vnd : DECIMAL(15,2)
    recorded_at : TIMESTAMP
}}

stations ||--o{{ sessions
inventories ||--o{{ transactions

@enduml
""",

    "erd_07_expenses_payments.puml": f"""@startuml
title LƯỢC ĐỒ CƠ SỞ DỮ LIỆU: CHI PHÍ VÀ THANH TOÁN CÁ NHÂN (ERD-07)
{SKIN_HEADER}

entity "expenses" as expenses {{
    * id : CHAR(36) [PK]
    --
    * vehicle_id : CHAR(36) [FK]
    group_id : CHAR(36) [FK]
    created_by_user_id : CHAR(36) [FK]
    amount : DECIMAL(15,2)
    category : VARCHAR(50)
    allocation_policy : VARCHAR(50)
    status : VARCHAR(30)
    created_at : TIMESTAMP
}}

entity "expense_shares" as shares {{
    * id : CHAR(36) [PK]
    --
    * expense_id : CHAR(36) [FK]
    * user_id : CHAR(36) [FK]
    share_percentage : DECIMAL(7,4)
    share_amount : DECIMAL(15,2)
    status : VARCHAR(30)
}}

entity "personal_expense_payments" as payments {{
    * id : CHAR(36) [PK]
    --
    * expense_share_id : CHAR(36) [FK]
    * user_id : CHAR(36) [FK]
    amount : DECIMAL(15,2)
    payment_method : VARCHAR(50)
    reference_code : VARCHAR(100)
    status : VARCHAR(30)
    verified_by_user_id : CHAR(36) [FK]
    submitted_at : TIMESTAMP
    verified_at : TIMESTAMP
}}

expenses ||--|{{ shares
shares ||--o{{ payments

@enduml
""",

    "erd_08_contracts_voting_disputes.puml": f"""@startuml
title LƯỢC ĐỒ CƠ SỞ DỮ LIỆU: HỢP ĐỒNG, BIỂU QUYẾT VÀ TRANH CHẤP (ERD-08)
{SKIN_HEADER}

entity "co_ownership_contracts" as contracts {{
    * id : CHAR(36) [PK]
    --
    * vehicle_id : CHAR(36) [FK]
    contract_number : VARCHAR(50) [UNIQUE]
    created_at : TIMESTAMP
}}

entity "co_ownership_contract_versions" as versions {{
    * id : CHAR(36) [PK]
    --
    * contract_id : CHAR(36) [FK]
    version_number : INT
    terms_content : LONGTEXT
    status : VARCHAR(30)
    effective_from : TIMESTAMP
}}

entity "contract_acceptances" as acceptances {{
    * id : CHAR(36) [PK]
    --
    * version_id : CHAR(36) [FK]
    * user_id : CHAR(36) [FK]
    digital_signature_hash : VARCHAR(255)
    accepted_at : TIMESTAMP
}}

entity "vote_proposals" as proposals {{
    * id : CHAR(36) [PK]
    --
    * group_id : CHAR(36) [FK]
    * created_by_user_id : CHAR(36) [FK]
    title : VARCHAR(200)
    description : TEXT
    deadline : TIMESTAMP
    status : VARCHAR(30)
}}

entity "proposal_votes" as votes {{
    * id : CHAR(36) [PK]
    --
    * proposal_id : CHAR(36) [FK]
    * user_id : CHAR(36) [FK]
    vote_type : VARCHAR(20)
    weight : DECIMAL(7,4)
    cast_at : TIMESTAMP
}}

entity "disputes" as disputes {{
    * id : CHAR(36) [PK]
    --
    * vehicle_id : CHAR(36) [FK]
    * reported_by_user_id : CHAR(36) [FK]
    title : VARCHAR(200)
    status : VARCHAR(30)
    resolution_notes : TEXT
}}

contracts ||--|{{ versions
versions ||--o{{ acceptances
proposals ||--o{{ votes

@enduml
"""
}

for name, content in erd_diagrams.items():
    with open(os.path.join(BASE_DIR, name), "w", encoding="utf-8") as f:
        f.write(content)
    print(f"Generated {name}")

print("Group 6 (Database ERD) completed.")
