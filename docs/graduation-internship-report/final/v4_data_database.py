# -*- coding: utf-8 -*-
"""
v4_data_database.py - Từ điển dữ liệu CSDL quan hệ 51 bảng chuẩn hóa snake_case và FK chính xác cho Báo cáo V4
"""

TABLES = {
    "audit_logs": {
        "name": "audit_logs",
        "purpose": "Nhật ký kiểm toán an ninh và truy vết thao tác của quản trị viên và người dùng",
        "columns": [
            {
                "name": "id",
                "type": "VARCHAR(36)",
                "pk": "YES",
                "fk": "NO",
                "nullable": "NO",
                "default": "None",
                "unique": "NO",
                "desc": "Khóa chính định danh duy nhất của bản ghi (UUID v4 / Long Auto-increment)"
            },
            {
                "name": "actor_id",
                "type": "VARCHAR(36)",
                "pk": "NO",
                "fk": "YES (FK -> actors.id)",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu actor_id lưu trữ thuộc tính nghiệp vụ của audit_logs"
            },
            {
                "name": "actor_name",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu actor_name lưu trữ thuộc tính nghiệp vụ của audit_logs"
            },
            {
                "name": "actor_email",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Địa chỉ thư điện tử xác thực của người dùng"
            },
            {
                "name": "actor_role",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu actor_role lưu trữ thuộc tính nghiệp vụ của audit_logs"
            },
            {
                "name": "action",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu action lưu trữ thuộc tính nghiệp vụ của audit_logs"
            },
            {
                "name": "resource_type",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu resource_type lưu trữ thuộc tính nghiệp vụ của audit_logs"
            },
            {
                "name": "resource_id",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "YES (FK -> resources.id)",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu resource_id lưu trữ thuộc tính nghiệp vụ của audit_logs"
            },
            {
                "name": "previous_state",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu previous_state lưu trữ thuộc tính nghiệp vụ của audit_logs"
            },
            {
                "name": "new_state",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu new_state lưu trữ thuộc tính nghiệp vụ của audit_logs"
            },
            {
                "name": "description",
                "type": "TEXT",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Nội dung văn bản ghi chú chi tiết hoặc giải trình nguyên nhân"
            },
            {
                "name": "ip_address",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu ip_address lưu trữ thuộc tính nghiệp vụ của audit_logs"
            },
            {
                "name": "created_at",
                "type": "DATETIME",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Thời điểm tạo bản ghi lần đầu trong hệ thống (UTC ISO 8601 Timestamp)"
            },
        ]
    },
    "bookings": {
        "name": "bookings",
        "purpose": "Quản lý lịch đặt xe của các thành viên, thời gian bắt đầu/kết thúc và mục đích",
        "columns": [
            {
                "name": "id",
                "type": "VARCHAR(36)",
                "pk": "YES",
                "fk": "NO",
                "nullable": "NO",
                "default": "None",
                "unique": "NO",
                "desc": "Khóa chính định danh duy nhất của bản ghi (UUID v4 / Long Auto-increment)"
            },
            {
                "name": "vehicle",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu vehicle lưu trữ thuộc tính nghiệp vụ của bookings"
            },
            {
                "name": "user",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu user lưu trữ thuộc tính nghiệp vụ của bookings"
            },
            {
                "name": "start_time",
                "type": "DATETIME",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu start_time lưu trữ thuộc tính nghiệp vụ của bookings"
            },
            {
                "name": "end_time",
                "type": "DATETIME",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu end_time lưu trữ thuộc tính nghiệp vụ của bookings"
            },
            {
                "name": "purpose",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu purpose lưu trữ thuộc tính nghiệp vụ của bookings"
            },
            {
                "name": "created_at",
                "type": "DATETIME",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Thời điểm tạo bản ghi lần đầu trong hệ thống (UTC ISO 8601 Timestamp)"
            },
            {
                "name": "updated_at",
                "type": "DATETIME",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Thời điểm cập nhật bản ghi gần nhất trong hệ thống (UTC Timestamp)"
            },
        ]
    },
    "charging_sessions": {
        "name": "charging_sessions",
        "purpose": "Quản lý các phiên sạc pin thực tế: Điện nạp thô, điện lưu kho (92%), tổn hao (8%)",
        "columns": [
            {
                "name": "id",
                "type": "VARCHAR(36)",
                "pk": "YES",
                "fk": "NO",
                "nullable": "NO",
                "default": "None",
                "unique": "NO",
                "desc": "Khóa chính định danh duy nhất của bản ghi (UUID v4 / Long Auto-increment)"
            },
            {
                "name": "vehicle",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu vehicle lưu trữ thuộc tính nghiệp vụ của charging_sessions"
            },
            {
                "name": "charging_station",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu charging_station lưu trữ thuộc tính nghiệp vụ của charging_sessions"
            },
            {
                "name": "status",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trạng thái vòng đời của bản ghi trong quy trình nghiệp vụ charging_sessions"
            },
            {
                "name": "started_by",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu started_by lưu trữ thuộc tính nghiệp vụ của charging_sessions"
            },
            {
                "name": "started_at",
                "type": "DATETIME",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu started_at lưu trữ thuộc tính nghiệp vụ của charging_sessions"
            },
            {
                "name": "ended_at",
                "type": "DATETIME",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu ended_at lưu trữ thuộc tính nghiệp vụ của charging_sessions"
            },
            {
                "name": "start_soc_percent",
                "type": "DECIMAL(12,2)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Thông số trạng thái dung lượng pin xe điện (SOC % hoặc kWh)"
            },
            {
                "name": "current_soc_percent",
                "type": "DECIMAL(12,2)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Thông số trạng thái dung lượng pin xe điện (SOC % hoặc kWh)"
            },
            {
                "name": "target_soc_percent",
                "type": "DECIMAL(12,2)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Thông số trạng thái dung lượng pin xe điện (SOC % hoặc kWh)"
            },
            {
                "name": "energy_delivered_kwh",
                "type": "DECIMAL(12,2)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu energy_delivered_kwh lưu trữ thuộc tính nghiệp vụ của charging_sessions"
            },
            {
                "name": "stored_energy_kwh",
                "type": "DECIMAL(12,2)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu stored_energy_kwh lưu trữ thuộc tính nghiệp vụ của charging_sessions"
            },
            {
                "name": "tariff_per_kwh",
                "type": "DECIMAL(12,2)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu tariff_per_kwh lưu trữ thuộc tính nghiệp vụ của charging_sessions"
            },
            {
                "name": "charging_cost",
                "type": "DECIMAL(12,2)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu charging_cost lưu trữ thuộc tính nghiệp vụ của charging_sessions"
            },
            {
                "name": "energy_loss_kwh",
                "type": "DECIMAL(12,2)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu energy_loss_kwh lưu trữ thuộc tính nghiệp vụ của charging_sessions"
            },
            {
                "name": "power_kw",
                "type": "DECIMAL(12,2)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu power_kw lưu trữ thuộc tính nghiệp vụ của charging_sessions"
            },
            {
                "name": "completion_reason",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Nội dung văn bản ghi chú chi tiết hoặc giải trình nguyên nhân"
            },
            {
                "name": "created_at",
                "type": "DATETIME",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Thời điểm tạo bản ghi lần đầu trong hệ thống (UTC ISO 8601 Timestamp)"
            },
            {
                "name": "updated_at",
                "type": "DATETIME",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Thời điểm cập nhật bản ghi gần nhất trong hệ thống (UTC Timestamp)"
            },
        ]
    },
    "charging_stations": {
        "name": "charging_stations",
        "purpose": "Danh mục trụ sạc điện thông minh trong bãi đỗ: Loại cổng, công suất kW, đơn giá",
        "columns": [
            {
                "name": "id",
                "type": "VARCHAR(36)",
                "pk": "YES",
                "fk": "NO",
                "nullable": "NO",
                "default": "None",
                "unique": "NO",
                "desc": "Khóa chính định danh duy nhất của bản ghi (UUID v4 / Long Auto-increment)"
            },
            {
                "name": "code",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "YES",
                "desc": "Trường dữ liệu code lưu trữ thuộc tính nghiệp vụ của charging_stations"
            },
            {
                "name": "name",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "YES",
                "desc": "Trường dữ liệu name lưu trữ thuộc tính nghiệp vụ của charging_stations"
            },
            {
                "name": "status",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trạng thái vòng đời của bản ghi trong quy trình nghiệp vụ charging_stations"
            },
            {
                "name": "max_power_kw",
                "type": "DECIMAL(12,2)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu max_power_kw lưu trữ thuộc tính nghiệp vụ của charging_stations"
            },
            {
                "name": "connector_type",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu connector_type lưu trữ thuộc tính nghiệp vụ của charging_stations"
            },
            {
                "name": "location_label",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu location_label lưu trữ thuộc tính nghiệp vụ của charging_stations"
            },
            {
                "name": "pos_x",
                "type": "DECIMAL(12,2)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu pos_x lưu trữ thuộc tính nghiệp vụ của charging_stations"
            },
            {
                "name": "pos_y",
                "type": "DECIMAL(12,2)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu pos_y lưu trữ thuộc tính nghiệp vụ của charging_stations"
            },
            {
                "name": "pos_z",
                "type": "DECIMAL(12,2)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu pos_z lưu trữ thuộc tính nghiệp vụ của charging_stations"
            },
            {
                "name": "created_at",
                "type": "DATETIME",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Thời điểm tạo bản ghi lần đầu trong hệ thống (UTC ISO 8601 Timestamp)"
            },
            {
                "name": "updated_at",
                "type": "DATETIME",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Thời điểm cập nhật bản ghi gần nhất trong hệ thống (UTC Timestamp)"
            },
        ]
    },
    "co_ownership_contract_versions": {
        "name": "co_ownership_contract_versions",
        "purpose": "Các phiên bản hợp đồng pháp lý (DRAFT -> ACTIVE -> SUPERSEDED)",
        "columns": [
            {
                "name": "id",
                "type": "VARCHAR(36)",
                "pk": "YES",
                "fk": "NO",
                "nullable": "NO",
                "default": "None",
                "unique": "NO",
                "desc": "Khóa chính định danh duy nhất của bản ghi (UUID v4 / Long Auto-increment)"
            },
            {
                "name": "contract",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu contract lưu trữ thuộc tính nghiệp vụ của co_ownership_contract_versions"
            },
            {
                "name": "version_number",
                "type": "INT",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "0",
                "unique": "NO",
                "desc": "Trường dữ liệu version_number lưu trữ thuộc tính nghiệp vụ của co_ownership_contract_versions"
            },
            {
                "name": "title",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu title lưu trữ thuộc tính nghiệp vụ của co_ownership_contract_versions"
            },
            {
                "name": "content_snapshot",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu content_snapshot lưu trữ thuộc tính nghiệp vụ của co_ownership_contract_versions"
            },
            {
                "name": "content_hash",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu content_hash lưu trữ thuộc tính nghiệp vụ của co_ownership_contract_versions"
            },
            {
                "name": "ownership_snapshot",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu ownership_snapshot lưu trữ thuộc tính nghiệp vụ của co_ownership_contract_versions"
            },
            {
                "name": "voting_rule_snapshot",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu voting_rule_snapshot lưu trữ thuộc tính nghiệp vụ của co_ownership_contract_versions"
            },
            {
                "name": "financial_rule_snapshot",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu financial_rule_snapshot lưu trữ thuộc tính nghiệp vụ của co_ownership_contract_versions"
            },
            {
                "name": "effective_from",
                "type": "DATETIME",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu effective_from lưu trữ thuộc tính nghiệp vụ của co_ownership_contract_versions"
            },
            {
                "name": "effective_until",
                "type": "DATETIME",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu effective_until lưu trữ thuộc tính nghiệp vụ của co_ownership_contract_versions"
            },
            {
                "name": "created_by_user",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu created_by_user lưu trữ thuộc tính nghiệp vụ của co_ownership_contract_versions"
            },
            {
                "name": "created_at",
                "type": "DATETIME",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Thời điểm tạo bản ghi lần đầu trong hệ thống (UTC ISO 8601 Timestamp)"
            },
            {
                "name": "activated_at",
                "type": "DATETIME",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu activated_at lưu trữ thuộc tính nghiệp vụ của co_ownership_contract_versions"
            },
        ]
    },
    "co_ownership_contracts": {
        "name": "co_ownership_contracts",
        "purpose": "Hợp đồng khung đồng sở hữu phương tiện",
        "columns": [
            {
                "name": "id",
                "type": "VARCHAR(36)",
                "pk": "YES",
                "fk": "NO",
                "nullable": "NO",
                "default": "None",
                "unique": "NO",
                "desc": "Khóa chính định danh duy nhất của bản ghi (UUID v4 / Long Auto-increment)"
            },
            {
                "name": "group",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu group lưu trữ thuộc tính nghiệp vụ của co_ownership_contracts"
            },
            {
                "name": "vehicle",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu vehicle lưu trữ thuộc tính nghiệp vụ của co_ownership_contracts"
            },
            {
                "name": "contract_code",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "YES",
                "desc": "Trường dữ liệu contract_code lưu trữ thuộc tính nghiệp vụ của co_ownership_contracts"
            },
            {
                "name": "current_version",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu current_version lưu trữ thuộc tính nghiệp vụ của co_ownership_contracts"
            },
            {
                "name": "created_by_user",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu created_by_user lưu trữ thuộc tính nghiệp vụ của co_ownership_contracts"
            },
            {
                "name": "created_at",
                "type": "DATETIME",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Thời điểm tạo bản ghi lần đầu trong hệ thống (UTC ISO 8601 Timestamp)"
            },
            {
                "name": "updated_at",
                "type": "DATETIME",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Thời điểm cập nhật bản ghi gần nhất trong hệ thống (UTC Timestamp)"
            },
        ]
    },
    "co_ownership_groups": {
        "name": "co_ownership_groups",
        "purpose": "Định danh nhóm đồng sở hữu phương tiện, quy chế vận hành và số thành viên",
        "columns": [
            {
                "name": "id",
                "type": "VARCHAR(36)",
                "pk": "YES",
                "fk": "NO",
                "nullable": "NO",
                "default": "None",
                "unique": "NO",
                "desc": "Khóa chính định danh duy nhất của bản ghi (UUID v4 / Long Auto-increment)"
            },
            {
                "name": "name",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu name lưu trữ thuộc tính nghiệp vụ của co_ownership_groups"
            },
            {
                "name": "vehicle_id",
                "type": "VARCHAR(36)",
                "pk": "NO",
                "fk": "YES (FK -> vehicles.id)",
                "nullable": "YES",
                "default": "NULL",
                "unique": "YES",
                "desc": "Khóa ngoại liên kết tới phương tiện xe điện liên quan (FK -> vehicles.id)"
            },
            {
                "name": "created_by",
                "type": "VARCHAR(36)",
                "pk": "NO",
                "fk": "YES (FK -> users.id)",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Khóa ngoại liên kết người dùng tạo bản ghi (FK -> users.id)"
            },
            {
                "name": "created_at",
                "type": "DATETIME",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Thời điểm tạo bản ghi lần đầu trong hệ thống (UTC ISO 8601 Timestamp)"
            },
            {
                "name": "updated_at",
                "type": "DATETIME",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Thời điểm cập nhật bản ghi gần nhất trong hệ thống (UTC Timestamp)"
            },
        ]
    },
    "contract_acceptances": {
        "name": "contract_acceptances",
        "purpose": "Chữ ký điện tử mô phỏng (DEMO Signature) và thời điểm ký của từng chủ xe",
        "columns": [
            {
                "name": "id",
                "type": "VARCHAR(36)",
                "pk": "YES",
                "fk": "NO",
                "nullable": "NO",
                "default": "None",
                "unique": "NO",
                "desc": "Khóa chính định danh duy nhất của bản ghi (UUID v4 / Long Auto-increment)"
            },
            {
                "name": "contract_version",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu contract_version lưu trữ thuộc tính nghiệp vụ của contract_acceptances"
            },
            {
                "name": "user",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu user lưu trữ thuộc tính nghiệp vụ của contract_acceptances"
            },
            {
                "name": "accepted_at",
                "type": "DATETIME",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu accepted_at lưu trữ thuộc tính nghiệp vụ của contract_acceptances"
            },
            {
                "name": "content_hash_at_acceptance",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu content_hash_at_acceptance lưu trữ thuộc tính nghiệp vụ của contract_acceptances"
            },
            {
                "name": "ip_address",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu ip_address lưu trữ thuộc tính nghiệp vụ của contract_acceptances"
            },
            {
                "name": "user_agent",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu user_agent lưu trữ thuộc tính nghiệp vụ của contract_acceptances"
            },
            {
                "name": "created_at",
                "type": "DATETIME",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Thời điểm tạo bản ghi lần đầu trong hệ thống (UTC ISO 8601 Timestamp)"
            },
        ]
    },
    "damage_records": {
        "name": "damage_records",
        "purpose": "Ghi nhận vết hư hại thân vỏ: Vị trí bộ phận, mức độ, ảnh chụp và tọa độ Hotspot 3D",
        "columns": [
            {
                "name": "id",
                "type": "VARCHAR(36)",
                "pk": "YES",
                "fk": "NO",
                "nullable": "NO",
                "default": "None",
                "unique": "NO",
                "desc": "Khóa chính định danh duy nhất của bản ghi (UUID v4 / Long Auto-increment)"
            },
            {
                "name": "vehicle",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu vehicle lưu trữ thuộc tính nghiệp vụ của damage_records"
            },
            {
                "name": "trip",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu trip lưu trữ thuộc tính nghiệp vụ của damage_records"
            },
            {
                "name": "booking",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu booking lưu trữ thuộc tính nghiệp vụ của damage_records"
            },
            {
                "name": "handover",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu handover lưu trữ thuộc tính nghiệp vụ của damage_records"
            },
            {
                "name": "vehicle_part_code",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu vehicle_part_code lưu trữ thuộc tính nghiệp vụ của damage_records"
            },
            {
                "name": "damage_type",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu damage_type lưu trữ thuộc tính nghiệp vụ của damage_records"
            },
            {
                "name": "severity",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu severity lưu trữ thuộc tính nghiệp vụ của damage_records"
            },
            {
                "name": "note",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Nội dung văn bản ghi chú chi tiết hoặc giải trình nguyên nhân"
            },
            {
                "name": "resolved_at",
                "type": "DATETIME",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu resolved_at lưu trữ thuộc tính nghiệp vụ của damage_records"
            },
            {
                "name": "resolved_by_maintenance_request_id",
                "type": "VARCHAR(36)",
                "pk": "NO",
                "fk": "YES (FK -> resolved_by_maintenance_requests.id)",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu resolved_by_maintenance_request_id lưu trữ thuộc tính nghiệp vụ của damage_records"
            },
            {
                "name": "local_position_x",
                "type": "DECIMAL(12,2)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu local_position_x lưu trữ thuộc tính nghiệp vụ của damage_records"
            },
            {
                "name": "local_position_y",
                "type": "DECIMAL(12,2)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu local_position_y lưu trữ thuộc tính nghiệp vụ của damage_records"
            },
            {
                "name": "local_position_z",
                "type": "DECIMAL(12,2)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu local_position_z lưu trữ thuộc tính nghiệp vụ của damage_records"
            },
            {
                "name": "created_by",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "YES (FK -> users.id)",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Khóa ngoại liên kết người dùng tạo bản ghi (FK -> users.id)"
            },
            {
                "name": "created_at",
                "type": "DATETIME",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Thời điểm tạo bản ghi lần đầu trong hệ thống (UTC ISO 8601 Timestamp)"
            },
            {
                "name": "updated_at",
                "type": "DATETIME",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Thời điểm cập nhật bản ghi gần nhất trong hệ thống (UTC Timestamp)"
            },
        ]
    },
    "dispute_action_logs": {
        "name": "dispute_action_logs",
        "purpose": "Quản lý thực thể DisputeActionLog trong hệ thống",
        "columns": [
            {
                "name": "id",
                "type": "VARCHAR(36)",
                "pk": "YES",
                "fk": "NO",
                "nullable": "NO",
                "default": "None",
                "unique": "NO",
                "desc": "Khóa chính định danh duy nhất của bản ghi (UUID v4 / Long Auto-increment)"
            },
            {
                "name": "dispute",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu dispute lưu trữ thuộc tính nghiệp vụ của dispute_action_logs"
            },
            {
                "name": "actor",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu actor lưu trữ thuộc tính nghiệp vụ của dispute_action_logs"
            },
            {
                "name": "actor_name",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu actor_name lưu trữ thuộc tính nghiệp vụ của dispute_action_logs"
            },
            {
                "name": "actor_role",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu actor_role lưu trữ thuộc tính nghiệp vụ của dispute_action_logs"
            },
            {
                "name": "action_type",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu action_type lưu trữ thuộc tính nghiệp vụ của dispute_action_logs"
            },
            {
                "name": "previous_status",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu previous_status lưu trữ thuộc tính nghiệp vụ của dispute_action_logs"
            },
            {
                "name": "new_status",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu new_status lưu trữ thuộc tính nghiệp vụ của dispute_action_logs"
            },
            {
                "name": "reason",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Nội dung văn bản ghi chú chi tiết hoặc giải trình nguyên nhân"
            },
            {
                "name": "details",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu details lưu trữ thuộc tính nghiệp vụ của dispute_action_logs"
            },
            {
                "name": "created_at",
                "type": "DATETIME",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Thời điểm tạo bản ghi lần đầu trong hệ thống (UTC ISO 8601 Timestamp)"
            },
        ]
    },
    "dispute_compensation_payments": {
        "name": "dispute_compensation_payments",
        "purpose": "Bản ghi thực thi chi trả bồi thường mô phỏng (DEMO Compensation)",
        "columns": [
            {
                "name": "id",
                "type": "VARCHAR(36)",
                "pk": "YES",
                "fk": "NO",
                "nullable": "NO",
                "default": "None",
                "unique": "NO",
                "desc": "Khóa chính định danh duy nhất của bản ghi (UUID v4 / Long Auto-increment)"
            },
            {
                "name": "compensation",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu compensation lưu trữ thuộc tính nghiệp vụ của dispute_compensation_payments"
            },
            {
                "name": "amount",
                "type": "DECIMAL(14,2)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Giá trị tài chính bằng đơn vị tiền tệ VND phát sinh trong giao dịch"
            },
            {
                "name": "payment_reference",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu payment_reference lưu trữ thuộc tính nghiệp vụ của dispute_compensation_payments"
            },
            {
                "name": "receipt_url",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Đường dẫn liên kết URI tới tệp lưu trữ media / ảnh chụp đính kèm"
            },
            {
                "name": "payment_date",
                "type": "DATETIME",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu payment_date lưu trữ thuộc tính nghiệp vụ của dispute_compensation_payments"
            },
            {
                "name": "verified_by_user",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu verified_by_user lưu trữ thuộc tính nghiệp vụ của dispute_compensation_payments"
            },
            {
                "name": "verified_by_name",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu verified_by_name lưu trữ thuộc tính nghiệp vụ của dispute_compensation_payments"
            },
            {
                "name": "note",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Nội dung văn bản ghi chú chi tiết hoặc giải trình nguyên nhân"
            },
            {
                "name": "created_at",
                "type": "DATETIME",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Thời điểm tạo bản ghi lần đầu trong hệ thống (UTC ISO 8601 Timestamp)"
            },
        ]
    },
    "dispute_compensations": {
        "name": "dispute_compensations",
        "purpose": "Phương án và quyết định bồi thường hòa giải được phê duyệt",
        "columns": [
            {
                "name": "id",
                "type": "VARCHAR(36)",
                "pk": "YES",
                "fk": "NO",
                "nullable": "NO",
                "default": "None",
                "unique": "NO",
                "desc": "Khóa chính định danh duy nhất của bản ghi (UUID v4 / Long Auto-increment)"
            },
            {
                "name": "dispute",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu dispute lưu trữ thuộc tính nghiệp vụ của dispute_compensations"
            },
            {
                "name": "payer_user",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu payer_user lưu trữ thuộc tính nghiệp vụ của dispute_compensations"
            },
            {
                "name": "payer_name",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu payer_name lưu trữ thuộc tính nghiệp vụ của dispute_compensations"
            },
            {
                "name": "recipient_user",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu recipient_user lưu trữ thuộc tính nghiệp vụ của dispute_compensations"
            },
            {
                "name": "recipient_name",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu recipient_name lưu trữ thuộc tính nghiệp vụ của dispute_compensations"
            },
            {
                "name": "approved_amount",
                "type": "DECIMAL(12,2)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu approved_amount lưu trữ thuộc tính nghiệp vụ của dispute_compensations"
            },
            {
                "name": "outstanding_amount",
                "type": "DECIMAL(12,2)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu outstanding_amount lưu trữ thuộc tính nghiệp vụ của dispute_compensations"
            },
            {
                "name": "authorized_by",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu authorized_by lưu trữ thuộc tính nghiệp vụ của dispute_compensations"
            },
            {
                "name": "authorized_at",
                "type": "DATETIME",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu authorized_at lưu trữ thuộc tính nghiệp vụ của dispute_compensations"
            },
            {
                "name": "payment_reference",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu payment_reference lưu trữ thuộc tính nghiệp vụ của dispute_compensations"
            },
            {
                "name": "decision_basis",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu decision_basis lưu trữ thuộc tính nghiệp vụ của dispute_compensations"
            },
            {
                "name": "pending_payment_amount",
                "type": "DECIMAL(12,2)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu pending_payment_amount lưu trữ thuộc tính nghiệp vụ của dispute_compensations"
            },
            {
                "name": "pending_payment_reference",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu pending_payment_reference lưu trữ thuộc tính nghiệp vụ của dispute_compensations"
            },
            {
                "name": "pending_receipt_url",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Đường dẫn liên kết URI tới tệp lưu trữ media / ảnh chụp đính kèm"
            },
            {
                "name": "pending_payment_date",
                "type": "DATETIME",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu pending_payment_date lưu trữ thuộc tính nghiệp vụ của dispute_compensations"
            },
            {
                "name": "pending_payment_note",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Nội dung văn bản ghi chú chi tiết hoặc giải trình nguyên nhân"
            },
            {
                "name": "pending_submitted_at",
                "type": "DATETIME",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu pending_submitted_at lưu trữ thuộc tính nghiệp vụ của dispute_compensations"
            },
            {
                "name": "rejection_reason",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Nội dung văn bản ghi chú chi tiết hoặc giải trình nguyên nhân"
            },
            {
                "name": "created_at",
                "type": "DATETIME",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Thời điểm tạo bản ghi lần đầu trong hệ thống (UTC ISO 8601 Timestamp)"
            },
            {
                "name": "updated_at",
                "type": "DATETIME",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Thời điểm cập nhật bản ghi gần nhất trong hệ thống (UTC Timestamp)"
            },
        ]
    },
    "dispute_evidence": {
        "name": "dispute_evidence",
        "purpose": "Bằng chứng hóa đơn, biên lai chuyển khoản và ảnh chụp đính kèm hồ sơ khiếu nại",
        "columns": [
            {
                "name": "id",
                "type": "VARCHAR(36)",
                "pk": "YES",
                "fk": "NO",
                "nullable": "NO",
                "default": "None",
                "unique": "NO",
                "desc": "Khóa chính định danh duy nhất của bản ghi (UUID v4 / Long Auto-increment)"
            },
            {
                "name": "dispute",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu dispute lưu trữ thuộc tính nghiệp vụ của dispute_evidence"
            },
            {
                "name": "uploaded_by",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu uploaded_by lưu trữ thuộc tính nghiệp vụ của dispute_evidence"
            },
            {
                "name": "title",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu title lưu trữ thuộc tính nghiệp vụ của dispute_evidence"
            },
            {
                "name": "file_url",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Đường dẫn liên kết URI tới tệp lưu trữ media / ảnh chụp đính kèm"
            },
            {
                "name": "file_type",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu file_type lưu trữ thuộc tính nghiệp vụ của dispute_evidence"
            },
            {
                "name": "file_size_bytes",
                "type": "BIGINT",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "0",
                "unique": "NO",
                "desc": "Trường dữ liệu file_size_bytes lưu trữ thuộc tính nghiệp vụ của dispute_evidence"
            },
            {
                "name": "integrity_hash",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu integrity_hash lưu trữ thuộc tính nghiệp vụ của dispute_evidence"
            },
            {
                "name": "created_at",
                "type": "DATETIME",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Thời điểm tạo bản ghi lần đầu trong hệ thống (UTC ISO 8601 Timestamp)"
            },
        ]
    },
    "dispute_messages": {
        "name": "dispute_messages",
        "purpose": "Lời thoại trao đổi hòa giải trực tuyến giữa chủ xe và nhân viên điều tra",
        "columns": [
            {
                "name": "id",
                "type": "VARCHAR(36)",
                "pk": "YES",
                "fk": "NO",
                "nullable": "NO",
                "default": "None",
                "unique": "NO",
                "desc": "Khóa chính định danh duy nhất của bản ghi (UUID v4 / Long Auto-increment)"
            },
            {
                "name": "dispute",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu dispute lưu trữ thuộc tính nghiệp vụ của dispute_messages"
            },
            {
                "name": "sender",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu sender lưu trữ thuộc tính nghiệp vụ của dispute_messages"
            },
            {
                "name": "content",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu content lưu trữ thuộc tính nghiệp vụ của dispute_messages"
            },
            {
                "name": "created_at",
                "type": "DATETIME",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Thời điểm tạo bản ghi lần đầu trong hệ thống (UTC ISO 8601 Timestamp)"
            },
        ]
    },
    "dispute_participants": {
        "name": "dispute_participants",
        "purpose": "Danh sách các bên liên quan tham gia vào quá trình hòa giải khiếu nại",
        "columns": [
            {
                "name": "id",
                "type": "VARCHAR(36)",
                "pk": "YES",
                "fk": "NO",
                "nullable": "NO",
                "default": "None",
                "unique": "NO",
                "desc": "Khóa chính định danh duy nhất của bản ghi (UUID v4 / Long Auto-increment)"
            },
            {
                "name": "dispute",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu dispute lưu trữ thuộc tính nghiệp vụ của dispute_participants"
            },
            {
                "name": "user",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu user lưu trữ thuộc tính nghiệp vụ của dispute_participants"
            },
            {
                "name": "role",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu role lưu trữ thuộc tính nghiệp vụ của dispute_participants"
            },
            {
                "name": "has_accepted_resolution",
                "type": "BOOLEAN",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu has_accepted_resolution lưu trữ thuộc tính nghiệp vụ của dispute_participants"
            },
            {
                "name": "responded_at",
                "type": "DATETIME",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu responded_at lưu trữ thuộc tính nghiệp vụ của dispute_participants"
            },
            {
                "name": "created_at",
                "type": "DATETIME",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Thời điểm tạo bản ghi lần đầu trong hệ thống (UTC ISO 8601 Timestamp)"
            },
        ]
    },
    "disputes": {
        "name": "disputes",
        "purpose": "Hồ sơ khiếu nại tranh chấp sự cố, phân bổ tiền điện hoặc hư hại thân vỏ",
        "columns": [
            {
                "name": "id",
                "type": "VARCHAR(36)",
                "pk": "YES",
                "fk": "NO",
                "nullable": "NO",
                "default": "None",
                "unique": "NO",
                "desc": "Khóa chính định danh duy nhất của bản ghi (UUID v4 / Long Auto-increment)"
            },
            {
                "name": "reference_code",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "YES",
                "desc": "Trường dữ liệu reference_code lưu trữ thuộc tính nghiệp vụ của disputes"
            },
            {
                "name": "vehicle",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu vehicle lưu trữ thuộc tính nghiệp vụ của disputes"
            },
            {
                "name": "co_ownership_group",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu co_ownership_group lưu trữ thuộc tính nghiệp vụ của disputes"
            },
            {
                "name": "created_by",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "YES (FK -> users.id)",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Khóa ngoại liên kết người dùng tạo bản ghi (FK -> users.id)"
            },
            {
                "name": "assigned_staff",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu assigned_staff lưu trữ thuộc tính nghiệp vụ của disputes"
            },
            {
                "name": "category",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu category lưu trữ thuộc tính nghiệp vụ của disputes"
            },
            {
                "name": "title",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu title lưu trữ thuộc tính nghiệp vụ của disputes"
            },
            {
                "name": "description",
                "type": "TEXT",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Nội dung văn bản ghi chú chi tiết hoặc giải trình nguyên nhân"
            },
            {
                "name": "booking_id",
                "type": "VARCHAR(36)",
                "pk": "NO",
                "fk": "YES (FK -> bookings.id)",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Khóa ngoại liên kết phiên đặt xe tương ứng (FK -> bookings.id)"
            },
            {
                "name": "trip_id",
                "type": "VARCHAR(36)",
                "pk": "NO",
                "fk": "YES (FK -> trips.id)",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Khóa ngoại liên kết chuyến đi thực tế của người dùng (FK -> trips.id)"
            },
            {
                "name": "handover_id",
                "type": "VARCHAR(36)",
                "pk": "NO",
                "fk": "YES (FK -> handovers.id)",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu handover_id lưu trữ thuộc tính nghiệp vụ của disputes"
            },
            {
                "name": "inspection_id",
                "type": "VARCHAR(36)",
                "pk": "NO",
                "fk": "YES (FK -> inspections.id)",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu inspection_id lưu trữ thuộc tính nghiệp vụ của disputes"
            },
            {
                "name": "damage_record_id",
                "type": "VARCHAR(36)",
                "pk": "NO",
                "fk": "YES (FK -> damage_records.id)",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu damage_record_id lưu trữ thuộc tính nghiệp vụ của disputes"
            },
            {
                "name": "expense_id",
                "type": "VARCHAR(36)",
                "pk": "NO",
                "fk": "YES (FK -> expenses.id)",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu expense_id lưu trữ thuộc tính nghiệp vụ của disputes"
            },
            {
                "name": "expense_share_id",
                "type": "VARCHAR(36)",
                "pk": "NO",
                "fk": "YES (FK -> expense_shares.id)",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu expense_share_id lưu trữ thuộc tính nghiệp vụ của disputes"
            },
            {
                "name": "personal_payment_id",
                "type": "VARCHAR(36)",
                "pk": "NO",
                "fk": "YES (FK -> personal_payments.id)",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu personal_payment_id lưu trữ thuộc tính nghiệp vụ của disputes"
            },
            {
                "name": "proposal_id",
                "type": "VARCHAR(36)",
                "pk": "NO",
                "fk": "YES (FK -> proposals.id)",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Khóa ngoại liên kết tới đề xuất biểu quyết chung (FK -> vote_proposals.id)"
            },
            {
                "name": "ownership_transfer_id",
                "type": "VARCHAR(36)",
                "pk": "NO",
                "fk": "YES (FK -> ownership_transfers.id)",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu ownership_transfer_id lưu trữ thuộc tính nghiệp vụ của disputes"
            },
            {
                "name": "disputed_amount",
                "type": "DECIMAL(12,2)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu disputed_amount lưu trữ thuộc tính nghiệp vụ của disputes"
            },
            {
                "name": "evidence_snapshot_json",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu evidence_snapshot_json lưu trữ thuộc tính nghiệp vụ của disputes"
            },
            {
                "name": "investigation_conclusion",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu investigation_conclusion lưu trữ thuộc tính nghiệp vụ của disputes"
            },
            {
                "name": "investigation_notes",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Nội dung văn bản ghi chú chi tiết hoặc giải trình nguyên nhân"
            },
            {
                "name": "investigated_by",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu investigated_by lưu trữ thuộc tính nghiệp vụ của disputes"
            },
            {
                "name": "investigated_at",
                "type": "DATETIME",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu investigated_at lưu trữ thuộc tính nghiệp vụ của disputes"
            },
            {
                "name": "resolution_type",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu resolution_type lưu trữ thuộc tính nghiệp vụ của disputes"
            },
            {
                "name": "proposed_amount",
                "type": "DECIMAL(12,2)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu proposed_amount lưu trữ thuộc tính nghiệp vụ của disputes"
            },
            {
                "name": "approved_amount",
                "type": "DECIMAL(12,2)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu approved_amount lưu trữ thuộc tính nghiệp vụ của disputes"
            },
            {
                "name": "outstanding_amount",
                "type": "DECIMAL(12,2)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu outstanding_amount lưu trữ thuộc tính nghiệp vụ của disputes"
            },
            {
                "name": "proposed_payer_type",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu proposed_payer_type lưu trữ thuộc tính nghiệp vụ của disputes"
            },
            {
                "name": "proposed_payer_user",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu proposed_payer_user lưu trữ thuộc tính nghiệp vụ của disputes"
            },
            {
                "name": "proposed_payer_name",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu proposed_payer_name lưu trữ thuộc tính nghiệp vụ của disputes"
            },
            {
                "name": "proposed_recipient_user",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu proposed_recipient_user lưu trữ thuộc tính nghiệp vụ của disputes"
            },
            {
                "name": "proposed_recipient_name",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu proposed_recipient_name lưu trữ thuộc tính nghiệp vụ của disputes"
            },
            {
                "name": "decision_basis",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu decision_basis lưu trữ thuộc tính nghiệp vụ của disputes"
            },
            {
                "name": "resolution_deadline",
                "type": "DATETIME",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu resolution_deadline lưu trữ thuộc tính nghiệp vụ của disputes"
            },
            {
                "name": "proposed_resolution",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu proposed_resolution lưu trữ thuộc tính nghiệp vụ của disputes"
            },
            {
                "name": "proposed_resolution_by",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu proposed_resolution_by lưu trữ thuộc tính nghiệp vụ của disputes"
            },
            {
                "name": "proposed_resolution_at",
                "type": "DATETIME",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu proposed_resolution_at lưu trữ thuộc tính nghiệp vụ của disputes"
            },
            {
                "name": "resolution_accepted_by_parties",
                "type": "BOOLEAN",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu resolution_accepted_by_parties lưu trữ thuộc tính nghiệp vụ của disputes"
            },
            {
                "name": "corrective_action_summary",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu corrective_action_summary lưu trữ thuộc tính nghiệp vụ của disputes"
            },
            {
                "name": "corrective_action_executed_at",
                "type": "DATETIME",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu corrective_action_executed_at lưu trữ thuộc tính nghiệp vụ của disputes"
            },
            {
                "name": "resolution_summary",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu resolution_summary lưu trữ thuộc tính nghiệp vụ của disputes"
            },
            {
                "name": "resolved_at",
                "type": "DATETIME",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu resolved_at lưu trữ thuộc tính nghiệp vụ của disputes"
            },
            {
                "name": "closed_at",
                "type": "DATETIME",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu closed_at lưu trữ thuộc tính nghiệp vụ của disputes"
            },
            {
                "name": "reopen_reason",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Nội dung văn bản ghi chú chi tiết hoặc giải trình nguyên nhân"
            },
            {
                "name": "version",
                "type": "BIGINT",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "0",
                "unique": "NO",
                "desc": "Phiên bản dữ liệu phục vụ khóa lạc quan (Optimistic Locking)"
            },
            {
                "name": "created_at",
                "type": "DATETIME",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Thời điểm tạo bản ghi lần đầu trong hệ thống (UTC ISO 8601 Timestamp)"
            },
            {
                "name": "updated_at",
                "type": "DATETIME",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Thời điểm cập nhật bản ghi gần nhất trong hệ thống (UTC Timestamp)"
            },
        ]
    },
    "expense_approvals": {
        "name": "expense_approvals",
        "purpose": "Nhật ký lịch sử phê duyệt khoản chi phí của ban quản trị hoặc nhóm",
        "columns": [
            {
                "name": "id",
                "type": "VARCHAR(36)",
                "pk": "YES",
                "fk": "NO",
                "nullable": "NO",
                "default": "None",
                "unique": "NO",
                "desc": "Khóa chính định danh duy nhất của bản ghi (UUID v4 / Long Auto-increment)"
            },
            {
                "name": "expense",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu expense lưu trữ thuộc tính nghiệp vụ của expense_approvals"
            },
            {
                "name": "user",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu user lưu trữ thuộc tính nghiệp vụ của expense_approvals"
            },
            {
                "name": "decision",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu decision lưu trữ thuộc tính nghiệp vụ của expense_approvals"
            },
            {
                "name": "ownership_percentage_snapshot",
                "type": "DECIMAL(12,2)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu ownership_percentage_snapshot lưu trữ thuộc tính nghiệp vụ của expense_approvals"
            },
            {
                "name": "comment",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu comment lưu trữ thuộc tính nghiệp vụ của expense_approvals"
            },
            {
                "name": "created_at",
                "type": "DATETIME",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Thời điểm tạo bản ghi lần đầu trong hệ thống (UTC ISO 8601 Timestamp)"
            },
            {
                "name": "updated_at",
                "type": "DATETIME",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Thời điểm cập nhật bản ghi gần nhất trong hệ thống (UTC Timestamp)"
            },
        ]
    },
    "expense_shares": {
        "name": "expense_shares",
        "purpose": "Nghĩa vụ chi phí chi tiết phân bổ cho từng cá nhân (Hare-Niemeyer rounding)",
        "columns": [
            {
                "name": "id",
                "type": "VARCHAR(36)",
                "pk": "YES",
                "fk": "NO",
                "nullable": "NO",
                "default": "None",
                "unique": "NO",
                "desc": "Khóa chính định danh duy nhất của bản ghi (UUID v4 / Long Auto-increment)"
            },
            {
                "name": "expense",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu expense lưu trữ thuộc tính nghiệp vụ của expense_shares"
            },
            {
                "name": "user",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu user lưu trữ thuộc tính nghiệp vụ của expense_shares"
            },
            {
                "name": "ownership_percentage",
                "type": "DECIMAL(5,2)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Tỷ lệ phần trăm cổ phần sở hữu xe điện (định dạng phần trăm từ 0.00% đến 100.00%)"
            },
            {
                "name": "allocation_percentage",
                "type": "DECIMAL(12,2)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu allocation_percentage lưu trữ thuộc tính nghiệp vụ của expense_shares"
            },
            {
                "name": "share_amount",
                "type": "DECIMAL(12,2)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu share_amount lưu trữ thuộc tính nghiệp vụ của expense_shares"
            },
            {
                "name": "allocation_policy",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu allocation_policy lưu trữ thuộc tính nghiệp vụ của expense_shares"
            },
            {
                "name": "member_km_snapshot",
                "type": "DECIMAL(12,2)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Số đo quãng đường lăn bánh của xe điện (Kilomet)"
            },
            {
                "name": "total_km_snapshot",
                "type": "DECIMAL(12,2)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Số đo quãng đường lăn bánh của xe điện (Kilomet)"
            },
            {
                "name": "raw_calculated_amount",
                "type": "DECIMAL(12,2)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu raw_calculated_amount lưu trữ thuộc tính nghiệp vụ của expense_shares"
            },
            {
                "name": "redistribution_adjustment",
                "type": "DECIMAL(12,2)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu redistribution_adjustment lưu trữ thuộc tính nghiệp vụ của expense_shares"
            },
            {
                "name": "allocation_period_start",
                "type": "DATETIME",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu allocation_period_start lưu trữ thuộc tính nghiệp vụ của expense_shares"
            },
            {
                "name": "allocation_period_end",
                "type": "DATETIME",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu allocation_period_end lưu trữ thuộc tính nghiệp vụ của expense_shares"
            },
            {
                "name": "calculation_version",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu calculation_version lưu trữ thuộc tính nghiệp vụ của expense_shares"
            },
            {
                "name": "created_at",
                "type": "DATETIME",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Thời điểm tạo bản ghi lần đầu trong hệ thống (UTC ISO 8601 Timestamp)"
            },
            {
                "name": "updated_at",
                "type": "DATETIME",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Thời điểm cập nhật bản ghi gần nhất trong hệ thống (UTC Timestamp)"
            },
        ]
    },
    "expenses": {
        "name": "expenses",
        "purpose": "Quản lý các khoản chi phí phát sinh: Số tiền, danh mục, chính sách phân bổ",
        "columns": [
            {
                "name": "id",
                "type": "VARCHAR(36)",
                "pk": "YES",
                "fk": "NO",
                "nullable": "NO",
                "default": "None",
                "unique": "NO",
                "desc": "Khóa chính định danh duy nhất của bản ghi (UUID v4 / Long Auto-increment)"
            },
            {
                "name": "vehicle",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu vehicle lưu trữ thuộc tính nghiệp vụ của expenses"
            },
            {
                "name": "co_ownership_group",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu co_ownership_group lưu trữ thuộc tính nghiệp vụ của expenses"
            },
            {
                "name": "category",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu category lưu trữ thuộc tính nghiệp vụ của expenses"
            },
            {
                "name": "amount",
                "type": "DECIMAL(14,2)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Giá trị tài chính bằng đơn vị tiền tệ VND phát sinh trong giao dịch"
            },
            {
                "name": "description",
                "type": "TEXT",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Nội dung văn bản ghi chú chi tiết hoặc giải trình nguyên nhân"
            },
            {
                "name": "occurred_at",
                "type": "DATETIME",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu occurred_at lưu trữ thuộc tính nghiệp vụ của expenses"
            },
            {
                "name": "paid_by",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu paid_by lưu trữ thuộc tính nghiệp vụ của expenses"
            },
            {
                "name": "created_by",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "YES (FK -> users.id)",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Khóa ngoại liên kết người dùng tạo bản ghi (FK -> users.id)"
            },
            {
                "name": "responsible_user",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu responsible_user lưu trữ thuộc tính nghiệp vụ của expenses"
            },
            {
                "name": "related_trip_id",
                "type": "VARCHAR(36)",
                "pk": "NO",
                "fk": "YES (FK -> related_trips.id)",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu related_trip_id lưu trữ thuộc tính nghiệp vụ của expenses"
            },
            {
                "name": "related_booking_id",
                "type": "VARCHAR(36)",
                "pk": "NO",
                "fk": "YES (FK -> related_bookings.id)",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu related_booking_id lưu trữ thuộc tính nghiệp vụ của expenses"
            },
            {
                "name": "related_proposal_id",
                "type": "VARCHAR(36)",
                "pk": "NO",
                "fk": "YES (FK -> related_proposals.id)",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu related_proposal_id lưu trữ thuộc tính nghiệp vụ của expenses"
            },
            {
                "name": "source_reference_id",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "YES (FK -> source_references.id)",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu source_reference_id lưu trữ thuộc tính nghiệp vụ của expenses"
            },
            {
                "name": "evidence_url",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Đường dẫn liên kết URI tới tệp lưu trữ media / ảnh chụp đính kèm"
            },
            {
                "name": "evidence_note",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Nội dung văn bản ghi chú chi tiết hoặc giải trình nguyên nhân"
            },
            {
                "name": "approved_at",
                "type": "DATETIME",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu approved_at lưu trữ thuộc tính nghiệp vụ của expenses"
            },
            {
                "name": "rejected_at",
                "type": "DATETIME",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu rejected_at lưu trữ thuộc tính nghiệp vụ của expenses"
            },
            {
                "name": "created_at",
                "type": "DATETIME",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Thời điểm tạo bản ghi lần đầu trong hệ thống (UTC ISO 8601 Timestamp)"
            },
            {
                "name": "updated_at",
                "type": "DATETIME",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Thời điểm cập nhật bản ghi gần nhất trong hệ thống (UTC Timestamp)"
            },
        ]
    },
    "fund_contributions": {
        "name": "fund_contributions",
        "purpose": "Bản ghi đóng góp quỹ chung của các thành viên (Dữ liệu lịch sử)",
        "columns": [
            {
                "name": "id",
                "type": "VARCHAR(36)",
                "pk": "YES",
                "fk": "NO",
                "nullable": "NO",
                "default": "None",
                "unique": "NO",
                "desc": "Khóa chính định danh duy nhất của bản ghi (UUID v4 / Long Auto-increment)"
            },
            {
                "name": "fund",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu fund lưu trữ thuộc tính nghiệp vụ của fund_contributions"
            },
            {
                "name": "contributor_user",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu contributor_user lưu trữ thuộc tính nghiệp vụ của fund_contributions"
            },
            {
                "name": "amount",
                "type": "DECIMAL(14,2)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Giá trị tài chính bằng đơn vị tiền tệ VND phát sinh trong giao dịch"
            },
            {
                "name": "payment_reference",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu payment_reference lưu trữ thuộc tính nghiệp vụ của fund_contributions"
            },
            {
                "name": "evidence_url",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Đường dẫn liên kết URI tới tệp lưu trữ media / ảnh chụp đính kèm"
            },
            {
                "name": "note",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Nội dung văn bản ghi chú chi tiết hoặc giải trình nguyên nhân"
            },
            {
                "name": "created_at",
                "type": "DATETIME",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Thời điểm tạo bản ghi lần đầu trong hệ thống (UTC ISO 8601 Timestamp)"
            },
            {
                "name": "verified_at",
                "type": "DATETIME",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu verified_at lưu trữ thuộc tính nghiệp vụ của fund_contributions"
            },
            {
                "name": "verified_by_user",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu verified_by_user lưu trữ thuộc tính nghiệp vụ của fund_contributions"
            },
        ]
    },
    "fund_transactions": {
        "name": "fund_transactions",
        "purpose": "Bản ghi biến động số dư quỹ chung (Dữ liệu lịch sử)",
        "columns": [
            {
                "name": "id",
                "type": "VARCHAR(36)",
                "pk": "YES",
                "fk": "NO",
                "nullable": "NO",
                "default": "None",
                "unique": "NO",
                "desc": "Khóa chính định danh duy nhất của bản ghi (UUID v4 / Long Auto-increment)"
            },
            {
                "name": "fund",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu fund lưu trữ thuộc tính nghiệp vụ của fund_transactions"
            },
            {
                "name": "transaction_type",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu transaction_type lưu trữ thuộc tính nghiệp vụ của fund_transactions"
            },
            {
                "name": "amount",
                "type": "DECIMAL(14,2)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Giá trị tài chính bằng đơn vị tiền tệ VND phát sinh trong giao dịch"
            },
            {
                "name": "direction",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu direction lưu trữ thuộc tính nghiệp vụ của fund_transactions"
            },
            {
                "name": "reference_type",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu reference_type lưu trữ thuộc tính nghiệp vụ của fund_transactions"
            },
            {
                "name": "reference_id",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "YES (FK -> references.id)",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu reference_id lưu trữ thuộc tính nghiệp vụ của fund_transactions"
            },
            {
                "name": "balance_after",
                "type": "DECIMAL(12,2)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu balance_after lưu trữ thuộc tính nghiệp vụ của fund_transactions"
            },
            {
                "name": "description",
                "type": "TEXT",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Nội dung văn bản ghi chú chi tiết hoặc giải trình nguyên nhân"
            },
            {
                "name": "created_at",
                "type": "DATETIME",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Thời điểm tạo bản ghi lần đầu trong hệ thống (UTC ISO 8601 Timestamp)"
            },
            {
                "name": "confirmed_at",
                "type": "DATETIME",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu confirmed_at lưu trữ thuộc tính nghiệp vụ của fund_transactions"
            },
            {
                "name": "confirmed_by_user",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu confirmed_by_user lưu trữ thuộc tính nghiệp vụ của fund_transactions"
            },
        ]
    },
    "group_discovery_settings": {
        "name": "group_discovery_settings",
        "purpose": "Cấu hình cho phép nhóm hiển thị công khai trên danh bạ để tìm thêm cổ đông",
        "columns": [
            {
                "name": "group_id",
                "type": "VARCHAR(36)",
                "pk": "YES",
                "fk": "YES (FK -> co_ownership_groups.id)",
                "nullable": "NO",
                "default": "None",
                "unique": "NO",
                "desc": "Khóa ngoại liên kết nhóm đồng sở hữu phương tiện (FK -> co_ownership_groups.id)"
            },
            {
                "name": "target_model",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu target_model lưu trữ thuộc tính nghiệp vụ của group_discovery_settings"
            },
            {
                "name": "public_terms",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu public_terms lưu trữ thuộc tính nghiệp vụ của group_discovery_settings"
            },
            {
                "name": "join_conditions",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu join_conditions lưu trữ thuộc tính nghiệp vụ của group_discovery_settings"
            },
            {
                "name": "created_at",
                "type": "DATETIME",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Thời điểm tạo bản ghi lần đầu trong hệ thống (UTC ISO 8601 Timestamp)"
            },
            {
                "name": "updated_at",
                "type": "DATETIME",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Thời điểm cập nhật bản ghi gần nhất trong hệ thống (UTC Timestamp)"
            },
        ]
    },
    "group_invitations": {
        "name": "group_invitations",
        "purpose": "Quản lý lời mời tham gia nhóm đồng sở hữu xe ban đầu",
        "columns": [
            {
                "name": "id",
                "type": "VARCHAR(36)",
                "pk": "YES",
                "fk": "NO",
                "nullable": "NO",
                "default": "None",
                "unique": "NO",
                "desc": "Khóa chính định danh duy nhất của bản ghi (UUID v4 / Long Auto-increment)"
            },
            {
                "name": "group_id",
                "type": "VARCHAR(36)",
                "pk": "NO",
                "fk": "YES (FK -> co_ownership_groups.id)",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Khóa ngoại liên kết nhóm đồng sở hữu phương tiện (FK -> co_ownership_groups.id)"
            },
            {
                "name": "inviter_id",
                "type": "VARCHAR(36)",
                "pk": "NO",
                "fk": "YES (FK -> inviters.id)",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu inviter_id lưu trữ thuộc tính nghiệp vụ của group_invitations"
            },
            {
                "name": "invitee_email",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Địa chỉ thư điện tử xác thực của người dùng"
            },
            {
                "name": "invitee_user_id",
                "type": "VARCHAR(36)",
                "pk": "NO",
                "fk": "YES (FK -> invitee_users.id)",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu invitee_user_id lưu trữ thuộc tính nghiệp vụ của group_invitations"
            },
            {
                "name": "proposed_percentage",
                "type": "DECIMAL(12,2)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu proposed_percentage lưu trữ thuộc tính nghiệp vụ của group_invitations"
            },
            {
                "name": "invite_code",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "YES",
                "desc": "Trường dữ liệu invite_code lưu trữ thuộc tính nghiệp vụ của group_invitations"
            },
            {
                "name": "expires_at",
                "type": "DATETIME",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu expires_at lưu trữ thuộc tính nghiệp vụ của group_invitations"
            },
            {
                "name": "contract_version_id",
                "type": "VARCHAR(36)",
                "pk": "NO",
                "fk": "YES (FK -> contract_versions.id)",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Khóa ngoại liên kết phiên bản hợp đồng có hiệu lực (FK -> co_ownership_contract_versions.id)"
            },
            {
                "name": "consent_content_hash",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu consent_content_hash lưu trữ thuộc tính nghiệp vụ của group_invitations"
            },
            {
                "name": "consented_at",
                "type": "DATETIME",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu consented_at lưu trữ thuộc tính nghiệp vụ của group_invitations"
            },
            {
                "name": "signer_full_name",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu signer_full_name lưu trữ thuộc tính nghiệp vụ của group_invitations"
            },
            {
                "name": "consent_ip_address",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu consent_ip_address lưu trữ thuộc tính nghiệp vụ của group_invitations"
            },
            {
                "name": "created_at",
                "type": "DATETIME",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Thời điểm tạo bản ghi lần đầu trong hệ thống (UTC ISO 8601 Timestamp)"
            },
            {
                "name": "updated_at",
                "type": "DATETIME",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Thời điểm cập nhật bản ghi gần nhất trong hệ thống (UTC Timestamp)"
            },
        ]
    },
    "group_join_requests": {
        "name": "group_join_requests",
        "purpose": "Quản lý đơn xin gia nhập nhóm từ người dùng tự do",
        "columns": [
            {
                "name": "id",
                "type": "VARCHAR(36)",
                "pk": "YES",
                "fk": "NO",
                "nullable": "NO",
                "default": "None",
                "unique": "NO",
                "desc": "Khóa chính định danh duy nhất của bản ghi (UUID v4 / Long Auto-increment)"
            },
            {
                "name": "group_id",
                "type": "VARCHAR(36)",
                "pk": "NO",
                "fk": "YES (FK -> co_ownership_groups.id)",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Khóa ngoại liên kết nhóm đồng sở hữu phương tiện (FK -> co_ownership_groups.id)"
            },
            {
                "name": "user_id",
                "type": "VARCHAR(36)",
                "pk": "NO",
                "fk": "YES (FK -> users.id)",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Khóa ngoại liên kết tới tài khoản người dùng thực hiện (FK -> users.id)"
            },
            {
                "name": "requested_percentage",
                "type": "DECIMAL(12,2)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu requested_percentage lưu trữ thuộc tính nghiệp vụ của group_join_requests"
            },
            {
                "name": "message",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu message lưu trữ thuộc tính nghiệp vụ của group_join_requests"
            },
            {
                "name": "review_notes",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Nội dung văn bản ghi chú chi tiết hoặc giải trình nguyên nhân"
            },
            {
                "name": "reviewed_by",
                "type": "VARCHAR(36)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu reviewed_by lưu trữ thuộc tính nghiệp vụ của group_join_requests"
            },
            {
                "name": "reviewed_at",
                "type": "DATETIME",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu reviewed_at lưu trữ thuộc tính nghiệp vụ của group_join_requests"
            },
            {
                "name": "created_at",
                "type": "DATETIME",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Thời điểm tạo bản ghi lần đầu trong hệ thống (UTC ISO 8601 Timestamp)"
            },
            {
                "name": "updated_at",
                "type": "DATETIME",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Thời điểm cập nhật bản ghi gần nhất trong hệ thống (UTC Timestamp)"
            },
        ]
    },
    "group_members": {
        "name": "group_members",
        "purpose": "Bảng liên kết thành viên trong nhóm đồng sở hữu, vai trò (LEADER/MEMBER) và trạng thái",
        "columns": [
            {
                "name": "id",
                "type": "VARCHAR(36)",
                "pk": "YES",
                "fk": "NO",
                "nullable": "NO",
                "default": "None",
                "unique": "NO",
                "desc": "Khóa chính định danh duy nhất của bản ghi (UUID v4 / Long Auto-increment)"
            },
            {
                "name": "group",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu group lưu trữ thuộc tính nghiệp vụ của group_members"
            },
            {
                "name": "user",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu user lưu trữ thuộc tính nghiệp vụ của group_members"
            },
            {
                "name": "joined_at",
                "type": "DATETIME",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu joined_at lưu trữ thuộc tính nghiệp vụ của group_members"
            },
            {
                "name": "removed_at",
                "type": "DATETIME",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu removed_at lưu trữ thuộc tính nghiệp vụ của group_members"
            },
            {
                "name": "created_at",
                "type": "DATETIME",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Thời điểm tạo bản ghi lần đầu trong hệ thống (UTC ISO 8601 Timestamp)"
            },
            {
                "name": "updated_at",
                "type": "DATETIME",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Thời điểm cập nhật bản ghi gần nhất trong hệ thống (UTC Timestamp)"
            },
        ]
    },
    "group_vehicles": {
        "name": "group_vehicles",
        "purpose": "Liên kết phương tiện với nhóm đồng sở hữu (quy tắc 1 nhóm sở hữu 1 phương tiện)",
        "columns": [
            {
                "name": "id",
                "type": "VARCHAR(36)",
                "pk": "YES",
                "fk": "NO",
                "nullable": "NO",
                "default": "None",
                "unique": "NO",
                "desc": "Khóa chính định danh duy nhất của bản ghi (UUID v4 / Long Auto-increment)"
            },
            {
                "name": "group",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu group lưu trữ thuộc tính nghiệp vụ của group_vehicles"
            },
            {
                "name": "vehicle",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu vehicle lưu trữ thuộc tính nghiệp vụ của group_vehicles"
            },
            {
                "name": "added_at",
                "type": "DATETIME",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu added_at lưu trữ thuộc tính nghiệp vụ của group_vehicles"
            },
        ]
    },
    "maintenance_approval_votes": {
        "name": "maintenance_approval_votes",
        "purpose": "Biểu quyết tập thể thông qua dự toán và kế hoạch bảo dưỡng xe",
        "columns": [
            {
                "name": "id",
                "type": "VARCHAR(36)",
                "pk": "YES",
                "fk": "NO",
                "nullable": "NO",
                "default": "None",
                "unique": "NO",
                "desc": "Khóa chính định danh duy nhất của bản ghi (UUID v4 / Long Auto-increment)"
            },
            {
                "name": "maintenance_request",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu maintenance_request lưu trữ thuộc tính nghiệp vụ của maintenance_approval_votes"
            },
            {
                "name": "group",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu group lưu trữ thuộc tính nghiệp vụ của maintenance_approval_votes"
            },
            {
                "name": "member",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu member lưu trữ thuộc tính nghiệp vụ của maintenance_approval_votes"
            },
            {
                "name": "user",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu user lưu trữ thuộc tính nghiệp vụ của maintenance_approval_votes"
            },
            {
                "name": "decision",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu decision lưu trữ thuộc tính nghiệp vụ của maintenance_approval_votes"
            },
            {
                "name": "voting_weight",
                "type": "DECIMAL(12,2)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu voting_weight lưu trữ thuộc tính nghiệp vụ của maintenance_approval_votes"
            },
            {
                "name": "comment",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu comment lưu trữ thuộc tính nghiệp vụ của maintenance_approval_votes"
            },
            {
                "name": "created_at",
                "type": "DATETIME",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Thời điểm tạo bản ghi lần đầu trong hệ thống (UTC ISO 8601 Timestamp)"
            },
            {
                "name": "updated_at",
                "type": "DATETIME",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Thời điểm cập nhật bản ghi gần nhất trong hệ thống (UTC Timestamp)"
            },
        ]
    },
    "maintenance_requests": {
        "name": "maintenance_requests",
        "purpose": "Lệnh bảo dưỡng sửa chữa: Định kỳ mốc ODO, đột xuất, thay thế phụ tùng",
        "columns": [
            {
                "name": "id",
                "type": "VARCHAR(36)",
                "pk": "YES",
                "fk": "NO",
                "nullable": "NO",
                "default": "None",
                "unique": "NO",
                "desc": "Khóa chính định danh duy nhất của bản ghi (UUID v4 / Long Auto-increment)"
            },
            {
                "name": "vehicle",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu vehicle lưu trữ thuộc tính nghiệp vụ của maintenance_requests"
            },
            {
                "name": "title",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu title lưu trữ thuộc tính nghiệp vụ của maintenance_requests"
            },
            {
                "name": "description",
                "type": "TEXT",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Nội dung văn bản ghi chú chi tiết hoặc giải trình nguyên nhân"
            },
            {
                "name": "scheduled_at",
                "type": "DATETIME",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu scheduled_at lưu trữ thuộc tính nghiệp vụ của maintenance_requests"
            },
            {
                "name": "started_at",
                "type": "DATETIME",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu started_at lưu trữ thuộc tính nghiệp vụ của maintenance_requests"
            },
            {
                "name": "completed_at",
                "type": "DATETIME",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu completed_at lưu trữ thuộc tính nghiệp vụ của maintenance_requests"
            },
            {
                "name": "approved_at",
                "type": "DATETIME",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu approved_at lưu trữ thuộc tính nghiệp vụ của maintenance_requests"
            },
            {
                "name": "related_proposal_id",
                "type": "VARCHAR(36)",
                "pk": "NO",
                "fk": "YES (FK -> related_proposals.id)",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu related_proposal_id lưu trữ thuộc tính nghiệp vụ của maintenance_requests"
            },
            {
                "name": "created_by",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "YES (FK -> users.id)",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Khóa ngoại liên kết người dùng tạo bản ghi (FK -> users.id)"
            },
            {
                "name": "assigned_staff",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu assigned_staff lưu trữ thuộc tính nghiệp vụ của maintenance_requests"
            },
            {
                "name": "completion_note",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Nội dung văn bản ghi chú chi tiết hoặc giải trình nguyên nhân"
            },
            {
                "name": "created_at",
                "type": "DATETIME",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Thời điểm tạo bản ghi lần đầu trong hệ thống (UTC ISO 8601 Timestamp)"
            },
            {
                "name": "updated_at",
                "type": "DATETIME",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Thời điểm cập nhật bản ghi gần nhất trong hệ thống (UTC Timestamp)"
            },
        ]
    },
    "membership_invitations": {
        "name": "membership_invitations",
        "purpose": "Thư mời gia nhập nhóm kèm điều khoản trích vốn cổ đông hiện hữu",
        "columns": [
            {
                "name": "id",
                "type": "VARCHAR(36)",
                "pk": "YES",
                "fk": "NO",
                "nullable": "NO",
                "default": "None",
                "unique": "NO",
                "desc": "Khóa chính định danh duy nhất của bản ghi (UUID v4 / Long Auto-increment)"
            },
            {
                "name": "group",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu group lưu trữ thuộc tính nghiệp vụ của membership_invitations"
            },
            {
                "name": "vehicle",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu vehicle lưu trữ thuộc tính nghiệp vụ của membership_invitations"
            },
            {
                "name": "invited_by_user",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu invited_by_user lưu trữ thuộc tính nghiệp vụ của membership_invitations"
            },
            {
                "name": "invitee_email",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Địa chỉ thư điện tử xác thực của người dùng"
            },
            {
                "name": "invitee_user",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu invitee_user lưu trữ thuộc tính nghiệp vụ của membership_invitations"
            },
            {
                "name": "additional_contributions_json",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu additional_contributions_json lưu trữ thuộc tính nghiệp vụ của membership_invitations"
            },
            {
                "name": "contract_version_id",
                "type": "VARCHAR(36)",
                "pk": "NO",
                "fk": "YES (FK -> contract_versions.id)",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Khóa ngoại liên kết phiên bản hợp đồng có hiệu lực (FK -> co_ownership_contract_versions.id)"
            },
            {
                "name": "contract_id",
                "type": "VARCHAR(36)",
                "pk": "NO",
                "fk": "YES (FK -> contracts.id)",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Khóa ngoại liên kết hợp đồng đồng sở hữu mẫu (FK -> co_ownership_contracts.id)"
            },
            {
                "name": "rejection_reason",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Nội dung văn bản ghi chú chi tiết hoặc giải trình nguyên nhân"
            },
            {
                "name": "signatures_json",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu signatures_json lưu trữ thuộc tính nghiệp vụ của membership_invitations"
            },
            {
                "name": "invitation_note",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Nội dung văn bản ghi chú chi tiết hoặc giải trình nguyên nhân"
            },
            {
                "name": "created_at",
                "type": "DATETIME",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Thời điểm tạo bản ghi lần đầu trong hệ thống (UTC ISO 8601 Timestamp)"
            },
            {
                "name": "accepted_at",
                "type": "DATETIME",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu accepted_at lưu trữ thuộc tính nghiệp vụ của membership_invitations"
            },
            {
                "name": "completed_at",
                "type": "DATETIME",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu completed_at lưu trữ thuộc tính nghiệp vụ của membership_invitations"
            },
            {
                "name": "rejected_at",
                "type": "DATETIME",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu rejected_at lưu trữ thuộc tính nghiệp vụ của membership_invitations"
            },
            {
                "name": "cancelled_at",
                "type": "DATETIME",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu cancelled_at lưu trữ thuộc tính nghiệp vụ của membership_invitations"
            },
            {
                "name": "expires_at",
                "type": "DATETIME",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu expires_at lưu trữ thuộc tính nghiệp vụ của membership_invitations"
            },
            {
                "name": "updated_at",
                "type": "DATETIME",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Thời điểm cập nhật bản ghi gần nhất trong hệ thống (UTC Timestamp)"
            },
        ]
    },
    "membership_withdrawal_requests": {
        "name": "membership_withdrawal_requests",
        "purpose": "Đơn xin rút lui khỏi nhóm đồng sở hữu xe và phương án giải quyết vốn",
        "columns": [
            {
                "name": "id",
                "type": "VARCHAR(36)",
                "pk": "YES",
                "fk": "NO",
                "nullable": "NO",
                "default": "None",
                "unique": "NO",
                "desc": "Khóa chính định danh duy nhất của bản ghi (UUID v4 / Long Auto-increment)"
            },
            {
                "name": "group",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu group lưu trữ thuộc tính nghiệp vụ của membership_withdrawal_requests"
            },
            {
                "name": "member",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu member lưu trữ thuộc tính nghiệp vụ của membership_withdrawal_requests"
            },
            {
                "name": "user",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu user lưu trữ thuộc tính nghiệp vụ của membership_withdrawal_requests"
            },
            {
                "name": "reason",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Nội dung văn bản ghi chú chi tiết hoặc giải trình nguyên nhân"
            },
            {
                "name": "rejection_reason",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Nội dung văn bản ghi chú chi tiết hoặc giải trình nguyên nhân"
            },
            {
                "name": "created_at",
                "type": "DATETIME",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Thời điểm tạo bản ghi lần đầu trong hệ thống (UTC ISO 8601 Timestamp)"
            },
            {
                "name": "reviewed_at",
                "type": "DATETIME",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu reviewed_at lưu trữ thuộc tính nghiệp vụ của membership_withdrawal_requests"
            },
            {
                "name": "reviewed_by_user",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu reviewed_by_user lưu trữ thuộc tính nghiệp vụ của membership_withdrawal_requests"
            },
            {
                "name": "updated_at",
                "type": "DATETIME",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Thời điểm cập nhật bản ghi gần nhất trong hệ thống (UTC Timestamp)"
            },
        ]
    },
    "notifications": {
        "name": "notifications",
        "purpose": "Hệ thống thông báo đẩy gửi đến người dùng theo sự kiện vận hành",
        "columns": [
            {
                "name": "id",
                "type": "VARCHAR(36)",
                "pk": "YES",
                "fk": "NO",
                "nullable": "NO",
                "default": "None",
                "unique": "NO",
                "desc": "Khóa chính định danh duy nhất của bản ghi (UUID v4 / Long Auto-increment)"
            },
            {
                "name": "recipient",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu recipient lưu trữ thuộc tính nghiệp vụ của notifications"
            },
            {
                "name": "vehicle_id",
                "type": "VARCHAR(36)",
                "pk": "NO",
                "fk": "YES (FK -> vehicles.id)",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Khóa ngoại liên kết tới phương tiện xe điện liên quan (FK -> vehicles.id)"
            },
            {
                "name": "group_id",
                "type": "VARCHAR(36)",
                "pk": "NO",
                "fk": "YES (FK -> co_ownership_groups.id)",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Khóa ngoại liên kết nhóm đồng sở hữu phương tiện (FK -> co_ownership_groups.id)"
            },
            {
                "name": "entity_type",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu entity_type lưu trữ thuộc tính nghiệp vụ của notifications"
            },
            {
                "name": "entity_id",
                "type": "VARCHAR(36)",
                "pk": "NO",
                "fk": "YES (FK -> entitys.id)",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu entity_id lưu trữ thuộc tính nghiệp vụ của notifications"
            },
            {
                "name": "event_type",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu event_type lưu trữ thuộc tính nghiệp vụ của notifications"
            },
            {
                "name": "title",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu title lưu trữ thuộc tính nghiệp vụ của notifications"
            },
            {
                "name": "message",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu message lưu trữ thuộc tính nghiệp vụ của notifications"
            },
            {
                "name": "read_at",
                "type": "DATETIME",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu read_at lưu trữ thuộc tính nghiệp vụ của notifications"
            },
            {
                "name": "created_at",
                "type": "DATETIME",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Thời điểm tạo bản ghi lần đầu trong hệ thống (UTC ISO 8601 Timestamp)"
            },
        ]
    },
    "ownership_change_history": {
        "name": "ownership_change_history",
        "purpose": "Nhật ký biến động lịch sử tái phân bổ và chuyển nhượng tỷ lệ sở hữu",
        "columns": [
            {
                "name": "id",
                "type": "VARCHAR(36)",
                "pk": "YES",
                "fk": "NO",
                "nullable": "NO",
                "default": "None",
                "unique": "NO",
                "desc": "Khóa chính định danh duy nhất của bản ghi (UUID v4 / Long Auto-increment)"
            },
            {
                "name": "group",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu group lưu trữ thuộc tính nghiệp vụ của ownership_change_history"
            },
            {
                "name": "vehicle",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu vehicle lưu trữ thuộc tính nghiệp vụ của ownership_change_history"
            },
            {
                "name": "transfer_request",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu transfer_request lưu trữ thuộc tính nghiệp vụ của ownership_change_history"
            },
            {
                "name": "from_user",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu from_user lưu trữ thuộc tính nghiệp vụ của ownership_change_history"
            },
            {
                "name": "to_user",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu to_user lưu trữ thuộc tính nghiệp vụ của ownership_change_history"
            },
            {
                "name": "transferred_percentage",
                "type": "DECIMAL(5,2)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Tỷ lệ phần trăm cổ phần sở hữu xe điện (định dạng phần trăm từ 0.00% đến 100.00%)"
            },
            {
                "name": "previous_ownership_snapshot",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu previous_ownership_snapshot lưu trữ thuộc tính nghiệp vụ của ownership_change_history"
            },
            {
                "name": "new_ownership_snapshot",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu new_ownership_snapshot lưu trữ thuộc tính nghiệp vụ của ownership_change_history"
            },
            {
                "name": "reason",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Nội dung văn bản ghi chú chi tiết hoặc giải trình nguyên nhân"
            },
            {
                "name": "effective_at",
                "type": "DATETIME",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu effective_at lưu trữ thuộc tính nghiệp vụ của ownership_change_history"
            },
            {
                "name": "recorded_at",
                "type": "DATETIME",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu recorded_at lưu trữ thuộc tính nghiệp vụ của ownership_change_history"
            },
            {
                "name": "recorded_by_user",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu recorded_by_user lưu trữ thuộc tính nghiệp vụ của ownership_change_history"
            },
        ]
    },
    "ownership_shares": {
        "name": "ownership_shares",
        "purpose": "Lưu tỷ lệ sở hữu vốn (%) của từng thành viên (bất biến tổng bằng đúng 100%)",
        "columns": [
            {
                "name": "id",
                "type": "VARCHAR(36)",
                "pk": "YES",
                "fk": "NO",
                "nullable": "NO",
                "default": "None",
                "unique": "NO",
                "desc": "Khóa chính định danh duy nhất của bản ghi (UUID v4 / Long Auto-increment)"
            },
            {
                "name": "group",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu group lưu trữ thuộc tính nghiệp vụ của ownership_shares"
            },
            {
                "name": "vehicle",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu vehicle lưu trữ thuộc tính nghiệp vụ của ownership_shares"
            },
            {
                "name": "member",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu member lưu trữ thuộc tính nghiệp vụ của ownership_shares"
            },
            {
                "name": "percentage",
                "type": "DECIMAL(5,2)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Tỷ lệ phần trăm cổ phần sở hữu xe điện (định dạng phần trăm từ 0.00% đến 100.00%)"
            },
            {
                "name": "created_at",
                "type": "DATETIME",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Thời điểm tạo bản ghi lần đầu trong hệ thống (UTC ISO 8601 Timestamp)"
            },
            {
                "name": "updated_at",
                "type": "DATETIME",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Thời điểm cập nhật bản ghi gần nhất trong hệ thống (UTC Timestamp)"
            },
        ]
    },
    "ownership_transfer_requests": {
        "name": "ownership_transfer_requests",
        "purpose": "Yêu cầu chuyển nhượng cổ phần giữa các thành viên kèm tiến trình đồng thuận",
        "columns": [
            {
                "name": "id",
                "type": "VARCHAR(36)",
                "pk": "YES",
                "fk": "NO",
                "nullable": "NO",
                "default": "None",
                "unique": "NO",
                "desc": "Khóa chính định danh duy nhất của bản ghi (UUID v4 / Long Auto-increment)"
            },
            {
                "name": "group",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu group lưu trữ thuộc tính nghiệp vụ của ownership_transfer_requests"
            },
            {
                "name": "vehicle",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu vehicle lưu trữ thuộc tính nghiệp vụ của ownership_transfer_requests"
            },
            {
                "name": "from_user",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu from_user lưu trữ thuộc tính nghiệp vụ của ownership_transfer_requests"
            },
            {
                "name": "to_user",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu to_user lưu trữ thuộc tính nghiệp vụ của ownership_transfer_requests"
            },
            {
                "name": "transfer_percentage",
                "type": "DECIMAL(5,2)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Tỷ lệ phần trăm cổ phần sở hữu xe điện (định dạng phần trăm từ 0.00% đến 100.00%)"
            },
            {
                "name": "reason",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Nội dung văn bản ghi chú chi tiết hoặc giải trình nguyên nhân"
            },
            {
                "name": "rejection_reason",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Nội dung văn bản ghi chú chi tiết hoặc giải trình nguyên nhân"
            },
            {
                "name": "contract_version",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu contract_version lưu trữ thuộc tính nghiệp vụ của ownership_transfer_requests"
            },
            {
                "name": "related_proposal_id",
                "type": "VARCHAR(36)",
                "pk": "NO",
                "fk": "YES (FK -> related_proposals.id)",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu related_proposal_id lưu trữ thuộc tính nghiệp vụ của ownership_transfer_requests"
            },
            {
                "name": "created_at",
                "type": "DATETIME",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Thời điểm tạo bản ghi lần đầu trong hệ thống (UTC ISO 8601 Timestamp)"
            },
            {
                "name": "accepted_at",
                "type": "DATETIME",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu accepted_at lưu trữ thuộc tính nghiệp vụ của ownership_transfer_requests"
            },
            {
                "name": "approved_at",
                "type": "DATETIME",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu approved_at lưu trữ thuộc tính nghiệp vụ của ownership_transfer_requests"
            },
            {
                "name": "completed_at",
                "type": "DATETIME",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu completed_at lưu trữ thuộc tính nghiệp vụ của ownership_transfer_requests"
            },
            {
                "name": "rejected_at",
                "type": "DATETIME",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu rejected_at lưu trữ thuộc tính nghiệp vụ của ownership_transfer_requests"
            },
            {
                "name": "cancelled_at",
                "type": "DATETIME",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu cancelled_at lưu trữ thuộc tính nghiệp vụ của ownership_transfer_requests"
            },
            {
                "name": "effective_at",
                "type": "DATETIME",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu effective_at lưu trữ thuộc tính nghiệp vụ của ownership_transfer_requests"
            },
            {
                "name": "updated_at",
                "type": "DATETIME",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Thời điểm cập nhật bản ghi gần nhất trong hệ thống (UTC Timestamp)"
            },
        ]
    },
    "personal_expense_payments": {
        "name": "personal_expense_payments",
        "purpose": "Chứng từ nộp thanh toán cá nhân DEMO và nhân viên xác minh tất toán nợ",
        "columns": [
            {
                "name": "id",
                "type": "VARCHAR(36)",
                "pk": "YES",
                "fk": "NO",
                "nullable": "NO",
                "default": "None",
                "unique": "NO",
                "desc": "Khóa chính định danh duy nhất của bản ghi (UUID v4 / Long Auto-increment)"
            },
            {
                "name": "expense",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu expense lưu trữ thuộc tính nghiệp vụ của personal_expense_payments"
            },
            {
                "name": "expense_share",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu expense_share lưu trữ thuộc tính nghiệp vụ của personal_expense_payments"
            },
            {
                "name": "payer_user",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu payer_user lưu trữ thuộc tính nghiệp vụ của personal_expense_payments"
            },
            {
                "name": "amount",
                "type": "DECIMAL(14,2)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Giá trị tài chính bằng đơn vị tiền tệ VND phát sinh trong giao dịch"
            },
            {
                "name": "payment_reference",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu payment_reference lưu trữ thuộc tính nghiệp vụ của personal_expense_payments"
            },
            {
                "name": "evidence_url",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Đường dẫn liên kết URI tới tệp lưu trữ media / ảnh chụp đính kèm"
            },
            {
                "name": "note",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Nội dung văn bản ghi chú chi tiết hoặc giải trình nguyên nhân"
            },
            {
                "name": "created_at",
                "type": "DATETIME",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Thời điểm tạo bản ghi lần đầu trong hệ thống (UTC ISO 8601 Timestamp)"
            },
            {
                "name": "verified_at",
                "type": "DATETIME",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu verified_at lưu trữ thuộc tính nghiệp vụ của personal_expense_payments"
            },
            {
                "name": "verified_by_user",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu verified_by_user lưu trữ thuộc tính nghiệp vụ của personal_expense_payments"
            },
        ]
    },
    "proposal_vote_eligibility": {
        "name": "proposal_vote_eligibility",
        "purpose": "Danh sách cử tri hợp lệ và tỷ lệ quyền biểu quyết đối với từng đề xuất",
        "columns": [
            {
                "name": "id",
                "type": "VARCHAR(36)",
                "pk": "YES",
                "fk": "NO",
                "nullable": "NO",
                "default": "None",
                "unique": "NO",
                "desc": "Khóa chính định danh duy nhất của bản ghi (UUID v4 / Long Auto-increment)"
            },
            {
                "name": "proposal",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu proposal lưu trữ thuộc tính nghiệp vụ của proposal_vote_eligibility"
            },
            {
                "name": "user",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu user lưu trữ thuộc tính nghiệp vụ của proposal_vote_eligibility"
            },
            {
                "name": "member",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu member lưu trữ thuộc tính nghiệp vụ của proposal_vote_eligibility"
            },
            {
                "name": "voting_weight",
                "type": "DECIMAL(12,2)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu voting_weight lưu trữ thuộc tính nghiệp vụ của proposal_vote_eligibility"
            },
            {
                "name": "created_at",
                "type": "DATETIME",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Thời điểm tạo bản ghi lần đầu trong hệ thống (UTC ISO 8601 Timestamp)"
            },
        ]
    },
    "proposal_votes": {
        "name": "proposal_votes",
        "purpose": "Lá phiếu biểu quyết của thành viên (FOR/AGAINST) với trọng số bằng % sở hữu",
        "columns": [
            {
                "name": "id",
                "type": "VARCHAR(36)",
                "pk": "YES",
                "fk": "NO",
                "nullable": "NO",
                "default": "None",
                "unique": "NO",
                "desc": "Khóa chính định danh duy nhất của bản ghi (UUID v4 / Long Auto-increment)"
            },
            {
                "name": "proposal",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu proposal lưu trữ thuộc tính nghiệp vụ của proposal_votes"
            },
            {
                "name": "voter_user",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu voter_user lưu trữ thuộc tính nghiệp vụ của proposal_votes"
            },
            {
                "name": "member",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu member lưu trữ thuộc tính nghiệp vụ của proposal_votes"
            },
            {
                "name": "choice",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu choice lưu trữ thuộc tính nghiệp vụ của proposal_votes"
            },
            {
                "name": "voting_weight_snapshot",
                "type": "DECIMAL(12,2)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu voting_weight_snapshot lưu trữ thuộc tính nghiệp vụ của proposal_votes"
            },
            {
                "name": "comment",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu comment lưu trữ thuộc tính nghiệp vụ của proposal_votes"
            },
            {
                "name": "cast_at",
                "type": "DATETIME",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu cast_at lưu trữ thuộc tính nghiệp vụ của proposal_votes"
            },
            {
                "name": "updated_at",
                "type": "DATETIME",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Thời điểm cập nhật bản ghi gần nhất trong hệ thống (UTC Timestamp)"
            },
        ]
    },
    "refresh_tokens": {
        "name": "refresh_tokens",
        "purpose": "Quản lý mã làm mới phiên đăng nhập JWT (Refresh Token) và thời gian sống",
        "columns": [
            {
                "name": "id",
                "type": "VARCHAR(36)",
                "pk": "YES",
                "fk": "NO",
                "nullable": "NO",
                "default": "None",
                "unique": "NO",
                "desc": "Khóa chính định danh duy nhất của bản ghi (UUID v4 / Long Auto-increment)"
            },
            {
                "name": "user",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu user lưu trữ thuộc tính nghiệp vụ của refresh_tokens"
            },
            {
                "name": "token",
                "type": "VARCHAR(512)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "YES",
                "desc": "Chuỗi mã token bảo mật phân cấp dùng trong phiên xác thực JWT hoặc mời tham gia"
            },
            {
                "name": "expiry_date",
                "type": "DATETIME",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "YES",
                "desc": "Trường dữ liệu expiry_date lưu trữ thuộc tính nghiệp vụ của refresh_tokens"
            },
            {
                "name": "created_at",
                "type": "DATETIME",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Thời điểm tạo bản ghi lần đầu trong hệ thống (UTC ISO 8601 Timestamp)"
            },
            {
                "name": "updated_at",
                "type": "DATETIME",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Thời điểm cập nhật bản ghi gần nhất trong hệ thống (UTC Timestamp)"
            },
        ]
    },
    "shared_funds": {
        "name": "shared_funds",
        "purpose": "Quỹ chung phương tiện (Bảo lưu cấu trúc dữ liệu di sản / chế độ dự phòng)",
        "columns": [
            {
                "name": "id",
                "type": "VARCHAR(36)",
                "pk": "YES",
                "fk": "NO",
                "nullable": "NO",
                "default": "None",
                "unique": "NO",
                "desc": "Khóa chính định danh duy nhất của bản ghi (UUID v4 / Long Auto-increment)"
            },
            {
                "name": "group",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "YES",
                "desc": "Trường dữ liệu group lưu trữ thuộc tính nghiệp vụ của shared_funds"
            },
            {
                "name": "created_at",
                "type": "DATETIME",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Thời điểm tạo bản ghi lần đầu trong hệ thống (UTC ISO 8601 Timestamp)"
            },
            {
                "name": "updated_at",
                "type": "DATETIME",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Thời điểm cập nhật bản ghi gần nhất trong hệ thống (UTC Timestamp)"
            },
        ]
    },
    "trip_extension_requests": {
        "name": "trip_extension_requests",
        "purpose": "Yêu cầu xin gia hạn thêm giờ của chuyến đi và tiến trình đàm phán người kế tiếp",
        "columns": [
            {
                "name": "id",
                "type": "VARCHAR(36)",
                "pk": "YES",
                "fk": "NO",
                "nullable": "NO",
                "default": "None",
                "unique": "NO",
                "desc": "Khóa chính định danh duy nhất của bản ghi (UUID v4 / Long Auto-increment)"
            },
            {
                "name": "trip",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu trip lưu trữ thuộc tính nghiệp vụ của trip_extension_requests"
            },
            {
                "name": "vehicle",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu vehicle lưu trữ thuộc tính nghiệp vụ của trip_extension_requests"
            },
            {
                "name": "requester",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu requester lưu trữ thuộc tính nghiệp vụ của trip_extension_requests"
            },
            {
                "name": "current_booking",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu current_booking lưu trữ thuộc tính nghiệp vụ của trip_extension_requests"
            },
            {
                "name": "original_end_time",
                "type": "DATETIME",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu original_end_time lưu trữ thuộc tính nghiệp vụ của trip_extension_requests"
            },
            {
                "name": "proposed_end_time",
                "type": "DATETIME",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu proposed_end_time lưu trữ thuộc tính nghiệp vụ của trip_extension_requests"
            },
            {
                "name": "additional_minutes",
                "type": "INT",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "0",
                "unique": "NO",
                "desc": "Trường dữ liệu additional_minutes lưu trữ thuộc tính nghiệp vụ của trip_extension_requests"
            },
            {
                "name": "affected_booking",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu affected_booking lưu trữ thuộc tính nghiệp vụ của trip_extension_requests"
            },
            {
                "name": "affected_owner",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu affected_owner lưu trữ thuộc tính nghiệp vụ của trip_extension_requests"
            },
            {
                "name": "proposed_affected_start_time",
                "type": "DATETIME",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu proposed_affected_start_time lưu trữ thuộc tính nghiệp vụ của trip_extension_requests"
            },
            {
                "name": "reason",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Nội dung văn bản ghi chú chi tiết hoặc giải trình nguyên nhân"
            },
            {
                "name": "response_deadline",
                "type": "DATETIME",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu response_deadline lưu trữ thuộc tính nghiệp vụ của trip_extension_requests"
            },
            {
                "name": "created_at",
                "type": "DATETIME",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Thời điểm tạo bản ghi lần đầu trong hệ thống (UTC ISO 8601 Timestamp)"
            },
            {
                "name": "updated_at",
                "type": "DATETIME",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Thời điểm cập nhật bản ghi gần nhất trong hệ thống (UTC Timestamp)"
            },
        ]
    },
    "trips": {
        "name": "trips",
        "purpose": "Quản lý chu trình hành trình di chuyển thực tế, ODO/Pin lúc đi và về, điện năng tiêu thụ",
        "columns": [
            {
                "name": "id",
                "type": "VARCHAR(36)",
                "pk": "YES",
                "fk": "NO",
                "nullable": "NO",
                "default": "None",
                "unique": "NO",
                "desc": "Khóa chính định danh duy nhất của bản ghi (UUID v4 / Long Auto-increment)"
            },
            {
                "name": "booking",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "YES",
                "desc": "Trường dữ liệu booking lưu trữ thuộc tính nghiệp vụ của trips"
            },
            {
                "name": "vehicle",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu vehicle lưu trữ thuộc tính nghiệp vụ của trips"
            },
            {
                "name": "user",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu user lưu trữ thuộc tính nghiệp vụ của trips"
            },
            {
                "name": "started_at",
                "type": "DATETIME",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu started_at lưu trữ thuộc tính nghiệp vụ của trips"
            },
            {
                "name": "ended_at",
                "type": "DATETIME",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu ended_at lưu trữ thuộc tính nghiệp vụ của trips"
            },
            {
                "name": "start_odometer",
                "type": "DECIMAL(12,2)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Số đo quãng đường lăn bánh của xe điện (Kilomet)"
            },
            {
                "name": "end_odometer",
                "type": "DECIMAL(12,2)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Số đo quãng đường lăn bánh của xe điện (Kilomet)"
            },
            {
                "name": "start_battery_level",
                "type": "INT",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "0",
                "unique": "NO",
                "desc": "Thông số trạng thái dung lượng pin xe điện (SOC % hoặc kWh)"
            },
            {
                "name": "end_battery_level",
                "type": "INT",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "0",
                "unique": "NO",
                "desc": "Thông số trạng thái dung lượng pin xe điện (SOC % hoặc kWh)"
            },
            {
                "name": "end_soc_percent",
                "type": "DECIMAL(12,2)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Thông số trạng thái dung lượng pin xe điện (SOC % hoặc kWh)"
            },
            {
                "name": "energy_consumed_kwh",
                "type": "DECIMAL(12,2)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu energy_consumed_kwh lưu trữ thuộc tính nghiệp vụ của trips"
            },
            {
                "name": "soc_consumed_percent",
                "type": "DECIMAL(12,2)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Thông số trạng thái dung lượng pin xe điện (SOC % hoặc kWh)"
            },
            {
                "name": "return_verified_by",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu return_verified_by lưu trữ thuộc tính nghiệp vụ của trips"
            },
            {
                "name": "return_verified_at",
                "type": "DATETIME",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu return_verified_at lưu trữ thuộc tính nghiệp vụ của trips"
            },
            {
                "name": "return_note",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Nội dung văn bản ghi chú chi tiết hoặc giải trình nguyên nhân"
            },
            {
                "name": "return_requested_at",
                "type": "DATETIME",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu return_requested_at lưu trữ thuộc tính nghiệp vụ của trips"
            },
            {
                "name": "created_at",
                "type": "DATETIME",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Thời điểm tạo bản ghi lần đầu trong hệ thống (UTC ISO 8601 Timestamp)"
            },
            {
                "name": "updated_at",
                "type": "DATETIME",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Thời điểm cập nhật bản ghi gần nhất trong hệ thống (UTC Timestamp)"
            },
        ]
    },
    "users": {
        "name": "users",
        "purpose": "Lưu trữ tài khoản người dùng, email, mật khẩu băm BCrypt, họ tên và vai trò",
        "columns": [
            {
                "name": "id",
                "type": "VARCHAR(36)",
                "pk": "YES",
                "fk": "NO",
                "nullable": "NO",
                "default": "None",
                "unique": "NO",
                "desc": "Khóa chính định danh duy nhất của bản ghi (UUID v4 / Long Auto-increment)"
            },
            {
                "name": "email",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "YES",
                "desc": "Địa chỉ thư điện tử xác thực của người dùng"
            },
            {
                "name": "password_hash",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "YES",
                "desc": "Trường dữ liệu password_hash lưu trữ thuộc tính nghiệp vụ của users"
            },
            {
                "name": "full_name",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu full_name lưu trữ thuộc tính nghiệp vụ của users"
            },
            {
                "name": "role",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu role lưu trữ thuộc tính nghiệp vụ của users"
            },
            {
                "name": "status",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trạng thái vòng đời của bản ghi trong quy trình nghiệp vụ users"
            },
            {
                "name": "created_at",
                "type": "DATETIME",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Thời điểm tạo bản ghi lần đầu trong hệ thống (UTC ISO 8601 Timestamp)"
            },
            {
                "name": "updated_at",
                "type": "DATETIME",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Thời điểm cập nhật bản ghi gần nhất trong hệ thống (UTC Timestamp)"
            },
        ]
    },
    "vehicle_battery_health": {
        "name": "vehicle_battery_health",
        "purpose": "Theo dõi sức khỏe cụm pin: Tỷ lệ SOH, dung lượng khả dụng kWh, số chu kỳ sạc",
        "columns": [
            {
                "name": "id",
                "type": "VARCHAR(36)",
                "pk": "YES",
                "fk": "NO",
                "nullable": "NO",
                "default": "None",
                "unique": "NO",
                "desc": "Khóa chính định danh duy nhất của bản ghi (UUID v4 / Long Auto-increment)"
            },
            {
                "name": "vehicle",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "YES",
                "desc": "Trường dữ liệu vehicle lưu trữ thuộc tính nghiệp vụ của vehicle_battery_health"
            },
            {
                "name": "state_of_health_percent",
                "type": "DECIMAL(5,2)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "YES",
                "desc": "Chỉ số sức khỏe pin thực tế (SOH %) đo lường theo tiêu chuẩn BMS"
            },
            {
                "name": "estimated_range_km",
                "type": "DECIMAL(12,2)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Số đo quãng đường lăn bánh của xe điện (Kilomet)"
            },
            {
                "name": "capacity_kwh",
                "type": "DECIMAL(12,2)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu capacity_kwh lưu trữ thuộc tính nghiệp vụ của vehicle_battery_health"
            },
            {
                "name": "usable_capacity_kwh",
                "type": "DECIMAL(12,2)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu usable_capacity_kwh lưu trữ thuộc tính nghiệp vụ của vehicle_battery_health"
            },
            {
                "name": "voltage",
                "type": "DECIMAL(12,2)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu voltage lưu trữ thuộc tính nghiệp vụ của vehicle_battery_health"
            },
            {
                "name": "temperature_celsius",
                "type": "DECIMAL(12,2)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu temperature_celsius lưu trữ thuộc tính nghiệp vụ của vehicle_battery_health"
            },
            {
                "name": "cycle_count",
                "type": "INT",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "0",
                "unique": "NO",
                "desc": "Trường dữ liệu cycle_count lưu trữ thuộc tính nghiệp vụ của vehicle_battery_health"
            },
            {
                "name": "battery_status",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Thông số trạng thái dung lượng pin xe điện (SOC % hoặc kWh)"
            },
            {
                "name": "last_inspected_at",
                "type": "DATETIME",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu last_inspected_at lưu trữ thuộc tính nghiệp vụ của vehicle_battery_health"
            },
            {
                "name": "created_at",
                "type": "DATETIME",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Thời điểm tạo bản ghi lần đầu trong hệ thống (UTC ISO 8601 Timestamp)"
            },
            {
                "name": "updated_at",
                "type": "DATETIME",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Thời điểm cập nhật bản ghi gần nhất trong hệ thống (UTC Timestamp)"
            },
        ]
    },
    "vehicle_energy_inventories": {
        "name": "vehicle_energy_inventories",
        "purpose": "Kho năng lượng số của xe: Số kWh khả dụng, tổng giá trị vốn, đơn giá bình quân WAC",
        "columns": [
            {
                "name": "id",
                "type": "VARCHAR(36)",
                "pk": "YES",
                "fk": "NO",
                "nullable": "NO",
                "default": "None",
                "unique": "NO",
                "desc": "Khóa chính định danh duy nhất của bản ghi (UUID v4 / Long Auto-increment)"
            },
            {
                "name": "vehicle",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "YES",
                "desc": "Trường dữ liệu vehicle lưu trữ thuộc tính nghiệp vụ của vehicle_energy_inventories"
            },
            {
                "name": "last_charging_session_id",
                "type": "VARCHAR(36)",
                "pk": "NO",
                "fk": "YES (FK -> last_charging_sessions.id)",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu last_charging_session_id lưu trữ thuộc tính nghiệp vụ của vehicle_energy_inventories"
            },
            {
                "name": "last_trip_id",
                "type": "VARCHAR(36)",
                "pk": "NO",
                "fk": "YES (FK -> last_trips.id)",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu last_trip_id lưu trữ thuộc tính nghiệp vụ của vehicle_energy_inventories"
            },
            {
                "name": "reconciliation_note",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Nội dung văn bản ghi chú chi tiết hoặc giải trình nguyên nhân"
            },
            {
                "name": "created_at",
                "type": "DATETIME",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Thời điểm tạo bản ghi lần đầu trong hệ thống (UTC ISO 8601 Timestamp)"
            },
            {
                "name": "updated_at",
                "type": "DATETIME",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Thời điểm cập nhật bản ghi gần nhất trong hệ thống (UTC Timestamp)"
            },
        ]
    },
    "vehicle_energy_transactions": {
        "name": "vehicle_energy_transactions",
        "purpose": "Nhật ký giao dịch xuất nhập kho năng lượng: Nạp sạc (INFLOW), chuyến đi (TRIP)",
        "columns": [
            {
                "name": "id",
                "type": "VARCHAR(36)",
                "pk": "YES",
                "fk": "NO",
                "nullable": "NO",
                "default": "None",
                "unique": "NO",
                "desc": "Khóa chính định danh duy nhất của bản ghi (UUID v4 / Long Auto-increment)"
            },
            {
                "name": "inventory",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu inventory lưu trữ thuộc tính nghiệp vụ của vehicle_energy_transactions"
            },
            {
                "name": "vehicle",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu vehicle lưu trữ thuộc tính nghiệp vụ của vehicle_energy_transactions"
            },
            {
                "name": "transaction_type",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu transaction_type lưu trữ thuộc tính nghiệp vụ của vehicle_energy_transactions"
            },
            {
                "name": "delta_energy_kwh",
                "type": "DECIMAL(12,2)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu delta_energy_kwh lưu trữ thuộc tính nghiệp vụ của vehicle_energy_transactions"
            },
            {
                "name": "delta_cost",
                "type": "DECIMAL(12,2)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu delta_cost lưu trữ thuộc tính nghiệp vụ của vehicle_energy_transactions"
            },
            {
                "name": "unit_cost",
                "type": "DECIMAL(12,2)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu unit_cost lưu trữ thuộc tính nghiệp vụ của vehicle_energy_transactions"
            },
            {
                "name": "balance_energy_kwh_after",
                "type": "DECIMAL(12,2)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu balance_energy_kwh_after lưu trữ thuộc tính nghiệp vụ của vehicle_energy_transactions"
            },
            {
                "name": "balance_cost_after",
                "type": "DECIMAL(12,2)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu balance_cost_after lưu trữ thuộc tính nghiệp vụ của vehicle_energy_transactions"
            },
            {
                "name": "weighted_avg_cost_after",
                "type": "DECIMAL(12,2)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu weighted_avg_cost_after lưu trữ thuộc tính nghiệp vụ của vehicle_energy_transactions"
            },
            {
                "name": "operator_or_driver_user_id",
                "type": "VARCHAR(36)",
                "pk": "NO",
                "fk": "YES (FK -> operator_or_driver_users.id)",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu operator_or_driver_user_id lưu trữ thuộc tính nghiệp vụ của vehicle_energy_transactions"
            },
            {
                "name": "operator_or_driver_name",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu operator_or_driver_name lưu trữ thuộc tính nghiệp vụ của vehicle_energy_transactions"
            },
            {
                "name": "source_reference_id",
                "type": "VARCHAR(36)",
                "pk": "NO",
                "fk": "YES (FK -> source_references.id)",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu source_reference_id lưu trữ thuộc tính nghiệp vụ của vehicle_energy_transactions"
            },
            {
                "name": "note",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Nội dung văn bản ghi chú chi tiết hoặc giải trình nguyên nhân"
            },
            {
                "name": "recorded_at",
                "type": "DATETIME",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu recorded_at lưu trữ thuộc tính nghiệp vụ của vehicle_energy_transactions"
            },
        ]
    },
    "vehicle_handovers": {
        "name": "vehicle_handovers",
        "purpose": "Biên bản bàn giao xe kỹ thuật: ODO xuất phát, pin, chữ ký nhân viên và chủ xe",
        "columns": [
            {
                "name": "id",
                "type": "VARCHAR(36)",
                "pk": "YES",
                "fk": "NO",
                "nullable": "NO",
                "default": "None",
                "unique": "NO",
                "desc": "Khóa chính định danh duy nhất của bản ghi (UUID v4 / Long Auto-increment)"
            },
            {
                "name": "booking",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "YES",
                "desc": "Trường dữ liệu booking lưu trữ thuộc tính nghiệp vụ của vehicle_handovers"
            },
            {
                "name": "vehicle",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu vehicle lưu trữ thuộc tính nghiệp vụ của vehicle_handovers"
            },
            {
                "name": "staff",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu staff lưu trữ thuộc tính nghiệp vụ của vehicle_handovers"
            },
            {
                "name": "co_owner",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu co_owner lưu trữ thuộc tính nghiệp vụ của vehicle_handovers"
            },
            {
                "name": "staff_prepared_at",
                "type": "DATETIME",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu staff_prepared_at lưu trữ thuộc tính nghiệp vụ của vehicle_handovers"
            },
            {
                "name": "staff_handed_over_at",
                "type": "DATETIME",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu staff_handed_over_at lưu trữ thuộc tính nghiệp vụ của vehicle_handovers"
            },
            {
                "name": "owner_received_at",
                "type": "DATETIME",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu owner_received_at lưu trữ thuộc tính nghiệp vụ của vehicle_handovers"
            },
            {
                "name": "owner_condition_acknowledged_at",
                "type": "DATETIME",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu owner_condition_acknowledged_at lưu trữ thuộc tính nghiệp vụ của vehicle_handovers"
            },
            {
                "name": "inspection",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu inspection lưu trữ thuộc tính nghiệp vụ của vehicle_handovers"
            },
            {
                "name": "created_at",
                "type": "DATETIME",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Thời điểm tạo bản ghi lần đầu trong hệ thống (UTC ISO 8601 Timestamp)"
            },
            {
                "name": "updated_at",
                "type": "DATETIME",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Thời điểm cập nhật bản ghi gần nhất trong hệ thống (UTC Timestamp)"
            },
        ]
    },
    "vehicle_inspection_items": {
        "name": "vehicle_inspection_items",
        "purpose": "Chi tiết đánh giá từng hạng mục kiểm tra kỹ thuật (lốp, phanh, đèn, kính)",
        "columns": [
            {
                "name": "id",
                "type": "VARCHAR(36)",
                "pk": "YES",
                "fk": "NO",
                "nullable": "NO",
                "default": "None",
                "unique": "NO",
                "desc": "Khóa chính định danh duy nhất của bản ghi (UUID v4 / Long Auto-increment)"
            },
            {
                "name": "inspection",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu inspection lưu trữ thuộc tính nghiệp vụ của vehicle_inspection_items"
            },
            {
                "name": "vehicle_part_code",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu vehicle_part_code lưu trữ thuộc tính nghiệp vụ của vehicle_inspection_items"
            },
            {
                "name": "note",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Nội dung văn bản ghi chú chi tiết hoặc giải trình nguyên nhân"
            },
            {
                "name": "created_at",
                "type": "DATETIME",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Thời điểm tạo bản ghi lần đầu trong hệ thống (UTC ISO 8601 Timestamp)"
            },
        ]
    },
    "vehicle_inspections": {
        "name": "vehicle_inspections",
        "purpose": "Biên bản kiểm định kỹ thuật tổng thể phương tiện (PASSED / FAILED)",
        "columns": [
            {
                "name": "id",
                "type": "VARCHAR(36)",
                "pk": "YES",
                "fk": "NO",
                "nullable": "NO",
                "default": "None",
                "unique": "NO",
                "desc": "Khóa chính định danh duy nhất của bản ghi (UUID v4 / Long Auto-increment)"
            },
            {
                "name": "vehicle",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu vehicle lưu trữ thuộc tính nghiệp vụ của vehicle_inspections"
            },
            {
                "name": "inspected_by",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu inspected_by lưu trữ thuộc tính nghiệp vụ của vehicle_inspections"
            },
            {
                "name": "overall_result",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu overall_result lưu trữ thuộc tính nghiệp vụ của vehicle_inspections"
            },
            {
                "name": "summary_note",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Nội dung văn bản ghi chú chi tiết hoặc giải trình nguyên nhân"
            },
            {
                "name": "started_at",
                "type": "DATETIME",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu started_at lưu trữ thuộc tính nghiệp vụ của vehicle_inspections"
            },
            {
                "name": "completed_at",
                "type": "DATETIME",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu completed_at lưu trữ thuộc tính nghiệp vụ của vehicle_inspections"
            },
            {
                "name": "created_at",
                "type": "DATETIME",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Thời điểm tạo bản ghi lần đầu trong hệ thống (UTC ISO 8601 Timestamp)"
            },
            {
                "name": "updated_at",
                "type": "DATETIME",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Thời điểm cập nhật bản ghi gần nhất trong hệ thống (UTC Timestamp)"
            },
        ]
    },
    "vehicle_registration_drafts": {
        "name": "vehicle_registration_drafts",
        "purpose": "Dự thảo hồ sơ đăng ký thông số kỹ thuật xe trước khi đưa vào vận hành",
        "columns": [
            {
                "name": "id",
                "type": "VARCHAR(36)",
                "pk": "YES",
                "fk": "NO",
                "nullable": "NO",
                "default": "None",
                "unique": "NO",
                "desc": "Khóa chính định danh duy nhất của bản ghi (UUID v4 / Long Auto-increment)"
            },
            {
                "name": "user_id",
                "type": "VARCHAR(36)",
                "pk": "NO",
                "fk": "YES (FK -> users.id)",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Khóa ngoại liên kết tới tài khoản người dùng thực hiện (FK -> users.id)"
            },
            {
                "name": "vehicle_name",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu vehicle_name lưu trữ thuộc tính nghiệp vụ của vehicle_registration_drafts"
            },
            {
                "name": "manufacturer",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu manufacturer lưu trữ thuộc tính nghiệp vụ của vehicle_registration_drafts"
            },
            {
                "name": "model",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu model lưu trữ thuộc tính nghiệp vụ của vehicle_registration_drafts"
            },
            {
                "name": "model_year",
                "type": "INT",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "0",
                "unique": "NO",
                "desc": "Trường dữ liệu model_year lưu trữ thuộc tính nghiệp vụ của vehicle_registration_drafts"
            },
            {
                "name": "license_plate",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu license_plate lưu trữ thuộc tính nghiệp vụ của vehicle_registration_drafts"
            },
            {
                "name": "vin",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu vin lưu trữ thuộc tính nghiệp vụ của vehicle_registration_drafts"
            },
            {
                "name": "battery_capacity",
                "type": "DECIMAL(12,2)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Thông số trạng thái dung lượng pin xe điện (SOC % hoặc kWh)"
            },
            {
                "name": "battery_type",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Thông số trạng thái dung lượng pin xe điện (SOC % hoặc kWh)"
            },
            {
                "name": "group_name",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu group_name lưu trữ thuộc tính nghiệp vụ của vehicle_registration_drafts"
            },
            {
                "name": "proposed_co_owners",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu proposed_co_owners lưu trữ thuộc tính nghiệp vụ của vehicle_registration_drafts"
            },
            {
                "name": "model3d_url",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Đường dẫn liên kết URI tới tệp lưu trữ media / ảnh chụp đính kèm"
            },
            {
                "name": "submitted_at",
                "type": "DATETIME",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu submitted_at lưu trữ thuộc tính nghiệp vụ của vehicle_registration_drafts"
            },
            {
                "name": "reviewed_by",
                "type": "VARCHAR(36)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu reviewed_by lưu trữ thuộc tính nghiệp vụ của vehicle_registration_drafts"
            },
            {
                "name": "reviewed_at",
                "type": "DATETIME",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu reviewed_at lưu trữ thuộc tính nghiệp vụ của vehicle_registration_drafts"
            },
            {
                "name": "review_decision",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu review_decision lưu trữ thuộc tính nghiệp vụ của vehicle_registration_drafts"
            },
            {
                "name": "review_reason",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Nội dung văn bản ghi chú chi tiết hoặc giải trình nguyên nhân"
            },
            {
                "name": "created_vehicle_id",
                "type": "VARCHAR(36)",
                "pk": "NO",
                "fk": "YES (FK -> created_vehicles.id)",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu created_vehicle_id lưu trữ thuộc tính nghiệp vụ của vehicle_registration_drafts"
            },
            {
                "name": "created_group_id",
                "type": "VARCHAR(36)",
                "pk": "NO",
                "fk": "YES (FK -> created_groups.id)",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu created_group_id lưu trữ thuộc tính nghiệp vụ của vehicle_registration_drafts"
            },
            {
                "name": "created_at",
                "type": "DATETIME",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Thời điểm tạo bản ghi lần đầu trong hệ thống (UTC ISO 8601 Timestamp)"
            },
            {
                "name": "updated_at",
                "type": "DATETIME",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Thời điểm cập nhật bản ghi gần nhất trong hệ thống (UTC Timestamp)"
            },
        ]
    },
    "vehicles": {
        "name": "vehicles",
        "purpose": "Quản lý danh mục phương tiện xe điện: Biển số, số khung VIN, ODO và trạng thái xe",
        "columns": [
            {
                "name": "id",
                "type": "VARCHAR(36)",
                "pk": "YES",
                "fk": "NO",
                "nullable": "NO",
                "default": "None",
                "unique": "NO",
                "desc": "Khóa chính định danh duy nhất của bản ghi (UUID v4 / Long Auto-increment)"
            },
            {
                "name": "name",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu name lưu trữ thuộc tính nghiệp vụ của vehicles"
            },
            {
                "name": "brand",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu brand lưu trữ thuộc tính nghiệp vụ của vehicles"
            },
            {
                "name": "model",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu model lưu trữ thuộc tính nghiệp vụ của vehicles"
            },
            {
                "name": "year",
                "type": "INT",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "0",
                "unique": "NO",
                "desc": "Trường dữ liệu year lưu trữ thuộc tính nghiệp vụ của vehicles"
            },
            {
                "name": "license_plate",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "YES",
                "desc": "Trường dữ liệu license_plate lưu trữ thuộc tính nghiệp vụ của vehicles"
            },
            {
                "name": "vin",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "YES",
                "desc": "Trường dữ liệu vin lưu trữ thuộc tính nghiệp vụ của vehicles"
            },
            {
                "name": "battery_capacity",
                "type": "DECIMAL(12,2)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "YES",
                "desc": "Thông số trạng thái dung lượng pin xe điện (SOC % hoặc kWh)"
            },
            {
                "name": "gross_battery_capacity_kwh",
                "type": "DECIMAL(12,2)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Thông số trạng thái dung lượng pin xe điện (SOC % hoặc kWh)"
            },
            {
                "name": "usable_battery_capacity_kwh",
                "type": "DECIMAL(12,2)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Thông số trạng thái dung lượng pin xe điện (SOC % hoặc kWh)"
            },
            {
                "name": "energy_consumption_kwh_per100_km",
                "type": "DECIMAL(12,2)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Số đo quãng đường lăn bánh của xe điện (Kilomet)"
            },
            {
                "name": "current_battery_level",
                "type": "INT",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "0",
                "unique": "NO",
                "desc": "Thông số trạng thái dung lượng pin xe điện (SOC % hoặc kWh)"
            },
            {
                "name": "odometer",
                "type": "DECIMAL(12,2)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Số đo quãng đường lăn bánh của xe điện (Kilomet)"
            },
            {
                "name": "status",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trạng thái vòng đời của bản ghi trong quy trình nghiệp vụ vehicles"
            },
            {
                "name": "model3d_url",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Đường dẫn liên kết URI tới tệp lưu trữ media / ảnh chụp đính kèm"
            },
            {
                "name": "exterior_color",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu exterior_color lưu trữ thuộc tính nghiệp vụ của vehicles"
            },
            {
                "name": "created_at",
                "type": "DATETIME",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Thời điểm tạo bản ghi lần đầu trong hệ thống (UTC ISO 8601 Timestamp)"
            },
            {
                "name": "updated_at",
                "type": "DATETIME",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Thời điểm cập nhật bản ghi gần nhất trong hệ thống (UTC Timestamp)"
            },
        ]
    },
    "vote_proposals": {
        "name": "vote_proposals",
        "purpose": "Đề xuất biểu quyết dân chủ trong nhóm xe: Nội dung, thời hạn, quy tắc MAJORITY",
        "columns": [
            {
                "name": "id",
                "type": "VARCHAR(36)",
                "pk": "YES",
                "fk": "NO",
                "nullable": "NO",
                "default": "None",
                "unique": "NO",
                "desc": "Khóa chính định danh duy nhất của bản ghi (UUID v4 / Long Auto-increment)"
            },
            {
                "name": "group",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu group lưu trữ thuộc tính nghiệp vụ của vote_proposals"
            },
            {
                "name": "vehicle",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu vehicle lưu trữ thuộc tính nghiệp vụ của vote_proposals"
            },
            {
                "name": "created_by_user",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu created_by_user lưu trữ thuộc tính nghiệp vụ của vote_proposals"
            },
            {
                "name": "proposal_type",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu proposal_type lưu trữ thuộc tính nghiệp vụ của vote_proposals"
            },
            {
                "name": "title",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu title lưu trữ thuộc tính nghiệp vụ của vote_proposals"
            },
            {
                "name": "description",
                "type": "TEXT",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Nội dung văn bản ghi chú chi tiết hoặc giải trình nguyên nhân"
            },
            {
                "name": "estimated_amount",
                "type": "DECIMAL(12,2)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu estimated_amount lưu trữ thuộc tính nghiệp vụ của vote_proposals"
            },
            {
                "name": "approved_budget",
                "type": "DECIMAL(12,2)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu approved_budget lưu trữ thuộc tính nghiệp vụ của vote_proposals"
            },
            {
                "name": "voting_starts_at",
                "type": "DATETIME",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu voting_starts_at lưu trữ thuộc tính nghiệp vụ của vote_proposals"
            },
            {
                "name": "voting_ends_at",
                "type": "DATETIME",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu voting_ends_at lưu trữ thuộc tính nghiệp vụ của vote_proposals"
            },
            {
                "name": "finalized_at",
                "type": "DATETIME",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu finalized_at lưu trữ thuộc tính nghiệp vụ của vote_proposals"
            },
            {
                "name": "execution_started_at",
                "type": "DATETIME",
                "pk": "NO",
                "fk": "NO",
                "nullable": "NO",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu execution_started_at lưu trữ thuộc tính nghiệp vụ của vote_proposals"
            },
            {
                "name": "execution_completed_at",
                "type": "DATETIME",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu execution_completed_at lưu trữ thuộc tính nghiệp vụ của vote_proposals"
            },
            {
                "name": "executed_by_staff",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu executed_by_staff lưu trữ thuộc tính nghiệp vụ của vote_proposals"
            },
            {
                "name": "actual_cost",
                "type": "DECIMAL(14,2)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Tổng chi phí phát sinh thực tế bằng tiền đồng (VND) sau khi thanh quyết toán"
            },
            {
                "name": "related_maintenance_request",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu related_maintenance_request lưu trữ thuộc tính nghiệp vụ của vote_proposals"
            },
            {
                "name": "related_expense",
                "type": "VARCHAR(255)",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Trường dữ liệu related_expense lưu trữ thuộc tính nghiệp vụ của vote_proposals"
            },
            {
                "name": "created_at",
                "type": "DATETIME",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Thời điểm tạo bản ghi lần đầu trong hệ thống (UTC ISO 8601 Timestamp)"
            },
            {
                "name": "updated_at",
                "type": "DATETIME",
                "pk": "NO",
                "fk": "NO",
                "nullable": "YES",
                "default": "NULL",
                "unique": "NO",
                "desc": "Thời điểm cập nhật bản ghi gần nhất trong hệ thống (UTC Timestamp)"
            },
        ]
    },
}

def get_all_tables():
    return TABLES
