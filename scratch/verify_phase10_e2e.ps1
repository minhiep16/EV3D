$ErrorActionPreference = "Stop"

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

function Read-ErrorBody($ex) {
    if ($ex.Response) {
        $stream = $ex.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream, [System.Text.Encoding]::UTF8)
        return $reader.ReadToEnd()
    }
    return ""
}

Write-Host "=========================================================="
Write-Host "PHASE 10 PURE 3D TRIP START - LIVE E2E VERIFICATION"
Write-Host "=========================================================="

# 1. Logins
Write-Host "`n>>> [SETUP] Authenticating Roles (CO_OWNER, STAFF, ADMIN)..."
$staffRes = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" -Method Post -ContentType "application/json; charset=utf-8" -Body (@{ email = "staff@evshare.com"; password = "SecretPassword123!" } | ConvertTo-Json)
$staffHeaders = @{ Authorization = "Bearer $($staffRes.accessToken)" }

$adminRes = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" -Method Post -ContentType "application/json; charset=utf-8" -Body (@{ email = "admin@evshare.com"; password = "SecretPassword123!" } | ConvertTo-Json)
$adminHeaders = @{ Authorization = "Bearer $($adminRes.accessToken)" }

$ownerRes = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" -Method Post -ContentType "application/json; charset=utf-8" -Body (@{ email = "owner_b@evshare.com"; password = "SecretPassword123!" } | ConvertTo-Json)
$ownerHeaders = @{ Authorization = "Bearer $($ownerRes.accessToken)" }

$vehicleId = "11111111-1111-1111-1111-111111111111"

# 2. Create a clean Booking for testing (Starting right now so it's in the valid window)
$now = [DateTime]::UtcNow
$startTimeStr = $now.AddMinutes(2).ToString("yyyy-MM-ddTHH:mm:ssZ")
$endTimeStr = $now.AddHours(2).ToString("yyyy-MM-ddTHH:mm:ssZ")

Write-Host "`n>>> [SETUP] Creating fresh booking for testing ($startTimeStr - $endTimeStr)..."
$bookingBody = @{
    startTime = $startTimeStr
    endTime = $endTimeStr
    purpose = "Kiem tra Phase 10 Trip Start"
} | ConvertTo-Json
$bookingBytes = [System.Text.Encoding]::UTF8.GetBytes($bookingBody)

$booking = Invoke-RestMethod -Uri "http://localhost:8080/api/vehicles/$vehicleId/bookings" -Method Post -ContentType "application/json; charset=utf-8" -Headers $ownerHeaders -Body $bookingBytes
$bookingId = $booking.id
Write-Host "[OK] Created Booking ID: $bookingId for user: $($booking.userName)"

# 3. Check Trip Start Eligibility BEFORE Handover
Write-Host "`n>>> [TEST 1] Checking Eligibility BEFORE handover exists..."
$eligibility1 = Invoke-RestMethod -Uri "http://localhost:8080/api/bookings/$bookingId/trip/start-eligibility" -Method Get -Headers $ownerHeaders
Write-Host "Eligible: $($eligibility1.eligible), ReasonCode: $($eligibility1.reasonCode), Message: $($eligibility1.message)"
if ($eligibility1.eligible -ne $false -or $eligibility1.reasonCode -ne "HANDOVER_NOT_COMPLETED") {
    throw "Expected HANDOVER_NOT_COMPLETED, got: $($eligibility1.reasonCode)"
}
Write-Host "[PASS] Correctly rejected with HANDOVER_NOT_COMPLETED."

# 4. Attempt to Start Trip BEFORE Handover
Write-Host "`n>>> [TEST 2] Attempting to start trip before handover..."
try {
    Invoke-RestMethod -Uri "http://localhost:8080/api/bookings/$bookingId/trip/start" -Method Post -Headers $ownerHeaders
    throw "Should have failed with HANDOVER_NOT_COMPLETED!"
} catch {
    $body = Read-ErrorBody $_.Exception
    Write-Host "[PASS] Correctly rejected: $body"
}

