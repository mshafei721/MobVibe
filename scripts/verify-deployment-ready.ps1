# Verify Deployment Readiness
# Checks that all credentials are configured

Write-Host "`n==============================================================================" -ForegroundColor Cyan
Write-Host "  MobVibe Deployment Readiness Check" -ForegroundColor Cyan
Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host ""

$allGood = $true

# Check .env.production exists
Write-Host "[1/4] Checking .env.production file..." -ForegroundColor Yellow
$envFile = ".env.production"
if (Test-Path $envFile) {
    $content = Get-Content $envFile -Raw

    # Check for placeholders
    if ($content -match '<YOUR_') {
        Write-Host "  ✗ .env.production contains placeholders" -ForegroundColor Red
        Write-Host "    Run: .\scripts\complete-env-production.ps1" -ForegroundColor Gray
        $allGood = $false
    } else {
        Write-Host "  ✓ .env.production file complete" -ForegroundColor Green
    }
} else {
    Write-Host "  ✗ .env.production not found" -ForegroundColor Red
    $allGood = $false
}

# Check backend health
Write-Host "`n[2/4] Checking backend health..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "https://mobvibe-api-divine-silence-9977.fly.dev/health" -TimeoutSec 10
    if ($response.status -eq "healthy") {
        Write-Host "  ✓ Backend is healthy" -ForegroundColor Green
        Write-Host "    Uptime: $($response.uptime)s" -ForegroundColor Gray
    } else {
        Write-Host "  ✗ Backend returned unexpected status" -ForegroundColor Red
        $allGood = $false
    }
} catch {
    Write-Host "  ✗ Cannot reach backend" -ForegroundColor Red
    Write-Host "    Error: $($_.Exception.Message)" -ForegroundColor Gray
    $allGood = $false
}

# Check EAS CLI
Write-Host "`n[3/4] Checking EAS CLI..." -ForegroundColor Yellow
try {
    $easVersion = eas --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✓ EAS CLI installed" -ForegroundColor Green
    } else {
        Write-Host "  ✗ EAS CLI not found" -ForegroundColor Red
        Write-Host "    Run: npm install -g eas-cli" -ForegroundColor Gray
        $allGood = $false
    }
} catch {
    Write-Host "  ✗ EAS CLI not found" -ForegroundColor Red
    Write-Host "    Run: npm install -g eas-cli" -ForegroundColor Gray
    $allGood = $false
}

# Check GitHub secrets setup guide
Write-Host "`n[4/4] GitHub Secrets Status..." -ForegroundColor Yellow
Write-Host "  ℹ  Manual setup required" -ForegroundColor Cyan
Write-Host "    Follow: .\scripts\setup-github-secrets.md" -ForegroundColor Gray

# Summary
Write-Host "`n==============================================================================" -ForegroundColor Cyan
if ($allGood) {
    Write-Host "  ✓ Deployment Ready!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next Steps:" -ForegroundColor Yellow
    Write-Host "  1. Add GitHub secrets (see scripts/setup-github-secrets.md)" -ForegroundColor White
    Write-Host "  2. Test mobile build:" -ForegroundColor White
    Write-Host "     cd mobile" -ForegroundColor Gray
    Write-Host "     eas build --platform android --profile preview" -ForegroundColor Gray
    Write-Host "  3. Monitor backend:" -ForegroundColor White
    Write-Host "     https://fly.io/apps/mobvibe-api-divine-silence-9977/monitoring" -ForegroundColor Gray
} else {
    Write-Host "  ✗ Setup Incomplete" -ForegroundColor Red
    Write-Host ""
    Write-Host "Fix the issues above, then run this script again." -ForegroundColor Yellow
}
Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host ""
