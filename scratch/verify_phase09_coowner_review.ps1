# verify_phase09_coowner_review.ps1
$baseUrl = "http://localhost:8080/api"
$ErrorActionPreference = "Stop"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   PHASE 09 CO_OWNER RECEIPT & REVIEW VERIFICATION TEST   " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Login Helper Function
function Login-User($email, $password) {
    $body = @{ email = $email; password = $password } | ConvertTo-Json
    $res = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $body -ContentType "application/json"
    return $res.accessToken
}

# Login Accounts
Write-Host "`n[1] Authenticating test accounts..." -ForegroundColor Yellow
$staffToken = Login-User "staff@evshare.com" "SecretPassword123!"
Write-Host " -> STAFF authenticated" -ForegroundColor Green
$ownerAToken = Login-User "owner_a@evshare.com" "SecretPassword123!"
Write-Host " -> CO_OWNER A (Nguyen Van A) authenticated" -ForegroundColor Green
$ownerBToken = Login-User "owner_b@evshare.com" "SecretPassword123!"
Write-Host " -> CO_OWNER B (Tran Thi B) authenticated" -ForegroundColor Green

# 2. Get Vehicle EV01
$ev01Id = "11111111-1111-1111-1111-111111111111"

# 3. Create a Booking for CO_OWNER A on EV01
Write-Host "`n[2] Creating booking for CO_OWNER A..." -ForegroundColor Yellow
$randomDays = Get-Random -Minimum 15 -Maximum 90
$bookingDateStr = (Get-Date).AddDays($randomDays).ToString("yyyy-MM-dd")
$bookingBody = @{
    startTime = "${bookingDateStr}T08:00:00Z"
    endTime = "${bookingDateStr}T11:00:00Z"
    purpose = "Giao hang va cong tac ngoai thanh"
} | ConvertTo-Json

$bookingBytes = [System.Text.Encoding]::UTF8.GetBytes($bookingBody)
$booking = Invoke-RestMethod -Uri "$baseUrl/vehicles/$ev01Id/bookings" -Method Post -Body $bookingBytes -ContentType "application/json; charset=utf-8" -Headers @{ Authorization = "Bearer $ownerAToken" }
$bookingId = $booking.id
Write-Host " -> Created Booking ID: $bookingId for Owner: $($booking.userName)" -ForegroundColor Green

# 4. STAFF Starts / Initiates Handover
Write-Host "`n[3] STAFF initiating Handover for booking $bookingId..." -ForegroundColor Yellow
$handover = Invoke-RestMethod -Uri "$baseUrl/bookings/$bookingId/handover/start" -Method Post -Headers @{ Authorization = "Bearer $staffToken" }
$handoverId = $handover.id
Write-Host " -> Handover ID: $handoverId, Status: $($handover.status), Recipient: $($handover.coOwnerName)" -ForegroundColor Green

# 5. STAFF Records Checkpoint Inspections
Write-Host "`n[4] STAFF recording 8 checkpoint inspections..." -ForegroundColor Yellow

# Inspect WHEEL_FL as WARNING with Note
$insp1 = @{
    vehiclePartCode = "WHEEL_FL"
    conditionStatus = "WARNING"
    note = "Ap suat lop hoi thap (2.1 bar), da bom them"
} | ConvertTo-Json
$insp1Bytes = [System.Text.Encoding]::UTF8.GetBytes($insp1)
Invoke-RestMethod -Uri "$baseUrl/handovers/$handoverId/inspections" -Method Post -Body $insp1Bytes -ContentType "application/json; charset=utf-8" -Headers @{ Authorization = "Bearer $staffToken" } | Out-Null
Write-Host " -> WHEEL_FL (Banh truoc trai): WARNING recorded" -ForegroundColor Yellow

# Inspect BODY as DAMAGED with Note
$insp2 = @{
    vehiclePartCode = "BODY"
    conditionStatus = "DAMAGED"
    note = "Vet xuoc nhe 5cm can truoc ben phu"
} | ConvertTo-Json
$insp2Bytes = [System.Text.Encoding]::UTF8.GetBytes($insp2)
Invoke-RestMethod -Uri "$baseUrl/handovers/$handoverId/inspections" -Method Post -Body $insp2Bytes -ContentType "application/json; charset=utf-8" -Headers @{ Authorization = "Bearer $staffToken" } | Out-Null
Write-Host " -> BODY (Than vo xe): DAMAGED recorded" -ForegroundColor Red

# Inspect other 6 checkpoints as GOOD
$goodCheckpoints = @("WHEEL_FR", "WHEEL_RL", "WHEEL_RR", "WINDSHIELD", "BATTERY", "CHARGING_PORT")
foreach ($cp in $goodCheckpoints) {
    $inspGood = @{
        vehiclePartCode = $cp
        conditionStatus = "GOOD"
        note = "Tinh trang binh thuong, hoat dong tot"
    } | ConvertTo-Json
    $inspGoodBytes = [System.Text.Encoding]::UTF8.GetBytes($inspGood)
    Invoke-RestMethod -Uri "$baseUrl/handovers/$handoverId/inspections" -Method Post -Body $inspGoodBytes -ContentType "application/json; charset=utf-8" -Headers @{ Authorization = "Bearer $staffToken" } | Out-Null
}
Write-Host " -> Remaining 6 checkpoints recorded as GOOD" -ForegroundColor Green

