# Holonet Startup Script

param(
    [switch]$server,
    [switch]$client,
    [switch]$init
)

# Set pnpm to allow scripts (needed for electron)
$env:PNPM_IGNORE_SCRIPTS = "false"

# Check pnpm
$pnpmPath = Get-Command pnpm -ErrorAction SilentlyContinue
if (-not $pnpmPath) {
    $useNpx = $true
} else {
    $useNpx = $false
}

function Invoke-Pnpm {
    param([string[]]$CommandArgs)
    if ($useNpx) {
        & npx -y pnpm@latest @CommandArgs
    } else {
        & pnpm @CommandArgs
    }
}

# Initialize database
if ($init) {
    Write-Host "Database initialization" -ForegroundColor Green
    Write-Host ""
    
    $dbUser = Read-Host "PostgreSQL username (default: postgres)"
    if ([string]::IsNullOrWhiteSpace($dbUser)) {
        $dbUser = "postgres"
    }
    
    $dbPassword = Read-Host "PostgreSQL password" -AsSecureString
    $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($dbPassword)
    $dbPasswordPlain = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
    
    Write-Host ""
    Write-Host "Creating holonet database..." -ForegroundColor Cyan
    
    $env:PGPASSWORD = $dbPasswordPlain
    try {
        psql -U $dbUser -h localhost -p 5432 -d postgres -c "CREATE DATABASE holonet;" 2>&1 | Out-Null
        Write-Host "Database ready" -ForegroundColor Green
    } catch {
        Write-Host "Database may already exist" -ForegroundColor Yellow
    }
    
    $databaseUrl = "postgresql://${dbUser}:${dbPasswordPlain}@localhost:5432/holonet?schema=public"
    $env:DATABASE_URL = $databaseUrl
    
    Write-Host "Applying schema..." -ForegroundColor Cyan
    Invoke-Pnpm @("--filter", "server", "db:push")
    
    Write-Host ""
    Write-Host "Initialization complete!" -ForegroundColor Green
    Write-Host "DATABASE_URL: $databaseUrl" -ForegroundColor Gray
    $env:PGPASSWORD = $null
    exit
}

# Start server only
if ($server) {
    Write-Host "Starting backend server..." -ForegroundColor Cyan
    
    if (-not $env:DATABASE_URL) {
        Write-Host "DATABASE_URL not set" -ForegroundColor Yellow
        Write-Host "Example: `$env:DATABASE_URL=`"postgresql://postgres:password@localhost:5432/holonet?schema=public`"" -ForegroundColor Gray
        $env:DATABASE_URL = Read-Host "Enter DATABASE_URL"
    }
    
    $env:PORT = "3001"
    $env:NODE_ENV = "development"
    
    Invoke-Pnpm @("dev:server")
    exit
}

# Start client only
if ($client) {
    Write-Host "Starting Electron client..." -ForegroundColor Cyan
    Invoke-Pnpm @("dev")
    exit
}

# Default: Start both server and client
Write-Host "Starting Holonet..." -ForegroundColor Green
Write-Host ""

if (-not $env:DATABASE_URL) {
    Write-Host "DATABASE_URL not set" -ForegroundColor Yellow
    Write-Host "Example: `$env:DATABASE_URL=`"postgresql://postgres:password@localhost:5432/holonet?schema=public`"" -ForegroundColor Gray
    $input = Read-Host "Enter DATABASE_URL (press Enter to skip)"
    if ($input) {
        $env:DATABASE_URL = $input
    }
}

if ($env:DATABASE_URL) {
    Write-Host "Starting backend server..." -ForegroundColor Cyan
    $env:PORT = "3001"
    $env:NODE_ENV = "development"
    $serverCmd = if ($useNpx) { "npx -y pnpm@latest dev:server" } else { "pnpm dev:server" }
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; `$env:DATABASE_URL='$env:DATABASE_URL'; `$env:PORT='3001'; `$env:NODE_ENV='development'; $serverCmd"
    Start-Sleep -Seconds 3
}

Write-Host "Starting Electron client..." -ForegroundColor Cyan
Invoke-Pnpm @("dev")
