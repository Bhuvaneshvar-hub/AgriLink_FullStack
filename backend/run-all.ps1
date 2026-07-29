# Launches ALL AgriLink microservices from ONE window (no per-service windows).
# Each service runs hidden in the background; its console output is redirected to
# .\logs\<service>.log so you keep a single clean terminal.
#
# Build first:   .\mvnw.cmd clean install
#      (faster:  .\mvnw.cmd clean install -DskipTests)
# Run:           .\run-all.ps1
# Watch a log:   Get-Content .\logs\Gateway.log -Wait
# Stop all:      .\stop-all.ps1
#
# Prerequisite: JDK on PATH + MySQL running on localhost:3306 (root/root) for the
# data services. Eureka and the gateway do not need a database.
$ErrorActionPreference = "Stop"
$root = $PSScriptRoot
$env:JAVA_TOOL_OPTIONS = ""
New-Item -ItemType Directory -Force "$root\logs" | Out-Null

# Startup order matters: Eureka first (service registry), Gateway last.
$services = @(
    @{ Name = "Eureka";       Port = 8761; Jar = "eureka-server\target\eureka-server-0.0.1-SNAPSHOT.jar" },
    @{ Name = "IAM";          Port = 8081; Jar = "iam-service\target\iam-service-0.0.1-SNAPSHOT.jar" },
    @{ Name = "Farmer";       Port = 8082; Jar = "farmer-service\target\farmer-service-0.0.1-SNAPSHOT.jar" },
    @{ Name = "Crop";         Port = 8083; Jar = "crop-service\target\crop-service-0.0.1-SNAPSHOT.jar" },
    @{ Name = "Input";        Port = 8084; Jar = "input-service\target\input-service-0.0.1-SNAPSHOT.jar" },
    @{ Name = "Subsidy";      Port = 8085; Jar = "subsidy-service\target\subsidy-service-0.0.1-SNAPSHOT.jar" },
    @{ Name = "Produce";      Port = 8086; Jar = "produce-service\target\produce-service-0.0.1-SNAPSHOT.jar" },
    @{ Name = "Report";       Port = 8087; Jar = "report-service\target\report-service-0.0.1-SNAPSHOT.jar" },
    @{ Name = "Notification"; Port = 8088; Jar = "notification-service\target\notification-service-0.0.1-SNAPSHOT.jar" },
    @{ Name = "Gateway";      Port = 9091; Jar = "gateway-service\target\gateway-service-0.0.1-SNAPSHOT.jar" }
)

foreach ($s in $services) {
    $jar = Join-Path $root $s.Jar
    if (-not (Test-Path $jar)) {
        Write-Host "[$($s.Name)] jar not found ($($s.Jar)). Run '.\mvnw.cmd clean install' first." -ForegroundColor Red
        continue
    }
    $logFile = "$root\logs\$($s.Name).log"
    Start-Process powershell -ArgumentList "-NoProfile -Command & { java -jar '$jar' > '$logFile' 2>&1 }" -WindowStyle Hidden
    Write-Host "[$($s.Name)] starting on port $($s.Port) -> logs\$($s.Name).log" -ForegroundColor Green

    # Give the Eureka registry a longer head start so the others can register.
    if ($s.Name -eq "Eureka") {
        Write-Host "Waiting ~15s for Eureka registry to come up..." -ForegroundColor DarkGray
        Start-Sleep -Seconds 15
    } else {
        Start-Sleep -Seconds 2
    }
}

Write-Host ""
Write-Host "All services launching in the background. They take ~25-30s to be fully ready." -ForegroundColor Cyan
Write-Host "Eureka Dashboard: http://localhost:8761" -ForegroundColor Cyan
Write-Host "API Gateway:      http://localhost:9091" -ForegroundColor Cyan
Write-Host "Watch a log with: Get-Content .\logs\Gateway.log -Wait"
Write-Host "Stop them all:    .\stop-all.ps1"
