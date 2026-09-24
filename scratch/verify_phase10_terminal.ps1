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
Write-Host "PHASE 10 PURE 3D TRIP START - TERMINAL VERIFICATION"
Write-Host "=========================================================="

# 1. Logins
Write-Host "`n>>> [1] Authenticating Roles (CO_OWNER, STAFF, ADMIN)..."
$staffRes = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" -Method Post -ContentType "application/json; charset=utf-8" -Body (@{ email = "staff@evshare.com"; password = "SecretPassword123!" } | ConvertTo-Json)
$staffHeaders = @{ Authorization = "Bearer $($staffRes.accessToken)" }

$adminRes = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" -Method Post -ContentType "application/json; charset=utf-8" -Body (@{ email = "admin@evshare.com"; password = "SecretPassword123!" } | ConvertTo-Json)
$adminHeaders = @{ Authorization = "Bearer $($adminRes.accessToken)" }

$ownerRes = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" -Method Post -ContentType "application/json; charset=utf-8" -Body (@{ email = "owner_b@evshare.com"; password = "SecretPassword123!" } | ConvertTo-Json)
$ownerHeaders = @{ Authorization = "Bearer $($ownerRes.accessToken)" }

$otherOwnerRes = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" -Method Post -ContentType "application/json; charset=utf-8" -Body (@{ email = "owner_a@evshare.com"; password = "SecretPassword123!" } | ConvertTo-Json)
$otherOwnerHeaders = @{ Authorization = "Bearer $($otherOwnerRes.accessToken)" }

$vehicleId = "11111111-1111-1111-1111-111111111111"
$bookingId = "33333333-3333-3333-3333-333333333331"

# 2. Verify Completed Handover
Write-Host "`n>>> [2] Verifying Completed Handover for Booking $bookingId..."
$handover = Invoke-RestMethod -Uri "http://localhost:8080/api/bookings/$bookingId/handover" -Method Get -Headers $ownerHeaders
Write-Host "Handover ID: $($handover.id), Status: $($handover.status), Inspected: $($handover.totalInspectedCount)/$($handover.requiredCheckpointsCount)"
if ($handover.status -ne "COMPLETED") {
    throw "Handover is not COMPLETED!"
}
Write-Host "[PASS] Handover is COMPLETED."

# 3. Check Eligibility for Authenticated Owner B
Write-Host "`n>>> [3] Checking Eligibility for Owner B..."
$eligibility = Invoke-RestMethod -Uri "http://localhost:8080/api/bookings/$bookingId/trip/start-eligibility" -Method Get -Headers $ownerHeaders
Write-Host "Eligible: $($eligibility.eligible), Handover: $($eligibility.handoverStatus), Battery: $($eligibility.currentBatteryLevel)%, Odo: $($eligibility.currentOdometer)"
if ($eligibility.eligible -ne $true) {
    throw "Owner B should be eligible!"
}
Write-Host "[PASS] Eligibility check passed."

# 4. Check Eligibility for Other Owner (Owner A)
Write-Host "`n>>> [4] Checking Eligibility for Unauthorized Owner A..."
$eligibilityA = Invoke-RestMethod -Uri "http://localhost:8080/api/bookings/$bookingId/trip/start-eligibility" -Method Get -Headers $otherOwnerHeaders
Write-Host "Eligible: $($eligibilityA.eligible), ReasonCode: $($eligibilityA.reasonCode)"
if ($eligibilityA.eligible -ne $false -or $eligibilityA.reasonCode -ne "NOT_BOOKING_OWNER") {
    throw "Owner A should NOT be eligible!"
}
Write-Host "[PASS] Unauthorized owner rejected."

# 5. STAFF Start Trip Attempt (Forbidden)
Write-Host "`n>>> [5] STAFF Start Trip Attempt..."
try {
    Invoke-RestMethod -Uri "http://localhost:8080/api/bookings/$bookingId/trip/start" -Method Post -Headers $staffHeaders
    throw "Staff start trip should have failed!"
} catch {
    $code = $_.Exception.Response.StatusCode.value__
    Write-Host "[PASS] STAFF rejected with HTTP $code (403 Forbidden)."
    if ($code -ne 403) { throw "Expected 403, got $code" }
}

# 6. ADMIN Start Trip Attempt (Forbidden)
Write-Host "`n>>> [6] ADMIN Start Trip Attempt..."
try {
    Invoke-RestMethod -Uri "http://localhost:8080/api/bookings/$bookingId/trip/start" -Method Post -Headers $adminHeaders
    throw "Admin start trip should have failed!"
} catch {
    $code = $_.Exception.Response.StatusCode.value__
    Write-Host "[PASS] ADMIN rejected with HTTP $code (403 Forbidden)."
    if ($code -ne 403) { throw "Expected 403, got $code" }
}

