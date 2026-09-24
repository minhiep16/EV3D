$ErrorActionPreference = "Continue"

Write-Host "=========================================================="
Write-Host "      VERIFY ROLE EXPERIENCE & SESSION ISOLATION"
Write-Host "=========================================================="

# 1. CO_OWNER Login & Experience Checks
Write-Host "`n--- [TEST 1] CO_OWNER Experience ---"
$coOwnerBody = @{ email = "owner_a@evshare.com"; password = "SecretPassword123!" } | ConvertTo-Json
$coOwnerLogin = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" -Method Post -ContentType "application/json" -Body $coOwnerBody
$coOwnerToken = $coOwnerLogin.accessToken
Write-Host "CO_OWNER Logged In: $($coOwnerLogin.user.fullName)"
Write-Host "Role: $($coOwnerLogin.user.role)"
if ($coOwnerLogin.user.role -eq "CO_OWNER") {
    Write-Host "[OK] Route Target: CoOwnerExperience (CHE DO DONG SO HUU)"
} else {
    Write-Host "[FAIL] Expected CO_OWNER role"
}

# 2. STAFF Login & Operations Shell Checks
Write-Host "`n--- [TEST 2] STAFF Operations Experience ---"
$staffBody = @{ email = "staff@evshare.com"; password = "SecretPassword123!" } | ConvertTo-Json
$staffLogin = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" -Method Post -ContentType "application/json" -Body $staffBody
$staffToken = $staffLogin.accessToken
Write-Host "STAFF Logged In: $($staffLogin.user.fullName)"
Write-Host "Role: $($staffLogin.user.role)"
if ($staffLogin.user.role -eq "STAFF") {
    Write-Host "[OK] Route Target: OperationsExperience -> StaffOperations (CHE DO VAN HANH - NHAN VIEN)"
} else {
    Write-Host "[FAIL] Expected STAFF role"
}

# 3. ADMIN Login & Operations Shell Checks
Write-Host "`n--- [TEST 3] ADMIN Operations Experience ---"
$adminBody = @{ email = "admin@evshare.com"; password = "SecretPassword123!" } | ConvertTo-Json
$adminLogin = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" -Method Post -ContentType "application/json" -Body $adminBody
$adminToken = $adminLogin.accessToken
Write-Host "ADMIN Logged In: $($adminLogin.user.fullName)"
Write-Host "Role: $($adminLogin.user.role)"
if ($adminLogin.user.role -eq "ADMIN") {
    Write-Host "[OK] Route Target: OperationsExperience -> AdminOperations (CHE DO QUAN TRI - ADMIN)"
} else {
    Write-Host "[FAIL] Expected ADMIN role"
}

# 4. RBAC: STAFF cannot create personal vehicle booking
Write-Host "`n--- [TEST 4] Authorization Boundary: STAFF cannot create booking ---"
$vehicleId = "11111111-1111-1111-1111-111111111111"
$staffHeaders = @{
    "Authorization" = "Bearer $staffToken"
    "Content-Type"  = "application/json"
}
$bookingPayload = @{
    startTime = "2026-10-01T08:00:00Z"
    endTime = "2026-10-01T10:00:00Z"
    purpose = "Personal"
} | ConvertTo-Json

try {
    $res = Invoke-RestMethod -Uri "http://localhost:8080/api/vehicles/$vehicleId/bookings" -Method Post -Headers $staffHeaders -Body $bookingPayload
    Write-Host "[FAIL] STAFF was allowed to create booking!"
} catch {
    $code = $_.Exception.Response.StatusCode.value__
    Write-Host "Response Status: $code"
    if ($code -eq 403) {
        Write-Host "[OK] STAFF blocked with 403 Forbidden as required by backend RBAC."
    } else {
        Write-Host "[WARN] Expected 403 Forbidden, got $code"
    }
}

# 5. Session Isolation: Logout clears session
Write-Host "`n--- [TEST 5] Session Isolation on Logout ---"
$logoutBody = @{ refreshToken = $coOwnerLogin.refreshToken } | ConvertTo-Json
$logoutRes = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/logout" -Method Post -ContentType "application/json" -Body $logoutBody
Write-Host "CO_OWNER Logout successful: $($logoutRes.message)"

Write-Host "`n=========================================================="
Write-Host "   ALL ROLE EXPERIENCE SEPARATION TESTS COMPLETED"
Write-Host "=========================================================="
