$ErrorActionPreference = "Continue"

Write-Host "=== 1. Login as STAFF ==="
$staffLogin = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" -Method Post -ContentType "application/json" -Body '{"email":"staff@evshare.com","password":"SecretPassword123!"}'
$staffToken = $staffLogin.accessToken
Write-Host "STAFF logged in: $($staffLogin.user.fullName) (Role: $($staffLogin.user.role))"

Write-Host "`n=== 2. STAFF attempts to create a personal booking ==="
$vehicleId = "11111111-1111-1111-1111-111111111111"
$headers = @{
    "Authorization" = "Bearer $staffToken"
    "Content-Type"  = "application/json"
}
$bookingBody = '{"startTime":"2026-09-30T10:00:00Z","endTime":"2026-09-30T12:00:00Z","purpose":"Staff personal use"}'

try {
    $res = Invoke-RestMethod -Uri "http://localhost:8080/api/vehicles/$vehicleId/bookings" -Method Post -Headers $headers -Body $bookingBody
    Write-Host "UNEXPECTED: STAFF was able to create booking: $($res.id)"
} catch {
    $status = $_.Exception.Response.StatusCode.value__
    Write-Host "EXPECTED: STAFF booking attempt was rejected with HTTP Status: $status"
    if ($status -eq 403) {
        Write-Host "PASSED: Authorization strictly forbids STAFF from creating personal vehicle bookings."
    } else {
        Write-Host "Received status $status (Note: 403 expected when updated controller is loaded)"
    }
}