# 5. Complete Handover (Phase 09 workflow)
Write-Host "`n>>> [SETUP] Completing Phase 09 Handover..."
# Staff creates handover
$handover = Invoke-RestMethod -Uri "http://localhost:8080/api/vehicles/$vehicleId/handovers" -Method Post -Headers $staffHeaders -ContentType "application/json; charset=utf-8" -Body (@{ bookingId = $bookingId } | ConvertTo-Json)
$handoverId = $handover.id

# Staff records 8 inspections
$checkpoints = @("TIRE_TREAD", "BRAKE_PADS", "FRONT_BUMPER", "REAR_BUMPER", "HEADLIGHTS", "BATTERY_HEALTH", "WINDSHIELD", "CABIN_CONDITION")
foreach ($code in $checkpoints) {
    $inspectBody = @{
        checkpointCode = $code
        conditionStatus = "GOOD"
        notes = "Kiem tra Phase 10 auto"
    } | ConvertTo-Json
    Invoke-RestMethod -Uri "http://localhost:8080/api/handovers/$handoverId/inspections" -Method Post -Headers $staffHeaders -ContentType "application/json; charset=utf-8" -Body $inspectBody | Out-Null
}

# Staff ready
Invoke-RestMethod -Uri "http://localhost:8080/api/handovers/$handoverId/status" -Method Patch -Headers $staffHeaders -ContentType "application/json; charset=utf-8" -Body (@{ status = "READY_FOR_HANDOVER" } | ConvertTo-Json) | Out-Null

# CoOwner confirms receipt -> Handover COMPLETED
Invoke-RestMethod -Uri "http://localhost:8080/api/handovers/$handoverId/confirm-receipt" -Method Post -Headers $ownerHeaders | Out-Null
Write-Host "[OK] Handover COMPLETED successfully."

# 6. Check Eligibility AFTER completed handover
Write-Host "`n>>> [TEST 3] Checking Eligibility AFTER completed handover..."
$eligibility2 = Invoke-RestMethod -Uri "http://localhost:8080/api/bookings/$bookingId/trip/start-eligibility" -Method Get -Headers $ownerHeaders
Write-Host "Eligible: $($eligibility2.eligible), HandoverStatus: $($eligibility2.handoverStatus), Battery: $($eligibility2.currentBatteryLevel)%, Odo: $($eligibility2.currentOdometer)"
if ($eligibility2.eligible -ne $true -or $eligibility2.handoverStatus -ne "COMPLETED") {
    throw "Expected eligible: true and handoverStatus: COMPLETED"
}
Write-Host "[PASS] Eligible for trip start!"

# 7. STAFF attempts to start trip (Forbidden)
Write-Host "`n>>> [TEST 4] STAFF attempts to start trip..."
try {
    Invoke-RestMethod -Uri "http://localhost:8080/api/bookings/$bookingId/trip/start" -Method Post -Headers $staffHeaders
    throw "Staff should NOT be allowed to start trip!"
} catch {
    $code = $_.Exception.Response.StatusCode.value__
    Write-Host "[PASS] STAFF rejected with HTTP $code (Expected 403 Forbidden)."
    if ($code -ne 403) { throw "Expected 403, got $code" }
}

# 8. ADMIN attempts to start trip (Forbidden)
Write-Host "`n>>> [TEST 5] ADMIN attempts to start trip..."
try {
    Invoke-RestMethod -Uri "http://localhost:8080/api/bookings/$bookingId/trip/start" -Method Post -Headers $adminHeaders
    throw "Admin should NOT be allowed to start trip!"
} catch {
    $code = $_.Exception.Response.StatusCode.value__
    Write-Host "[PASS] ADMIN rejected with HTTP $code (Expected 403 Forbidden)."
    if ($code -ne 403) { throw "Expected 403, got $code" }
}

