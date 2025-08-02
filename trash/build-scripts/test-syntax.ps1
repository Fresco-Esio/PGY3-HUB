try {
    Write-Host "Testing try-catch block" -ForegroundColor Green
    throw "Test error"
} catch {
    Write-Host "Caught error: $_" -ForegroundColor Red
}