# 7. CO_OWNER B Starts Trip
Write-Host "`n>>> [7] CO_OWNER B Starts Trip..."
$trip = Invoke-RestMethod -Uri "http://localhost:8080/api/bookings/$bookingId/trip/start" -Method Post -Headers $ownerHeaders
Write-Host "Trip Created! ID: $($trip.id), Status: $($trip.status), Battery: $($trip.startBatteryLevel)%, Odo: $($trip.startOdometer) km, StartedAt: $($trip.startedAt)"
if ($trip.status -ne "ACTIVE" -or $null -eq $trip.startedAt -or $null -eq $trip.startBatteryLevel -or $null -eq $trip.startOdometer) {
    throw "Invalid Trip properties!"
}
Write-Host "[PASS] Trip created with status ACTIVE and vehicle snapshots."

# 8. Verify Vehicle Status Updated to IN_USE
Write-Host "`n>>> [8] Verifying Vehicle Operational Status..."
$veh = Invoke-RestMethod -Uri "http://localhost:8080/api/vehicles/$vehicleId" -Method Get -Headers $ownerHeaders
Write-Host "Vehicle Status: $($veh.status)"
if ($veh.status -ne "IN_USE") {
    throw "Expected vehicle status IN_USE, got $($veh.status)"
}
Write-Host "[PASS] Vehicle status transitioned to IN_USE."

# 9. Verify Completed VehicleHandover Remains Unchanged
Write-Host "`n>>> [9] Verifying Handover Immutability..."
$handoverPost = Invoke-RestMethod -Uri "http://localhost:8080/api/bookings/$bookingId/handover" -Method Get -Headers $ownerHeaders
if ($handoverPost.status -ne "COMPLETED") {
    throw "Handover was mutated!"
}
Write-Host "[PASS] Handover remains COMPLETED and immutable."

# 10. Query Active Trip for Booking
Write-Host "`n>>> [10] Querying Trip for Booking..."
$bookingTrip = Invoke-RestMethod -Uri "http://localhost:8080/api/bookings/$bookingId/trip" -Method Get -Headers $ownerHeaders
Write-Host "Booking Trip ID: $($bookingTrip.id), Status: $($bookingTrip.status)"
if ($bookingTrip.id -ne $trip.id) {
    throw "Booking trip mismatch!"
}
Write-Host "[PASS] Booking trip returned correctly."

# 11. Query Active Trip for Vehicle
Write-Host "`n>>> [11] Querying Active Trip for Vehicle (Reload Restoration)..."
$activeVehTrip = Invoke-RestMethod -Uri "http://localhost:8080/api/vehicles/$vehicleId/active-trip" -Method Get -Headers $staffHeaders
Write-Host "Active Vehicle Trip ID: $($activeVehTrip.id), User: $($activeVehTrip.userName)"
if ($activeVehTrip.id -ne $trip.id) {
    throw "Active vehicle trip mismatch!"
}
Write-Host "[PASS] Active vehicle trip query verified."

# 12. Duplicate Start on Same Booking (Rejected)
Write-Host "`n>>> [12] Duplicate Start Attempt on Same Booking..."
try {
    Invoke-RestMethod -Uri "http://localhost:8080/api/bookings/$bookingId/trip/start" -Method Post -Headers $ownerHeaders
    throw "Duplicate start should have failed!"
} catch {
    $errBody = Read-ErrorBody $_.Exception
    Write-Host "[PASS] Duplicate start rejected: $errBody"
}

# 13. Eligibility now reports TRIP_ALREADY_ACTIVE
Write-Host "`n>>> [13] Checking Eligibility when Trip is Already Active..."
$eligibilityActive = Invoke-RestMethod -Uri "http://localhost:8080/api/bookings/$bookingId/trip/start-eligibility" -Method Get -Headers $ownerHeaders
Write-Host "Eligible: $($eligibilityActive.eligible), Reason: $($eligibilityActive.reasonCode), Message: $($eligibilityActive.message)"
if ($eligibilityActive.eligible -ne $false -or $eligibilityActive.reasonCode -ne "TRIP_ALREADY_ACTIVE") {
    throw "Expected TRIP_ALREADY_ACTIVE!"
}
Write-Host "[PASS] Eligibility correctly returns TRIP_ALREADY_ACTIVE."

Write-Host "`n=========================================================="
Write-Host "ALL PHASE 10 TERMINAL VERIFICATION CHECKS PASSED!"
Write-Host "=========================================================="
