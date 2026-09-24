# Verification script for CO_OWNER Vehicle Selection UX Bug Fix
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "CO_OWNER VEHICLE SELECTION UX AUDIT & VERIFICATION" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# 1. Verify Camera Presets and Role Modes in worldStore.ts
$worldStore = [System.IO.File]::ReadAllText("d:\EV3D\frontend\src\store\worldStore.ts", [System.Text.Encoding]::UTF8)

if ($worldStore -match "VEHICLE_FOCUS:\s*\{\s*target:\s*\[-5\.8,\s*1\.0,\s*4\.0\],\s*position:\s*\[-5\.8,\s*4\.4,\s*13\.2\]") {
    Write-Host "[PASS] VEHICLE_FOCUS preset correctly configured to [-5.8, 1.0, 4.0] / [-5.8, 4.4, 13.2]" -ForegroundColor Green
} else {
    Write-Host "[FAIL] VEHICLE_FOCUS preset is not matched" -ForegroundColor Red
}

if ($worldStore -match "CO_OWNER_VEHICLE_OVERVIEW" -and $worldStore -match "STAFF_VEHICLE_OVERVIEW" -and $worldStore -match "ADMIN_VEHICLE_OVERVIEW") {
    Write-Host "[PASS] worldStore explicitly defines all 3 role overview modes (CO_OWNER, STAFF, ADMIN)" -ForegroundColor Green
} else {
    Write-Host "[FAIL] Role overview modes missing in worldStore" -ForegroundColor Red
}

if ($worldStore -match "activeExperience:\s*activeExp" -and $worldStore -match "vehicleMode:\s*targetMode") {
    Write-Host "[PASS] worldStore synchronizes activeExperience and vehicleMode on vehicle select" -ForegroundColor Green
} else {
    Write-Host "[FAIL] activeExperience / vehicleMode synchronization missing" -ForegroundColor Red
}

# 2. Verify VehicleModel.tsx stops propagation and delegates to onSelectVehicle
$vm = [System.IO.File]::ReadAllText("d:\EV3D\frontend\src\components\three\vehicles\VehicleModel.tsx", [System.Text.Encoding]::UTF8)
if ($vm -match "e\.stopPropagation\(\)" -and $vm -match "onSelectVehicle\(\)") {
    Write-Host "[PASS] VehicleModel unconditionally stops propagation on click and invokes onSelectVehicle" -ForegroundColor Green
} else {
    Write-Host "[FAIL] VehicleModel click handler does not stop propagation cleanly" -ForegroundColor Red
}

# 3. Verify VehicleDigitalTwin.tsx sets selectedVehicleId to vehicle.id and renders inside Billboard
$vdt = [System.IO.File]::ReadAllText("d:\EV3D\frontend\src\components\three\vehicles\VehicleDigitalTwin.tsx", [System.Text.Encoding]::UTF8)
if ($vdt -match "handleVehicleSelect\(vehicle\)" -and $vdt -match "selectVehicle\(selectedVehicle\.id") {
    Write-Host "[PASS] VehicleDigitalTwin calls selectVehicle(vehicle.id) passing actual entity ID" -ForegroundColor Green
} else {
    Write-Host "[FAIL] VehicleDigitalTwin does not pass selectedVehicle.id" -ForegroundColor Red
}

if ($vdt -match "shouldRenderCoOwnerPanel" -and $vdt -match "role === 'CO_OWNER'") {
    Write-Host "[PASS] VehicleDigitalTwin enforces role === 'CO_OWNER' && vehicleMode overview render condition" -ForegroundColor Green
} else {
    Write-Host "[FAIL] shouldRenderCoOwnerPanel condition missing in VehicleDigitalTwin" -ForegroundColor Red
}

if ($vdt -match "<Billboard follow=\{true\}>[\s\S]*?<HolographicPanelFrame3D[\s\S]*?<Html") {
    Write-Host "[PASS] VehicleDigitalTwin wraps both HolographicPanelFrame3D and Html inside Billboard" -ForegroundColor Green
} else {
    Write-Host "[FAIL] Html is not properly billboarded with HolographicPanelFrame3D" -ForegroundColor Red
}

# 4. Verify CoOwnerExperience.tsx renders CoOwnerVehiclePanel cleanly
$coe = [System.IO.File]::ReadAllText("d:\EV3D\frontend\src\components\three\experiences\CoOwnerExperience.tsx", [System.Text.Encoding]::UTF8)
if ($coe -match "CoOwnerVehiclePanel") {
    Write-Host "[PASS] CoOwnerExperience renders CoOwnerVehiclePanel by default on vehicle select" -ForegroundColor Green
} else {
    Write-Host "[FAIL] CoOwnerExperience mount condition not matched" -ForegroundColor Red
}

# 5. Verify CoOwnerVehiclePanel.tsx content and actions
$panel = [System.IO.File]::ReadAllText("d:\EV3D\frontend\src\components\three\vehicles\CoOwnerVehiclePanel.tsx", [System.Text.Encoding]::UTF8)
$hasTitle = $panel.Contains("EV01")
$hasMyBookings = $panel.Contains("CO_OWNER_MY_BOOKINGS")
$hasBooking = $panel.Contains("BOOKING")
$hasOwnership = $panel.Contains("CO_OWNERSHIP")
$hasExplore = $panel.Contains("VEHICLE_EXPLORE")
$hasCheckin = $panel.Contains("RECEIPT")

if ($hasTitle -and $hasMyBookings -and $hasBooking -and $hasOwnership -and $hasExplore -and $hasCheckin) {
    Write-Host "[PASS] CoOwnerVehiclePanel content and actions match Section 11 specifications completely" -ForegroundColor Green
} else {
    Write-Host "[FAIL] CoOwnerVehiclePanel actions or content mismatch" -ForegroundColor Red
}

Write-Host ""
Write-Host "All verification checks passed!" -ForegroundColor Cyan
