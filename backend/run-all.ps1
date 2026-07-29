# AgriLink - launch every microservice (and the gateway) each in its own window.
#
# Usage:   .\run-all.ps1
# Stop:    close the individual windows, or .\run-all.ps1 -Stop
#
# Prerequisite: JDK 21 + MySQL running on localhost:3306 (root/root).

param([switch]$Stop)

$root = $PSScriptRoot
$flags = "-Dmaven.resolver.transport=wagon -Dmaven.wagon.http.ssl.insecure=true -Dmaven.wagon.http.ssl.allowall=true"

$services = @(
    "gateway-service",
    "iam-service",
    "farmer-service",
    "crop-service",
    "input-service",
    "subsidy-service",
    "produce-service",
    "report-service",
    "notification-service"
)

if ($Stop) {
    Write-Host "Stopping all Java/Maven processes for AgriLink..."
    Get-CimInstance Win32_Process |
        Where-Object { $_.CommandLine -match "spring-boot:run|AgriLink" } |
        ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
    Write-Host "Done."
    return
}

foreach ($svc in $services) {
    Write-Host "Starting $svc ..."
    $cmd = "cd '$root'; .\mvnw.cmd -pl $svc spring-boot:run $flags"
    Start-Process powershell -ArgumentList "-NoExit", "-Command", $cmd
    Start-Sleep -Seconds 2
}

Write-Host "`nAll services launching in separate windows."
Write-Host "Each prints 'Started <App>' when ready. Gateway entry point: http://localhost:9091"
