# Complete .env.production File Setup
# This script will help you fill in the missing credentials

Write-Host "`n==============================================================================" -ForegroundColor Cyan
Write-Host "  MobVibe .env.production Completion Script" -ForegroundColor Cyan
Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host ""

$envFile = "D:\009_Projects_AI\Personal_Projects\MobVibe\.env.production"

if (-not (Test-Path $envFile)) {
    Write-Host "Error: .env.production file not found!" -ForegroundColor Red
    exit 1
}

Write-Host "We need to fill in 3 missing credentials:" -ForegroundColor Yellow
Write-Host "  1. Supabase Anon Key" -ForegroundColor White
Write-Host "  2. Supabase Service Role Key" -ForegroundColor White
Write-Host "  3. Fly.io API Token" -ForegroundColor White
Write-Host ""

# Get Supabase Anon Key
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "1. Supabase Anon Key" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "Go to: https://supabase.com/dashboard" -ForegroundColor Gray
Write-Host "Select your project → Settings → API" -ForegroundColor Gray
Write-Host "Copy the 'anon public' key (starts with eyJ...)" -ForegroundColor Gray
Write-Host ""
$anonKey = Read-Host "Paste Supabase Anon Key"

# Get Supabase Service Role Key
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "2. Supabase Service Role Key" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "From the same page, copy the 'service_role' key" -ForegroundColor Gray
Write-Host "⚠️  SENSITIVE - Never expose in frontend!" -ForegroundColor Red
Write-Host ""
$serviceRoleKey = Read-Host "Paste Supabase Service Role Key" -AsSecureString
$serviceRoleKeyPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($serviceRoleKey))

# Get Fly.io Token
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "3. Fly.io API Token" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "Run this command to get your token:" -ForegroundColor Gray
Write-Host "  flyctl auth token" -ForegroundColor Yellow
Write-Host ""
$flyToken = Read-Host "Paste Fly.io API Token" -AsSecureString
$flyTokenPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($flyToken))

# Update .env.production file
Write-Host ""
Write-Host "Updating .env.production file..." -ForegroundColor Yellow

$content = Get-Content $envFile -Raw

$content = $content -replace '<YOUR_SUPABASE_ANON_KEY_HERE>', $anonKey
$content = $content -replace '<YOUR_SUPABASE_SERVICE_ROLE_KEY_HERE>', $serviceRoleKeyPlain
$content = $content -replace '<YOUR_FLY_API_TOKEN_HERE>', $flyTokenPlain

Set-Content -Path $envFile -Value $content -NoNewline

Write-Host "✓ .env.production file updated successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Review .env.production to verify all values are correct" -ForegroundColor White
Write-Host "  2. Add GitHub secrets using: scripts/setup-github-secrets.md" -ForegroundColor White
Write-Host "  3. Store backup in password manager (Bitwarden/1Password)" -ForegroundColor White
Write-Host "  4. Test mobile build: cd mobile && eas build --platform android" -ForegroundColor White
Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "⚠️  IMPORTANT: Never commit .env.production to Git!" -ForegroundColor Red
Write-Host ""
