<#
.SYNOPSIS
    Stops all AgriLink microservices started by start-all.ps1.

.DESCRIPTION
    Finds the process listening on each known service port and stops it.
    Only touches the AgriLink ports, so unrelated Java apps are left alone.

.EXAMPLE
    .\stop-all.ps1
#>
[CmdletBinding()]
param()

$ports = @(8761, 9091, 8081, 8082, 8083, 8084, 8085, 8086, 8087, 8088)

Write-Host "Stopping AgriLink services..." -ForegroundColor White

$stopped = 0
foreach ($port in $ports) {
    try {
        $conns = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction Stop
    } catch {
        continue  # nothing listening on this port
    }
    foreach ($procId in ($conns.OwningProcess | Select-Object -Unique)) {
        try {
            $proc = Get-Process -Id $procId -ErrorAction Stop
            Write-Host ("  stopping port {0,-5} -> PID {1} ({2})" -f $port, $procId, $proc.ProcessName) -ForegroundColor Yellow
            Stop-Process -Id $procId -Force -ErrorAction Stop
            $stopped++
        } catch {
            Write-Host ("  could not stop PID {0} on port {1}: {2}" -f $procId, $port, $_.Exception.Message) -ForegroundColor Red
        }
    }
}

if ($stopped -eq 0) {
    Write-Host "No running AgriLink services found." -ForegroundColor Green
} else {
    Write-Host "Stopped $stopped process(es)." -ForegroundColor Green
    Write-Host "Note: the service terminal windows may remain open - close them manually." -ForegroundColor DarkGray
}
