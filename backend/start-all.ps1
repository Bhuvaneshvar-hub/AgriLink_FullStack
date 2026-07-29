<#
.SYNOPSIS
    Starts all AgriLink microservices in the correct order, each in its own window.

.DESCRIPTION
    Boots eureka-server first (service registry) and waits until its port is
    listening, then launches every other service, with the API gateway last.
    Each service opens in its own PowerShell window titled "AgriLink: <service>"
    so you can read logs and Ctrl+C individual services.

    Prerequisites:
      - JDK 17 on PATH
      - MySQL running on localhost:3306 (user root / password root) for the
        data services (iam, farmer, crop, input, subsidy, produce, report,
        notification). Eureka and the gateway do not need a database.

.PARAMETER StartupDelaySeconds
    Seconds to pause between launching each service (default 4).

.PARAMETER EurekaWaitSeconds
    Max seconds to wait for Eureka (port 8761) before continuing (default 90).

.PARAMETER SkipEureka
    Skip starting eureka-server (use if it is already running).

.EXAMPLE
    .\start-all.ps1
#>
[CmdletBinding()]
param(
    [int]$StartupDelaySeconds = 4,
    [int]$EurekaWaitSeconds = 90,
    [switch]$SkipEureka
)

$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$mvnw = Join-Path $root 'mvnw.cmd'

if (-not (Test-Path $mvnw)) {
    Write-Host "ERROR: Maven wrapper not found at $mvnw" -ForegroundColor Red
    exit 1
}

# Order matters: registry first, gateway last.
$services = @(
    @{ Name = 'eureka-server';        Port = 8761 },
    @{ Name = 'iam-service';          Port = 8081 },
    @{ Name = 'farmer-service';       Port = 8082 },
    @{ Name = 'crop-service';         Port = 8083 },
    @{ Name = 'input-service';        Port = 8084 },
    @{ Name = 'subsidy-service';      Port = 8085 },
    @{ Name = 'produce-service';      Port = 8086 },
    @{ Name = 'report-service';       Port = 8087 },
    @{ Name = 'notification-service'; Port = 8088 },
    @{ Name = 'gateway-service';      Port = 9091 }
)

function Start-ServiceWindow {
    param([string]$Name)
    $dir = Join-Path $root $Name
    $cmd = "`$Host.UI.RawUI.WindowTitle = 'AgriLink: $Name'; " +
           "Write-Host 'Starting $Name...' -ForegroundColor Cyan; " +
           "Set-Location '$dir'; " +
           "& '$mvnw' spring-boot:run"
    Start-Process -FilePath 'powershell.exe' -ArgumentList @('-NoExit', '-Command', $cmd) | Out-Null
    Write-Host ("  -> launched {0,-22} (port {1})" -f $Name, ($services | Where-Object Name -eq $Name).Port) -ForegroundColor Green
}

function Wait-ForPort {
    param([int]$Port, [int]$TimeoutSeconds)
    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    while ($sw.Elapsed.TotalSeconds -lt $TimeoutSeconds) {
        try {
            $client = New-Object System.Net.Sockets.TcpClient
            $client.Connect('localhost', $Port)
            $client.Close()
            return $true
        } catch {
            Start-Sleep -Seconds 2
        }
    }
    return $false
}

Write-Host "==========================================" -ForegroundColor White
Write-Host " AgriLink - starting all microservices" -ForegroundColor White
Write-Host "==========================================" -ForegroundColor White

# 1) Eureka first
if (-not $SkipEureka) {
    Start-ServiceWindow -Name 'eureka-server'
    Write-Host "Waiting for Eureka registry on port 8761 (up to $EurekaWaitSeconds s)..." -ForegroundColor Yellow
    if (Wait-ForPort -Port 8761 -TimeoutSeconds $EurekaWaitSeconds) {
        Write-Host "Eureka is up. Continuing." -ForegroundColor Green
    } else {
        Write-Host "Eureka not detected in time - continuing anyway (services will retry registration)." -ForegroundColor Yellow
    }
} else {
    Write-Host "Skipping eureka-server (-SkipEureka)." -ForegroundColor Yellow
}

# 2) Everything else (gateway last, already ordered)
foreach ($svc in $services) {
    if ($svc.Name -eq 'eureka-server') { continue }
    Start-ServiceWindow -Name $svc.Name
    Start-Sleep -Seconds $StartupDelaySeconds
}

Write-Host ""
Write-Host "All services launched. First run may take a while (Maven downloads + startup)." -ForegroundColor Cyan
Write-Host "API Gateway:      http://localhost:9091" -ForegroundColor Cyan
Write-Host "Eureka Dashboard: http://localhost:8761" -ForegroundColor Cyan
Write-Host "Stop everything:  .\stop-all.ps1" -ForegroundColor Cyan
