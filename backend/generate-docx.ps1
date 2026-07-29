# Builds a real .docx (OpenXML, zipped) containing the full AgriLink source code.
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

$backend  = 'C:\Users\2506611\Downloads\AgriLink\AgriLink'
$frontend = 'C:\Users\2506611\Downloads\Frontend\agrilink-frontend'
$out      = 'C:\Users\2506611\Downloads\AgriLink_Full_Source_Code.docx'

$files = New-Object System.Collections.Generic.List[object]
function Add-One($full, $label) {
  if (Test-Path $full) { $files.Add([pscustomobject]@{ Path = $full; Label = $label }) }
}

# ---- Backend files (exclude build/IDE output) ----
$beExt = @('*.java', '*.xml', '*.properties', '*.md', '*.ps1')
Get-ChildItem -Path $backend -Recurse -File -Include $beExt |
  Where-Object {
    $_.FullName -notmatch '\\target\\' -and
    $_.FullName -notmatch '\\\.idea\\' -and
    $_.FullName -notmatch '\\\.mvn\\' -and
    $_.FullName -notmatch '\\\.git\\' -and
    $_.Name -ne 'generate-docx.ps1'
  } |
  Sort-Object FullName |
  ForEach-Object { Add-One $_.FullName ("BACKEND\" + $_.FullName.Substring($backend.Length).TrimStart('\')) }

# ---- Frontend files (src + key root configs) ----
foreach ($f in @('package.json','angular.json','tsconfig.json','tsconfig.app.json','proxy.conf.json')) {
  Add-One (Join-Path $frontend $f) ("FRONTEND\" + $f)
}
Get-ChildItem -Path (Join-Path $frontend 'src') -Recurse -File -Include @('*.ts','*.html','*.css','*.scss','*.json') |
  Sort-Object FullName |
  ForEach-Object { Add-One $_.FullName ("FRONTEND\" + $_.FullName.Substring($frontend.Length).TrimStart('\')) }

Write-Host "Collected $($files.Count) files."

function Esc([string]$s) {
  if ($null -eq $s) { return '' }
  $s = $s -replace '&', '&amp;' -replace '<', '&lt;' -replace '>', '&gt;'
  $s = $s -replace '[\x00-\x08\x0B\x0C\x0E-\x1F]', ''
  return $s
}

$sb = New-Object System.Text.StringBuilder
[void]$sb.Append('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>')
[void]$sb.Append('<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>')

# Title
[void]$sb.Append('<w:p><w:pPr><w:spacing w:after="120"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="48"/><w:color w:val="1B5E20"/></w:rPr><w:t>AgriLink - Full Source Code</w:t></w:r></w:p>')
[void]$sb.Append('<w:p><w:pPr><w:spacing w:after="240"/></w:pPr><w:r><w:rPr><w:sz w:val="22"/><w:color w:val="555555"/></w:rPr><w:t xml:space="preserve">Spring Boot microservices + API Gateway + Angular frontend. ' + $files.Count + ' files.</w:t></w:r></w:p>')

$codeRpr = '<w:rPr><w:rFonts w:ascii="Consolas" w:hAnsi="Consolas" w:cs="Consolas"/><w:sz w:val="16"/></w:rPr>'

foreach ($item in $files) {
  # File heading (shows in Word navigation pane via outlineLvl)
  [void]$sb.Append('<w:p><w:pPr><w:spacing w:before="240" w:after="60"/><w:outlineLvl w:val="1"/><w:shd w:val="clear" w:fill="E8F5E9"/></w:pPr>')
  [void]$sb.Append('<w:r><w:rPr><w:b/><w:sz w:val="22"/><w:color w:val="1B5E20"/></w:rPr><w:t xml:space="preserve">' + (Esc $item.Label) + '</w:t></w:r></w:p>')

  $lines = Get-Content -LiteralPath $item.Path -ErrorAction SilentlyContinue
  if ($null -eq $lines) { $lines = @() }
  foreach ($line in $lines) {
    if ($line -eq '') {
      [void]$sb.Append('<w:p/>')
    } else {
      [void]$sb.Append('<w:p><w:pPr><w:spacing w:after="0" w:line="240" w:lineRule="auto"/></w:pPr><w:r>' + $codeRpr + '<w:t xml:space="preserve">' + (Esc $line) + '</w:t></w:r></w:p>')
    }
  }
}

[void]$sb.Append('<w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="720" w:right="720" w:bottom="720" w:left="720" w:header="0" w:footer="0" w:gutter="0"/></w:sectPr>')
[void]$sb.Append('</w:body></w:document>')

# ---- Assemble the .docx package (ZipArchive with forward-slash entry names) ----
$ct = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>'
$rels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>'

$utf8 = New-Object System.Text.UTF8Encoding($false)
if (Test-Path $out) { Remove-Item $out -Force }

$fs = [System.IO.File]::Open($out, [System.IO.FileMode]::Create)
$zip = New-Object System.IO.Compression.ZipArchive($fs, [System.IO.Compression.ZipArchiveMode]::Create)
function Add-Entry($zip, $name, $text, $enc) {
  $entry = $zip.CreateEntry($name, [System.IO.Compression.CompressionLevel]::Optimal)
  $stream = $entry.Open()
  $bytes = $enc.GetBytes($text)
  $stream.Write($bytes, 0, $bytes.Length)
  $stream.Dispose()
}
Add-Entry $zip '[Content_Types].xml' $ct $utf8
Add-Entry $zip '_rels/.rels' $rels $utf8
Add-Entry $zip 'word/document.xml' $sb.ToString() $utf8
$zip.Dispose()
$fs.Close()

$size = [math]::Round((Get-Item $out).Length / 1MB, 2)
Write-Host "Created: $out ($size MB)"
