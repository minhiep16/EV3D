$baseUrl = "http://localhost:8080/api"
$login = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body '{"email":"staff@evshare.com","password":"SecretPassword123!"}' -ContentType "application/json"
$token = $login.accessToken

$handovers = Invoke-RestMethod -Uri "$baseUrl/vehicles/11111111-1111-1111-1111-111111111111/active-handovers" -Headers @{ Authorization = "Bearer $token" }
Write-Host "Active Handovers count: $($handovers.Count)"
foreach ($h in $handovers) {
    Write-Host "Handover ID: $($h.id)"
    Write-Host "  Booking ID: $($h.bookingId)"
    Write-Host "  Recipient: $($h.coOwnerName)"
    Write-Host "  Status: $($h.status)"
    Write-Host "  Start: $($h.bookingStartTime)"
    Write-Host "  End: $($h.bookingEndTime)"
}

Write-Host "`nCo-Ownership details for EV01:"
$co = Invoke-RestMethod -Uri "$baseUrl/vehicles/11111111-1111-1111-1111-111111111111/co-ownership" -Headers @{ Authorization = "Bearer $token" }
foreach ($m in $co.members) {
    Write-Host "  Member: $($m.fullName) ($($m.email)) - Share: $($m.share.percentage)%"
}