# 6. STAFF Marks Vehicle Ready & Confirms Handover
Write-Host "`n[5] STAFF marking vehicle ready and confirming handover..." -ForegroundColor Yellow
$ready = Invoke-RestMethod -Uri "$baseUrl/handovers/$handoverId/ready" -Method Post -Headers @{ Authorization = "Bearer $staffToken" }
Write-Host " -> Status after ready: $($ready.status)" -ForegroundColor Green

$handedOver = Invoke-RestMethod -Uri "$baseUrl/handovers/$handoverId/handover" -Method Post -Headers @{ Authorization = "Bearer $staffToken" }
Write-Host " -> Status after handover: $($handedOver.status)" -ForegroundColor Green

# 7. SECURITY CHECKS: CO_OWNER CANNOT CALL STAFF WRITE ENDPOINTS
Write-Host "`n[6] Security Check: CO_OWNER cannot call STAFF endpoints..." -ForegroundColor Yellow
try {
    $testEdit = @{ vehiclePartCode = "BODY"; conditionStatus = "GOOD"; note = "Hacked note" } | ConvertTo-Json
    Invoke-RestMethod -Uri "$baseUrl/handovers/$handoverId/inspections" -Method Post -Body $testEdit -ContentType "application/json" -Headers @{ Authorization = "Bearer $ownerAToken" }
    Write-Host " [FAIL] CO_OWNER was able to edit inspection!" -ForegroundColor Red
    exit 1
} catch {
    Write-Host " -> [PASS] CO_OWNER blocked from inspection write (HTTP $($_.Exception.Response.StatusCode.value__))" -ForegroundColor Green
}

try {
    Invoke-RestMethod -Uri "$baseUrl/handovers/$handoverId/ready" -Method Post -Headers @{ Authorization = "Bearer $ownerAToken" }
    Write-Host " [FAIL] CO_OWNER was able to mark ready!" -ForegroundColor Red
    exit 1
} catch {
    Write-Host " -> [PASS] CO_OWNER blocked from mark ready (HTTP $($_.Exception.Response.StatusCode.value__))" -ForegroundColor Green
}

try {
    Invoke-RestMethod -Uri "$baseUrl/handovers/$handoverId/handover" -Method Post -Headers @{ Authorization = "Bearer $ownerAToken" }
    Write-Host " [FAIL] CO_OWNER was able to confirm staff handover!" -ForegroundColor Red
    exit 1
} catch {
    Write-Host " -> [PASS] CO_OWNER blocked from confirm staff handover (HTTP $($_.Exception.Response.StatusCode.value__))" -ForegroundColor Green
}

# 8. CO_OWNER READ-ONLY DATA INSPECTION
Write-Host "`n[7] CO_OWNER reviews persisted STAFF inspection results..." -ForegroundColor Yellow
$activeHandovers = Invoke-RestMethod -Uri "$baseUrl/vehicles/$ev01Id/active-handovers" -Method Get -Headers @{ Authorization = "Bearer $ownerAToken" }
$currentHandover = $activeHandovers | Where-Object { $_.id -eq $handoverId }

Write-Host " -> Total checkpoints inspected: $($currentHandover.inspections.Count) / 8" -ForegroundColor Cyan
Write-Host " -> Handover status: $($currentHandover.status)" -ForegroundColor Cyan
Write-Host " -> Condition Acknowledged: $($currentHandover.conditionAcknowledged)" -ForegroundColor Cyan

$wheelFl = $currentHandover.inspections | Where-Object { $_.vehiclePartCode -eq "WHEEL_FL" }
Write-Host " -> Checkpoint WHEEL_FL: Condition=$($wheelFl.conditionStatus), Note='$($wheelFl.note)', InspectedBy=$($wheelFl.inspectedByName), InspectedAt=$($wheelFl.inspectedAt)" -ForegroundColor Yellow
if ($wheelFl.conditionStatus -ne "WARNING" -or [string]::IsNullOrEmpty($wheelFl.inspectedByName)) {
    Write-Host " [FAIL] WHEEL_FL does not match STAFF recorded values!" -ForegroundColor Red
    exit 1
}

$bodyCp = $currentHandover.inspections | Where-Object { $_.vehiclePartCode -eq "BODY" }
Write-Host " -> Checkpoint BODY: Condition=$($bodyCp.conditionStatus), Note='$($bodyCp.note)', InspectedBy=$($bodyCp.inspectedByName), InspectedAt=$($bodyCp.inspectedAt)" -ForegroundColor Red
if ($bodyCp.conditionStatus -ne "DAMAGED" -or [string]::IsNullOrEmpty($bodyCp.inspectedByName)) {
    Write-Host " [FAIL] BODY does not match STAFF recorded values!" -ForegroundColor Red
    exit 1
}

