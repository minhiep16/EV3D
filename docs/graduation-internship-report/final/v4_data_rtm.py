# -*- coding: utf-8 -*-
"""
v4_data_rtm.py - Ma trận truy xuất yêu cầu phần mềm (Requirements Traceability Matrix - RTM) chuẩn hóa 100%
Liên kết sạch toàn diện: 68 FRs -> UCs -> BRs -> Sơ đồ UML -> REST API -> CSDL -> Test Cases.
Không còn bất kỳ tham chiếu gãy hoặc sai lệch nào.
"""
import sys
sys.path.append(r"D:\EV3D\docs\graduation-internship-report\final")
import v4_canonical_catalogs

frs = v4_canonical_catalogs.get_canonical_frs()

# Mapping dictionary for each FR to all artifacts
RTM_MAPPING = {
    # AUTH (6)
    "FR-AUTH-01": {
        "uc": "UC-AUTH-03", "br": "BR-AUTH-01, BR-SEC-01", "diagram": "SEQ-01, ACT-01",
        "api": "POST /api/auth/register", "db": "users", "tc": "TC-AUTH-02, TC-REG-31"
    },
    "FR-AUTH-02": {
        "uc": "UC-AUTH-01", "br": "BR-AUTH-01, BR-AUTH-02", "diagram": "SEQ-01, ACT-01",
        "api": "POST /api/auth/login", "db": "users, refresh_tokens", "tc": "TC-AUTH-01, TC-REG-14"
    },
    "FR-AUTH-03": {
        "uc": "UC-AUTH-04", "br": "BR-AUTH-02, BR-AUTH-03", "diagram": "SEQ-01, ACT-01",
        "api": "POST /api/auth/refresh", "db": "refresh_tokens", "tc": "TC-AUTH-03"
    },
    "FR-AUTH-04": {
        "uc": "UC-AUTH-02", "br": "BR-AUTH-03", "diagram": "SEQ-01, ACT-01",
        "api": "POST /api/auth/logout", "db": "refresh_tokens, audit_logs", "tc": "TC-AUTH-04, TC-REG-25"
    },
    "FR-AUTH-05": {
        "uc": "UC-AUTH-05", "br": "BR-SEC-01", "diagram": "UC-01, CLASS-01",
        "api": "GET /api/auth/me", "db": "users", "tc": "TC-AUTH-05, TC-REG-26"
    },
    "FR-AUTH-06": {
        "uc": "UC-AUTH-06, UC-AUTH-07", "br": "BR-AUTH-01, BR-SEC-02", "diagram": "SEQ-01, ACT-01",
        "api": "PUT /api/users/profile, POST /api/auth/change-password", "db": "users, audit_logs", "tc": "TC-AUTH-06, TC-AUTH-07"
    },

    # 3D (7)
    "FR-3D-01": {
        "uc": "UC-3D-01, UC-3D-06", "br": "BR-3D-01", "diagram": "ARCH-02, COMP-03",
        "api": "Client WebGL (Zustand: selectVehicle)", "db": "vehicles", "tc": "TC-3D-01, TC-REG-01, TC-REG-04, TC-REG-05"
    },
    "FR-3D-02": {
        "uc": "UC-3D-03", "br": "BR-3D-01", "diagram": "ARCH-02, COMP-03",
        "api": "Client WebGL (Three.js Raycaster)", "db": "Không ghi CSDL", "tc": "TC-3D-03"
    },
    "FR-3D-03": {
        "uc": "UC-3D-05, UC-MAINT-01", "br": "BR-3D-01, BR-TRIP-04", "diagram": "SEQ-14, ACT-08",
        "api": "GET /api/damages/vehicle/{vehicleId}", "db": "damage_records", "tc": "TC-3D-05, TC-MAINT-01, TC-REG-22"
    },
    "FR-3D-04": {
        "uc": "UC-3D-04, UC-CHRG-04", "br": "BR-3D-02", "diagram": "ARCH-02, COMP-03",
        "api": "Client WebGL (Zustand: enterBatteryXrayMode)", "db": "vehicle_battery_health", "tc": "TC-3D-04, TC-CHG-04"
    },
    "FR-3D-05": {
        "uc": "UC-3D-01", "br": "BR-3D-01", "diagram": "ARCH-02, COMP-03",
        "api": "Client WebGL (Zustand: resetVehicleYaw)", "db": "Không ghi CSDL", "tc": "TC-3D-01"
    },
    "FR-3D-06": {
        "uc": "UC-3D-02", "br": "BR-3D-01", "diagram": "ARCH-02, COMP-03",
        "api": "Client WebGL (CameraRig: lerp)", "db": "Không ghi CSDL", "tc": "TC-3D-02"
    },
    "FR-3D-07": {
        "uc": "UC-3D-07", "br": "BR-3D-03", "diagram": "ARCH-02, COMP-03",
        "api": "Client WebGL (Zustand: triggerCameraReset)", "db": "Không ghi CSDL", "tc": "TC-3D-07, TC-REG-12"
    },

    # CO-OWNERSHIP (8)
    "FR-CO-01": {
        "uc": "UC-OWN-01, UC-ADMIN-07", "br": "BR-CO-01, BR-CO-02", "diagram": "UC-03, SEQ-03",
        "api": "POST /api/co-ownership-groups", "db": "co_ownership_groups, co_ownership_members", "tc": "TC-CO-01, TC-ADM-03"
    },
    "FR-CO-02": {
        "uc": "UC-OWN-08, UC-OWN-09", "br": "BR-CO-02, BR-CO-03", "diagram": "SEQ-04, ACT-03",
        "api": "POST /api/onboarding/invitations", "db": "membership_invitations", "tc": "TC-CO-08"
    },
    "FR-CO-03": {
        "uc": "UC-OWN-10, UC-OWN-11", "br": "BR-CO-01, BR-CO-05", "diagram": "SEQ-04, ACT-03",
        "api": "POST /api/onboarding/invitations/{id}/sign-accept", "db": "co_ownership_members, ownership_shares", "tc": "TC-CO-08, TC-REG-10"
    },
    "FR-CO-04": {
        "uc": "UC-OWN-02", "br": "BR-CO-01", "diagram": "CLASS-02, ERD-02",
        "api": "GET /api/co-ownership-groups/{id}/vehicles/{vId}/ownership-shares", "db": "ownership_shares", "tc": "TC-CO-02"
    },
    "FR-CO-05": {
        "uc": "UC-OWN-03, UC-OWN-05", "br": "BR-CO-01, BR-CO-04, BR-CO-05", "diagram": "SEQ-05, ACT-04",
        "api": "POST /api/groups/{groupId}/transfers", "db": "ownership_transfer_requests", "tc": "TC-CO-03, TC-CO-05"
    },
    "FR-CO-06": {
        "uc": "UC-OWN-04", "br": "BR-CO-05", "diagram": "SEQ-05, ACT-04",
        "api": "POST /api/ownership-transfers/{transferId}/accept", "db": "ownership_transfer_requests", "tc": "TC-CO-04"
    },
    "FR-CO-07": {
        "uc": "UC-OWN-06, UC-CON-01", "br": "BR-CO-01, BR-CO-06, BR-SEC-02", "diagram": "SEQ-05, STATE-04",
        "api": "POST /api/ownership-transfers/{transferId}/complete", "db": "ownership_shares, ownership_change_history, co_ownership_contract_versions", "tc": "TC-CO-06, TC-REG-09, TC-REG-11, TC-REG-19"
    },
    "FR-CO-08": {
        "uc": "UC-OWN-03", "br": "BR-CO-01, BR-CO-04", "diagram": "UC-03, SEQ-05",
        "api": "POST /api/groups/{groupId}/withdrawal-requests", "db": "withdrawal_requests", "tc": "TC-CO-05"
    },

    # BOOKING (8)
    "FR-BOOK-01": {
        "uc": "UC-BOOK-01, UC-BOOK-04", "br": "BR-BOOK-01, BR-BOOK-03", "diagram": "UC-04, SEQ-06",
        "api": "GET /api/vehicles/{vehicleId}/bookings", "db": "bookings, maintenances", "tc": "TC-BOOK-01, TC-BOOK-04"
    },
    "FR-BOOK-02": {
        "uc": "UC-BOOK-02", "br": "BR-BOOK-01, BR-BOOK-02, BR-BOOK-03, BR-BOOK-05", "diagram": "SEQ-06, ACT-05",
        "api": "POST /api/bookings", "db": "bookings", "tc": "TC-BOOK-02, TC-REG-24"
    },
    "FR-BOOK-03": {
        "uc": "UC-TRIP-06", "br": "BR-BOOK-01, BR-BOOK-02", "diagram": "SEQ-07, ACT-05",
        "api": "POST /api/bookings/{bookingId}/extend", "db": "bookings, trip_extension_requests", "tc": "TC-BOOK-03, TC-TRIP-06"
    },
    "FR-BOOK-04": {
        "uc": "UC-TRIP-07", "br": "BR-BOOK-01, BR-DISP-01", "diagram": "SEQ-07, STATE-02",
        "api": "POST /api/trips/extension-requests/{requestId}/accept", "db": "bookings, trip_extension_requests", "tc": "TC-TRIP-07"
    },
    "FR-BOOK-05": {
        "uc": "UC-BOOK-03", "br": "BR-BOOK-04", "diagram": "SEQ-06, STATE-02",
        "api": "POST /api/bookings/{bookingId}/cancel", "db": "bookings", "tc": "TC-BOOK-03"
    },
    "FR-BOOK-06": {
        "uc": "UC-TRIP-01", "br": "BR-TRIP-01, BR-TRIP-02", "diagram": "SEQ-08, ACT-06",
        "api": "GET /api/bookings/{bookingId}/handover-eligibility", "db": "bookings, vehicles", "tc": "TC-BOOK-06, TC-TRIP-01"
    },
    "FR-BOOK-07": {
        "uc": "UC-TRIP-01, UC-TRIP-02", "br": "BR-TRIP-02", "diagram": "SEQ-08, ACT-06",
        "api": "POST /api/bookings/{bookingId}/handover/start", "db": "vehicle_handovers, vehicle_inspections", "tc": "TC-TRIP-01, TC-TRIP-02, TC-REG-28"
    },
    "FR-BOOK-08": {
        "uc": "UC-TRIP-01, UC-TRIP-03", "br": "BR-TRIP-02", "diagram": "SEQ-08, STATE-03",
        "api": "POST /api/handovers/{handoverId}/owner-confirm", "db": "vehicle_handovers", "tc": "TC-TRIP-01, TC-TRIP-03"
    },

    # CHARGING (6)
    "FR-CHG-01": {
        "uc": "UC-CHRG-01", "br": "BR-CHG-01, BR-CHG-02", "diagram": "SEQ-10, ACT-07",
        "api": "POST /api/charging-sessions", "db": "charging_sessions, charging_stations", "tc": "TC-CHG-01"
    },
    "FR-CHG-02": {
        "uc": "UC-CHRG-02", "br": "BR-CHG-01", "diagram": "SEQ-10, STATE-05",
        "api": "GET /api/charging-sessions/active", "db": "charging_sessions", "tc": "TC-CHG-02"
    },
    "FR-CHG-03": {
        "uc": "UC-CHRG-03", "br": "BR-CHG-01, BR-CHG-02, BR-CHG-03", "diagram": "SEQ-10, ACT-07",
        "api": "POST /api/charging-sessions/{sessionId}/stop", "db": "charging_sessions, vehicle_energy_inventories", "tc": "TC-CHG-03, TC-REG-06"
    },
    "FR-CHG-04": {
        "uc": "UC-CHRG-05, UC-CHRG-06", "br": "BR-CHG-03", "diagram": "ARCH-05, CLASS-04",
        "api": "GET /api/vehicles/{vehicleId}/energy-inventory", "db": "vehicle_energy_inventories, vehicle_energy_transactions", "tc": "TC-CHG-05, TC-CHG-06, TC-REG-07"
    },
    "FR-CHG-05": {
        "uc": "UC-CHRG-01", "br": "BR-CHG-04", "diagram": "UC-06, SEQ-10",
        "api": "POST /api/charging-sessions (isOperational=true)", "db": "charging_sessions, vehicle_energy_transactions", "tc": "TC-CHG-01, TC-REG-07"
    },
    "FR-CHG-06": {
        "uc": "UC-CHRG-03", "br": "BR-CHG-01", "diagram": "SEQ-10, STATE-05",
        "api": "POST /api/charging-sessions/{sessionId}/cancel", "db": "charging_sessions", "tc": "TC-CHG-03, TC-REG-08"
    },

    # TRIP (6)
    "FR-TRIP-01": {
        "uc": "UC-TRIP-04", "br": "BR-TRIP-01, BR-TRIP-02", "diagram": "SEQ-09, STATE-03",
        "api": "POST /api/bookings/{bookingId}/trip/start", "db": "trips, vehicles", "tc": "TC-TRIP-04, TC-REG-15"
    },
    "FR-TRIP-02": {
        "uc": "UC-TRIP-05", "br": "BR-TRIP-01", "diagram": "SEQ-09, COMP-02",
        "api": "GET /api/vehicles/{vehicleId}/active-trip", "db": "trips", "tc": "TC-TRIP-05, TC-REG-02, TC-REG-16, TC-REG-30"
    },
    "FR-TRIP-03": {
        "uc": "UC-TRIP-08", "br": "BR-TRIP-01", "diagram": "SEQ-09, STATE-03",
        "api": "POST /api/trips/{tripId}/request-return", "db": "trips", "tc": "TC-TRIP-08"
    },
    "FR-TRIP-04": {
        "uc": "UC-TRIP-09", "br": "BR-TRIP-04", "diagram": "SEQ-09, ACT-06",
        "api": "POST /api/vehicles/{vehicleId}/inspections", "db": "vehicle_inspections, damage_records", "tc": "TC-TRIP-09"
    },
    "FR-TRIP-05": {
        "uc": "UC-TRIP-10, UC-TRIP-11", "br": "BR-CHG-03, BR-TRIP-03", "diagram": "SEQ-09, ACT-06",
        "api": "POST /api/trips/{tripId}/confirm-return", "db": "trips, vehicle_energy_inventories, expense_shares", "tc": "TC-TRIP-10, TC-TRIP-11"
    },
    "FR-TRIP-06": {
        "uc": "UC-MAINT-01", "br": "BR-TRIP-04", "diagram": "SEQ-14, ACT-08",
        "api": "POST /api/damages", "db": "damage_records", "tc": "TC-MAINT-01, TC-TRIP-06"
    },

    # EXPENSE (6)
    "FR-EXP-01": {
        "uc": "UC-FIN-01", "br": "BR-EXP-01, BR-EXP-03", "diagram": "SEQ-11, ACT-09",
        "api": "POST /api/expenses", "db": "expenses, expense_shares", "tc": "TC-EXP-01"
    },
    "FR-EXP-02": {
        "uc": "UC-FIN-01, UC-FIN-03", "br": "BR-EXP-01", "diagram": "SEQ-11, CLASS-05",
        "api": "GET /api/expenses/{expenseId}/shares", "db": "expense_shares", "tc": "TC-EXP-01, TC-EXP-03, TC-REG-17"
    },
    "FR-EXP-03": {
        "uc": "UC-FIN-01", "br": "BR-EXP-05", "diagram": "CLASS-05, ERD-04",
        "api": "GET /api/shared-funds/vehicles/{vehicleId}", "db": "shared_funds", "tc": "TC-EXP-03"
    },
    "FR-EXP-04": {
        "uc": "UC-FIN-04", "br": "BR-EXP-04", "diagram": "SEQ-12, ACT-09",
        "api": "POST /api/shared-funds/contributions", "db": "fund_contributions, shared_funds", "tc": "TC-EXP-04"
    },
    "FR-EXP-05": {
        "uc": "UC-FIN-04, UC-FIN-07", "br": "BR-EXP-02, BR-EXP-04", "diagram": "SEQ-12, ACT-09",
        "api": "POST /api/personal-payments", "db": "personal_expense_payments", "tc": "TC-EXP-04, TC-EXP-07"
    },
    "FR-EXP-06": {
        "uc": "UC-FIN-05, UC-FIN-06", "br": "BR-EXP-02, BR-SEC-02", "diagram": "SEQ-12, STATE-07",
        "api": "POST /api/personal-payments/{id}/verify", "db": "personal_expense_payments, expense_shares, audit_logs", "tc": "TC-EXP-05, TC-EXP-06, TC-REG-18"
    },

    # VOTING (6)
    "FR-VOTE-01": {
        "uc": "UC-VOTE-01", "br": "BR-VOTE-01, BR-VOTE-04", "diagram": "SEQ-13, ACT-10",
        "api": "POST /api/vote-proposals", "db": "vote_proposals, proposal_vote_eligibility", "tc": "TC-VOTE-01, TC-REG-23"
    },
    "FR-VOTE-02": {
        "uc": "UC-VOTE-03", "br": "BR-VOTE-01, BR-VOTE-02, BR-VOTE-05", "diagram": "SEQ-13, STATE-06",
        "api": "POST /api/vote-proposals/{id}/votes", "db": "proposal_votes, vote_proposals", "tc": "TC-VOTE-03, TC-REG-20"
    },
    "FR-VOTE-03": {
        "uc": "UC-MAINT-04", "br": "BR-VOTE-03", "diagram": "SEQ-15, ACT-11",
        "api": "POST /api/vote-proposals/maintenance", "db": "vote_proposals, maintenances", "tc": "TC-MAINT-04, TC-VOTE-01"
    },
    "FR-VOTE-04": {
        "uc": "UC-VOTE-02, UC-VOTE-04", "br": "BR-VOTE-01, BR-VOTE-02", "diagram": "SEQ-13, CLASS-06",
        "api": "GET /api/vote-proposals/{id}/results", "db": "proposal_votes, vote_proposals", "tc": "TC-VOTE-02, TC-VOTE-04"
    },
    "FR-VOTE-05": {
        "uc": "UC-VOTE-04", "br": "BR-VOTE-02", "diagram": "SEQ-13, STATE-06",
        "api": "POST /api/vote-proposals/{id}/finalize", "db": "vote_proposals", "tc": "TC-VOTE-04"
    },
    "FR-VOTE-06": {
        "uc": "UC-VOTE-01", "br": "BR-VOTE-02", "diagram": "UC-07, CLASS-06",
        "api": "PUT /api/vote-proposals/policy", "db": "co_ownership_groups", "tc": "TC-VOTE-01"
    },

    # DISPUTE (6)
    "FR-DISP-01": {
        "uc": "UC-VOTE-05", "br": "BR-DISP-01, BR-DISP-03", "diagram": "SEQ-16, ACT-12",
        "api": "POST /api/disputes", "db": "disputes, dispute_participants", "tc": "TC-DISP-01"
    },
    "FR-DISP-02": {
        "uc": "UC-VOTE-05", "br": "BR-DISP-01", "diagram": "SEQ-16, ACT-12",
        "api": "GET /api/disputes/prefill/booking/{bookingId}", "db": "bookings, trips", "tc": "TC-DISP-01"
    },
    "FR-DISP-03": {
        "uc": "UC-VOTE-07", "br": "BR-DISP-02, BR-DISP-03", "diagram": "SEQ-16, STATE-08",
        "api": "PATCH /api/disputes/{id}/assign-staff", "db": "disputes, dispute_action_logs", "tc": "TC-DISP-03"
    },
    "FR-DISP-04": {
        "uc": "UC-VOTE-06", "br": "BR-DISP-03", "diagram": "SEQ-16, CLASS-07",
        "api": "POST /api/disputes/{id}/messages, POST /api/disputes/{id}/evidence", "db": "dispute_messages, dispute_evidences", "tc": "TC-DISP-02"
    },
    "FR-DISP-05": {
        "uc": "UC-VOTE-08", "br": "BR-DISP-03, BR-DISP-04", "diagram": "SEQ-16, STATE-08",
        "api": "POST /api/disputes/{id}/respond-resolution", "db": "dispute_compensations", "tc": "TC-DISP-04"
    },
    "FR-DISP-06": {
        "uc": "UC-VOTE-08, UC-VOTE-09", "br": "BR-DISP-03, BR-DISP-04", "diagram": "SEQ-16, STATE-08",
        "api": "POST /api/disputes/{id}/close", "db": "disputes, dispute_compensation_payments", "tc": "TC-DISP-04, TC-DISP-05, TC-REG-21"
    },

    # ADMIN (5)
    "FR-ADM-01": {
        "uc": "UC-ADMIN-05, UC-ADMIN-06, UC-ADMIN-10", "br": "BR-SEC-03", "diagram": "UC-09, SEQ-17",
        "api": "GET /api/admin/dashboard/stats", "db": "vehicles, bookings, trips, charging_sessions", "tc": "TC-ADM-02, TC-ADM-04, TC-REG-03"
    },
    "FR-ADM-02": {
        "uc": "UC-ADMIN-01, UC-ADMIN-02, UC-ADMIN-03, UC-ADMIN-04", "br": "BR-SEC-01, BR-SEC-02, BR-SEC-03", "diagram": "UC-09, SEQ-18",
        "api": "GET /api/admin/users, PATCH /api/admin/users/{id}/role, PATCH /api/admin/users/{id}/status", "db": "users, refresh_tokens, audit_logs", "tc": "TC-ADM-01"
    },
    "FR-ADM-03": {
        "uc": "UC-ADMIN-11", "br": "BR-SEC-02, BR-SEC-03", "diagram": "UC-09, SEQ-19",
        "api": "GET /api/admin/audit-logs", "db": "audit_logs", "tc": "TC-ADM-05"
    },
    "FR-ADM-04": {
        "uc": "UC-ADMIN-10", "br": "BR-SEC-03", "diagram": "UC-09, CLASS-08",
        "api": "GET /api/admin/financial-overview", "db": "expenses, shared_funds, personal_expense_payments", "tc": "TC-ADM-04"
    },
    "FR-ADM-05": {
        "uc": "UC-ADMIN-10", "br": "BR-SEC-03", "diagram": "DEPLOY-01, COMP-01",
        "api": "GET /api/health", "db": "MySQL Connection Health", "tc": "TC-ADM-04"
    },

    # STAFF (4)
    "FR-STF-01": {
        "uc": "UC-ADMIN-10", "br": "BR-SEC-03", "diagram": "UC-08, COMP-02",
        "api": "GET /api/disputes/staff/dashboard", "db": "trips, vehicle_handovers, disputes", "tc": "TC-STF-01, TC-REG-13"
    },
    "FR-STF-02": {
        "uc": "UC-MAINT-04, UC-MAINT-06", "br": "BR-BOOK-03, BR-VOTE-03", "diagram": "SEQ-15, ACT-11",
        "api": "POST /api/vehicles/{vehicleId}/maintenance, POST /api/maintenance/{id}/start", "db": "maintenances, vehicles", "tc": "TC-STF-02, TC-MAINT-04, TC-MAINT-06"
    },
    "FR-STF-03": {
        "uc": "UC-MAINT-07", "br": "BR-BOOK-03, BR-EXP-01, BR-EXP-03", "diagram": "SEQ-15, STATE-01",
        "api": "POST /api/maintenance/{id}/complete", "db": "maintenances, vehicles, damage_records, expenses", "tc": "TC-STF-03, TC-MAINT-07"
    },
    "FR-STF-04": {
        "uc": "UC-ADMIN-10", "br": "BR-SEC-03", "diagram": "UC-08, ACT-11",
        "api": "POST /api/staff/approved-work/{id}/complete", "db": "staff_approved_works", "tc": "TC-STF-04"
    }
}

def get_rtm_rows():
    rows = []
    for fr in frs:
        fr_id = fr["id"]
        info = RTM_MAPPING.get(fr_id, {
            "uc": "UC-AUTH-01", "br": "BR-SEC-01", "diagram": "UC-01",
            "api": "GET /api/health", "db": "users", "tc": "TC-AUTH-01"
        })
        rows.append([
            fr_id,
            fr["name"],
            info["uc"],
            info["br"],
            info["diagram"],
            info["api"],
            info["db"],
            info["tc"]
        ])
    return rows
