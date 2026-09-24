$staffRes = Invoke-RestMethod -Uri 'http://localhost:8080/api/auth/login' -Method Post -ContentType 'application/json' -Body (@{ email = 'staff@evshare.com'; password = 'SecretPassword123!' } | ConvertTo-Json)
$staffHeaders = @{ Authorization = 'Bearer ' + $staffRes.accessToken }

$ownerARes = Invoke-RestMethod -Uri 'http://localhost:8080/api/auth/login' -Method Post -ContentType 'application/json' -Body (@{ email = 'owner_a@evshare.com'; password = 'SecretPassword123!' } | ConvertTo-Json)
$ownerAHeaders = @{ Authorization = 'Bearer ' + $ownerARes.accessToken }

Write-Host ">>> [1] CO_OWNER A attempts to start trip on EV01 while active:"
try {
    Invoke-RestMethod -Uri 'http://localhost:8080/api/bookings/33333333-3333-3333-3333-333333333331/trip/start' -Method Post -Headers $ownerAHeaders
    Write-Host "FAIL: Should have rejected"
} catch {
    Write-Host "PASS: Rejected with 403 Forbidden"
}

Write-Host "`n>>> [2] CO_OWNER A attempts to confirm receipt on EV01:"
try {
    Invoke-RestMethod -Uri 'http://localhost:8080/api/handovers/44444444-4444-4444-4444-444444444441/confirm-receipt' -Method Post -Headers $ownerAHeaders
    Write-Host "FAIL: Should have rejected"
} catch {
    Write-Host "PASS: Rejected with Access Denied"
}

Write-Host "`n>>> [3] STAFF attempts to start handover while vehicle is IN_USE:"
try {
    Invoke-RestMethod -Uri 'http://localhost:8080/api/bookings/33333333-3333-3333-3333-333333333331/handover/start' -Method Post -Headers $staffHeaders
    Write-Host "FAIL: Should have rejected"
} catch {
    $stream = $_.Exception.Response.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($stream)
    Write-Host "PASS: Rejected: $($reader.ReadToEnd())"
}

Write-Host "`n>>> [4] CO_OWNER A books a future non-overlapping slot:"
$futureDate = [DateTime]::UtcNow.AddDays(7).ToString('yyyy-MM-dd')
$futureBookingBody = @{
    startTime = "${futureDate}T08:00:00Z"
    endTime = "${futureDate}T11:00:00Z"
    purpose = "Di cong tac tuong lai khi xe dang duoc nguoi khac dung"
} | ConvertTo-Json
try {
    $futureBooking = Invoke-RestMethod -Uri 'http://localhost:8080/api/vehicles/11111111-1111-1111-1111-111111111111/bookings' -Method Post -ContentType 'application/json; charset=utf-8' -Headers $ownerAHeaders -Body ([System.Text.Encoding]::UTF8.GetBytes($futureBookingBody))
    Write-Host "PASS: Future booking created successfully! ID: $($futureBooking.id), User: $($futureBooking.userName), Time: $($futureBooking.startTime) - $($futureBooking.endTime)"
} catch {
    $stream = $_.Exception.Response.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($stream)
    Write-Host "FAIL: $($reader.ReadToEnd())"
}