# 9. BUSINESS RULE: RECEIPT BLOCKED BEFORE ACKNOWLEDGEMENT
Write-Host "`n[8] Business Rule: CO_OWNER cannot confirm receipt BEFORE acknowledging condition..." -ForegroundColor Yellow
try {
    Invoke-RestMethod -Uri "$baseUrl/handovers/$handoverId/owner-confirm" -Method Post -Headers @{ Authorization = "Bearer $ownerAToken" }
    Write-Host " [FAIL] CO_OWNER confirmed receipt without acknowledging condition!" -ForegroundColor Red
    exit 1
} catch {
    Write-Host " -> [PASS] Receipt successfully blocked prior to condition acknowledgement" -ForegroundColor Green
}

# 10. SECURITY CHECK: UNAUTHORIZED CO_OWNER CANNOT ACKNOWLEDGE OR CONFIRM
Write-Host "`n[9] Security Check: Unauthorized CO_OWNER B cannot acknowledge or confirm receipt..." -ForegroundColor Yellow
try {
    Invoke-RestMethod -Uri "$baseUrl/handovers/$handoverId/acknowledge-condition" -Method Post -Headers @{ Authorization = "Bearer $ownerBToken" }
    Write-Host " [FAIL] Unauthorized CO_OWNER B was able to acknowledge condition!" -ForegroundColor Red
    exit 1
} catch {
    Write-Host " -> [PASS] Unauthorized CO_OWNER B blocked from acknowledge (HTTP $($_.Exception.Response.StatusCode.value__))" -ForegroundColor Green
}

try {
    Invoke-RestMethod -Uri "$baseUrl/handovers/$handoverId/owner-confirm" -Method Post -Headers @{ Authorization = "Bearer $ownerBToken" }
    Write-Host " [FAIL] Unauthorized CO_OWNER B was able to confirm receipt!" -ForegroundColor Red
    exit 1
} catch {
    Write-Host " -> [PASS] Unauthorized CO_OWNER B blocked from confirm receipt (HTTP $($_.Exception.Response.StatusCode.value__))" -ForegroundColor Green
}

# 11. CO_OWNER ACKNOWLEDGES VEHICLE CONDITION
Write-Host "`n[10] Booking Owner (CO_OWNER A) acknowledges vehicle condition..." -ForegroundColor Yellow
$ackRes = Invoke-RestMethod -Uri "$baseUrl/handovers/$handoverId/acknowledge-condition" -Method Post -Headers @{ Authorization = "Bearer $ownerAToken" }
Write-Host " -> Condition Acknowledged: $($ackRes.conditionAcknowledged)" -ForegroundColor Green
Write-Host " -> Acknowledged At: $($ackRes.ownerConditionAcknowledgedAt)" -ForegroundColor Green
if (-not $ackRes.conditionAcknowledged -or [string]::IsNullOrEmpty($ackRes.ownerConditionAcknowledgedAt)) {
    Write-Host " [FAIL] Condition acknowledgement flag/timestamp missing in response!" -ForegroundColor Red
    exit 1
}

# 12. CO_OWNER CONFIRMS RECEIPT
Write-Host "`n[11] Booking Owner (CO_OWNER A) confirms vehicle receipt..." -ForegroundColor Yellow
$receiptRes = Invoke-RestMethod -Uri "$baseUrl/handovers/$handoverId/owner-confirm" -Method Post -Headers @{ Authorization = "Bearer $ownerAToken" }
Write-Host " -> Status after owner-confirm: $($receiptRes.status)" -ForegroundColor Green
if ($receiptRes.status -ne "COMPLETED" -and $receiptRes.status -ne "OWNER_CONFIRMED") {
    Write-Host " [FAIL] Expected status OWNER_CONFIRMED or COMPLETED, got $($receiptRes.status)" -ForegroundColor Red
    exit 1
}

# 13. FINALIZE CHECK-IN / COMPLETE HANDOVER (Idempotent if already completed)
Write-Host "`n[12] Verifying finalized check-in (COMPLETED)..." -ForegroundColor Yellow
if ($receiptRes.status -ne "COMPLETED") {
    $completedRes = Invoke-RestMethod -Uri "$baseUrl/handovers/$handoverId/complete" -Method Post -Headers @{ Authorization = "Bearer $ownerAToken" }
    Write-Host " -> Final Status: $($completedRes.status)" -ForegroundColor Green
    if ($completedRes.status -ne "COMPLETED") {
        Write-Host " [FAIL] Expected status COMPLETED, got $($completedRes.status)" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host " -> Final Status already COMPLETED upon receipt confirmation" -ForegroundColor Green
}

Write-Host "`n==========================================================" -ForegroundColor Green
Write-Host "   ALL PHASE 09 CO_OWNER RECEIPT VERIFICATIONS PASSED!    " -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
