$path = 'C:\Users\2506601\Downloads\AgriLink_Module45_API_Endpoints_updated.xlsx'
$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$wb = $excel.Workbooks.Open($path)
$sheets = @()
foreach ($sheet in $wb.Sheets) {
    $sheets += $sheet.Name
}
Write-Output ('Sheets: ' + ($sheets -join ', '))
foreach ($sheet in $wb.Sheets) {
    if ($sheet.Name -match 'subsidy') {
        Write-Output "=== $($sheet.Name)"
        for ($r = 1; $r -le 20; $r++) {
            $row = @()
            for ($c = 1; $c -le 10; $c++) {
                $value = $sheet.Cells.Item($r, $c).Text
                if ($value -eq $null) { $value = '' }
                $row += $value
            }
            Write-Output ($row -join '|')
        }
        Write-Output '...'
    }
}
$wb.Close($false)
$excel.Quit()
[System.Runtime.Interopservices.Marshal]::ReleaseComObject($wb) | Out-Null
[System.Runtime.Interopservices.Marshal]::ReleaseComObject($excel) | Out-Null