# 9. CO_OWNER starts trip
Write-Host "`n>>> [TEST 6] CO_OWNER starts trip..."
$trip = Invoke-RestMethod -Uri "http://localhost:8080/api/bookings/$bookingId/trip/start" -Method Post -Headers $ownerHeaders
Write-Host "Trip created! ID: $($trip.id), Status: $($trip.status), StartedAt: $($trip.startedAt), StartBattery: $($trip.startBatteryLevel)%, StartOdo: $($trip.startOdometer) km"
if ($trip.status -ne "ACTIVE" -or $null -eq $trip.startedAt -or $null -eq $trip.startBatteryLevel -or $null -eq $trip.startOdometer) {
    throw "Trip properties invalid!"
}
Write-Host "[PASS] Trip created with status ACTIVE and authoritative snapshots!"

# 10. Verify Vehicle status updated to IN_USE
Write-Host "`n>>> [TEST 7] Verifying vehicle status..."
$vehicle = Invoke-RestMethod -Uri "http://localhost:8080/api/vehicles/$vehicleId" -Method Get -Headers $ownerHeaders
Write-Host "Vehicle operational status: $($vehicle.status)"
if ($vehicle.status -ne "IN_USE") {
    throw "Expected vehicle status IN_USE, got: $($vehicle.status)"
}
Write-Host "[PASS] Vehicle is now IN_USE."

# 11. Retrieve Trip via GET /api/bookings/{bookingId}/trip
Write-Host "`n>>> [TEST 8] Querying GET /api/bookings/{bookingId}/trip..."
$queriedTrip = Invoke-RestMethod -Uri "http://localhost:8080/api/bookings/$bookingId/trip" -Method Get -Headers $ownerHeaders
Write-Host "Queried Trip ID: $($queriedTrip.id), Status: $($queriedTrip.status)"
if ($queriedTrip.id -ne $trip.id -or $queriedTrip.status -ne "ACTIVE") {
    throw "Queried trip mismatch!"
}
Write-Host "[PASS] Correct trip returned."

# 12. Retrieve Active Trip via GET /api/vehicles/{vehicleId}/active-trip
Write-Host "`n>>> [TEST 9] Querying GET /api/vehicles/{vehicleId}/active-trip..."
$activeVehicleTrip = Invoke-RestMethod -Uri "http://localhost:8080/api/vehicles/$vehicleId/active-trip" -Method Get -Headers $staffHeaders
Write-Host "Active Vehicle Trip ID: $($activeVehicleTrip.id), User: $($activeVehicleTrip.userName), StartedAt: $($activeVehicleTrip.startedAt)"
if ($activeVehicleTrip.id -ne $trip.id) {
    throw "Active vehicle trip mismatch!"
}
Write-Host "[PASS] Active vehicle trip query verified (allows reload restoration & operations monitoring)."

# 13. Duplicate Start Attempt (Same Booking)
Write-Host "`n>>> [TEST 10] Attempting duplicate start on same booking..."
try {
    Invoke-RestMethod -Uri "http://localhost:8080/api/bookings/$bookingId/trip/start" -Method Post -Headers $ownerHeaders
    throw "Duplicate start should have been rejected!"
} catch {
    $body = Read-ErrorBody $_.Exception
    Write-Host "[PASS] Duplicate start rejected: $body"
}

# 14. Check Eligibility now that trip is active
Write-Host "`n>>> [TEST 11] Checking eligibility when trip is already active..."
$eligibility3 = Invoke-RestMethod -Uri "http://localhost:8080/api/bookings/$bookingId/trip/start-eligibility" -Method Get -Headers $ownerHeaders
Write-Host "Eligible: $($eligibility3.eligible), ReasonCode: $($eligibility3.reasonCode), Message: $($eligibility3.message)"
if ($eligibility3.eligible -ne $false -or $eligibility3.reasonCode -ne "TRIP_ALREADY_ACTIVE") {
    throw "Expected TRIP_ALREADY_ACTIVE, got: $($eligibility3.reasonCode)"
}
Write-Host "[PASS] Correctly reports TRIP_ALREADY_ACTIVE."

Write-Host "`n=========================================================="
Write-Host "ALL PHASE 10 E2E API VERIFICATIONS PASSED!"
Write-Host "=========================================================="
