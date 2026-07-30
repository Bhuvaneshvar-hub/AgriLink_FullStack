<#
.SYNOPSIS
    Starts all AgriLink microservices in the correct order.

.DESCRIPTION
    Boots eureka-server first (service registry) and waits until its port is
    listening, then launches every other service, with the API gateway last.

    By default each service opens in its own PowerShell window titled
    "AgriLink: <service>" so you can read logs and Ctrl+C individual services.

    Pass -SingleWindow to instead run every service as a background process
    from this one terminal, with each service's console output redirected to
    a log file under .\logs\<service>.log. Use `Get-Job` / `Receive-Job` or
    just tail the log files to watch output, and .\stop-all.ps1 to stop
    everything (works the same way in both modes, since it kills by port).

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

.PARAMETER SingleWindow
    Run all services as background processes from this one terminal instead
    of opening a new window per service. Logs go to .\logs\<service>.log.

.EXAMPLE
    .\start-all.ps1

.EXAMPLE
    .\start-all.ps1 -SingleWindow
#>
[CmdletBinding()]
param(
    [int]$StartupDelaySeconds = 4,
    [int]$EurekaWaitSeconds = 90,
    [switch]$SkipEureka,
    [switch]$SingleWindow
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

$logsDir = Join-Path $root 'logs'
if ($SingleWindow -and -not (Test-Path $logsDir)) {
    New-Item -ItemType Directory -Path $logsDir | Out-Null
}

function Start-ServiceWindow {
    param([string]$Name)
    $dir = Join-Path $root $Name
    $port = ($services | Where-Object Name -eq $Name).Port

    if ($SingleWindow) {
        $outFile = Join-Path $logsDir "$Name.log"
        $errFile = Join-Path $logsDir "$Name.err.log"
        Start-Process -FilePath $mvnw -ArgumentList @('spring-boot:run') `
            -WorkingDirectory $dir -WindowStyle Hidden `
            -RedirectStandardOutput $outFile -RedirectStandardError $errFile | Out-Null
        Write-Host ("  -> launched {0,-22} (port {1}, log: logs\{0}.log)" -f $Name, $port) -ForegroundColor Green
    } else {
        $cmd = "`$Host.UI.RawUI.WindowTitle = 'AgriLink: $Name'; " +
               "Write-Host 'Starting $Name...' -ForegroundColor Cyan; " +
               "Set-Location '$dir'; " +
               "& '$mvnw' spring-boot:run"
        Start-Process -FilePath 'powershell.exe' -ArgumentList @('-NoExit', '-Command', $cmd) | Out-Null
        Write-Host ("  -> launched {0,-22} (port {1})" -f $Name, $port) -ForegroundColor Green
    }
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
if ($SingleWindow) {
    Write-Host "Logs:             .\logs\<service>.log (e.g. Get-Content .\logs\gateway-service.log -Wait)" -ForegroundColor Cyan
}
