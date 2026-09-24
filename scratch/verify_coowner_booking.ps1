$baseUrl = "http://localhost:8080/api"
$login = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body '{"email":"owner_a@evshare.com","password":"SecretPassword123!"}' -ContentType "application/json"
$ownerToken = $login.accessToken
Write-Host "CO_OWNER Logged in: $($login.user.fullName)"

$body = @{
    startTime = "2026-12-15T08:00:00Z"
    endTime   = "2026-12-15T11:00:00Z"
    purpose   = "Test CO_OWNER booking"
} | ConvertTo-Json

$res = Invoke-RestMethod -Uri "$baseUrl/vehicles/11111111-1111-1111-1111-111111111111/bookings" -Method Post -Body $body -ContentType "application/json" -Headers @{ Authorization = "Bearer $ownerToken" }
Write-Host "Booking created successfully: $($res.id)"

# Cleanup test booking
Invoke-RestMethod -Uri "$baseUrl/bookings/$($res.id)/cancel" -Method Patch -Headers @{ Authorization = "Bearer $ownerToken" } | Out-Null
Write-Host "Booking cancelled cleanly."
