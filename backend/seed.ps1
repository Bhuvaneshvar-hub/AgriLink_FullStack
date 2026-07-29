# AgriLink - POST sample data to every endpoint (multiple rows for rich time-series charts).
#
# Usage:
#   .\seed.ps1              # posts directly to each service on its own port (8081-8088)
#   .\seed.ps1 -Gateway     # posts everything through the API gateway instead
#   .\seed.ps1 -Gateway -GatewayPort 9091
#
# Prerequisite: MySQL is running, and the target service(s) are started.
# PKs are omitted on purpose - they are auto-generated (IDENTITY).

param(
    [switch]$Gateway,
    [int]$GatewayPort = 9091
)

$global:token = $null

# First, log in to obtain JWT token
$hostPort = if ($Gateway) { $GatewayPort } else { 8081 }
$loginUrl = "http://localhost:$hostPort/agriLink/session/login"
Write-Host "Authenticating as admin user at $loginUrl..." -ForegroundColor Yellow
try {
    $loginBody = @{ email = "admin@agrilink.com"; password = "Admin@1234" } | ConvertTo-Json -Compress
    $loginRes = Invoke-RestMethod -Uri $loginUrl -Method Post -ContentType "application/json" -Body $loginBody
    $global:token = $loginRes.accessToken
    Write-Host "Login SUCCESS. Token acquired.`n" -ForegroundColor Green
} catch {
    Write-Host "Login FAILED: $($_.Exception.Message). Seeding will proceed without token (may fail with 403).`n" -ForegroundColor Red
}

function Post($port, $path, $body) {
    $hostPort = if ($Gateway) { $GatewayPort } else { $port }
    $url = "http://localhost:$hostPort$path"
    try {
        $json = $body | ConvertTo-Json -Compress -Depth 10
        $headers = @{}
        if ($global:token) {
            $headers["Authorization"] = "Bearer $global:token"
        }
        $res = Invoke-RestMethod -Uri $url -Method Post -ContentType "application/json" -Headers $headers -Body $json
        Write-Host ("OK    {0}  ->  {1}" -f $path, $res.message) -ForegroundColor Green
    }
    catch {
        $errMsg = $_.Exception.Message
        try {
            if ($_.Exception.Response) {
                $stream = $_.Exception.Response.GetResponseStream()
                if ($stream) {
                    $reader = New-Object System.IO.StreamReader($stream)
                    $errMsg = $reader.ReadToEnd()
                }
            }
        } catch {}
        Write-Host ("FAIL  {0}  ->  {1}" -f $path, $errMsg) -ForegroundColor Red
    }
}

Write-Host "Seeding AgriLink with time-series datasets (mode: $(if ($Gateway) {'GATEWAY :' + $GatewayPort} else {'DIRECT ports'}))`n"

# =====================================================================
# 1) IAM SERVICE (8081)
# =====================================================================
$roles = @(
    @{ roleName = "Farmer"; description = "Farmer profile role"; status = "A" }
    @{ roleName = "ExtensionOfficer"; description = "Agricultural expert/officer"; status = "A" }
    @{ roleName = "ProcurementOfficer"; description = "Market buyer manager"; status = "A" }
    @{ roleName = "SubsidyAdmin"; description = "Subsidy schemes officer"; status = "A" }
    @{ roleName = "ComplianceAnalyst"; description = "System auditor and analyst"; status = "A" }
)
# Note: roles are pre-seeded in data-seeder, but sending is harmless/noop if already exist.
foreach ($r in $roles) { Post 8081 "/agriLink/role/createRole" $r }

$permissions = @(
    @{ permissionName = "ViewCrop"; module = "Crop"; action = "READ"; description = "View crops" }
    @{ permissionName = "ManageCrop"; module = "Crop"; action = "WRITE"; description = "Manage crop plans" }
    @{ permissionName = "ApproveSubsidy"; module = "Subsidy"; action = "WRITE"; description = "Approve applications" }
)
foreach ($p in $permissions) { Post 8081 "/agriLink/role/createPermission" $p }

$users = @(
    @{ name = "Asha Devi"; roleId = 1; email = "asha@example.com"; phone = "9876543210"; regionId = 1; password = "Password@123"; status = "A" }
    @{ name = "Babu Lal"; roleId = 1; email = "babu@example.com"; phone = "8765432109"; regionId = 1; password = "Password@123"; status = "A" }
    @{ name = "Chandra Kumar"; roleId = 3; email = "chandra@example.com"; phone = "7654321098"; regionId = 2; password = "Password@123"; status = "A" }
    @{ name = "Divya Raj"; roleId = 2; email = "divya@example.com"; phone = "6543210987"; regionId = 1; password = "Password@123"; status = "A" }
)
foreach ($u in $users) { Post 8081 "/agriLink/user/createUser" $u }

# Logs
$logs = @(
    @{ userId = 1; action = "LOGIN"; module = "IAM"; timestamp = "2026-01-10T09:00:00"; ipAddress = "192.168.1.10" }
    @{ userId = 2; action = "LOGIN"; module = "IAM"; timestamp = "2026-02-15T10:30:00"; ipAddress = "192.168.1.11" }
    @{ userId = 4; action = "UPDATE_CROP_PLAN"; module = "Crop"; timestamp = "2026-03-20T14:15:00"; ipAddress = "192.168.2.1" }
    @{ userId = 3; action = "CREATE_LISTING"; module = "Produce"; timestamp = "2026-04-05T11:00:00"; ipAddress = "192.168.3.15" }
)
foreach ($l in $logs) { Post 8081 "/agriLink/audit/log" $l }


# =====================================================================
# 2) FARMER SERVICE (8082)
# =====================================================================
$farmers = @(
    @{ userId = 2; name = "Asha Devi"; dateOfBirth = "1988-04-12"; gender = "Female"; nationalIdNumber = "ID-908123"; village = "Hosur"; district = "Krishnagiri"; state = "Tamil Nadu"; phone = "9876543210"; bankAccountNumber = "SBI-009823412"; status = "AC" }
    @{ userId = 3; name = "Babu Lal"; dateOfBirth = "1982-08-25"; gender = "Male"; nationalIdNumber = "ID-702315"; village = "Shoolagiri"; district = "Krishnagiri"; state = "Tamil Nadu"; phone = "8765432109"; bankAccountNumber = "HDFC-441209831"; status = "AC" }
)
foreach ($f in $farmers) { Post 8082 "/agrilink/farmer/farmer-profiles" $f }

$holdings = @(
    @{ farmerId = 1; surveyNumber = "SVY-101A"; areaAcres = 4.2; soilType = "Loam"; irrigationSource = "Borewell"; ownershipType = "Owned"; status = "AC" }
    @{ farmerId = 1; surveyNumber = "SVY-101B"; areaAcres = 2.5; soilType = "Clay"; irrigationSource = "Rainfed"; ownershipType = "Leased"; status = "AC" }
    @{ farmerId = 2; surveyNumber = "SVY-205C"; areaAcres = 5.0; soilType = "Sandy"; irrigationSource = "Canal"; ownershipType = "Owned"; status = "AC" }
)
foreach ($h in $holdings) { Post 8082 "/agrilink/farmer/land-holdings" $h }


# =====================================================================
# 3) CROP SERVICE (8083)
# =====================================================================
$crops = @(
    @{ cropName = "Paddy (Rice)"; category = "Cereal"; season = "Kharif"; typicalDurationDays = 120; expectedYieldPerAcre = 24.0; status = "AC" }
    @{ cropName = "Wheat"; category = "Cereal"; season = "Rabi"; typicalDurationDays = 110; expectedYieldPerAcre = 18.5; status = "AC" }
    @{ cropName = "Cotton"; category = "Fibre"; season = "Kharif"; typicalDurationDays = 180; expectedYieldPerAcre = 12.0; status = "AC" }
    @{ cropName = "Groundnut"; category = "Oilseed"; season = "Rabi"; typicalDurationDays = 105; expectedYieldPerAcre = 15.0; status = "AC" }
)
foreach ($c in $crops) { Post 8083 "/agrilink/crop/crop-catalogs" $c }

$plans = @(
    @{ farmerId = 1; holdingId = 1; cropId = 1; season = "Kharif"; year = 2026; sowingDate = "2026-06-01"; expectedHarvestDate = "2026-10-01"; areaPlanted = 4.0; status = "AC" }
    @{ farmerId = 1; holdingId = 2; cropId = 3; season = "Kharif"; year = 2026; sowingDate = "2026-05-15"; expectedHarvestDate = "2026-11-15"; areaPlanted = 2.0; status = "AC" }
    @{ farmerId = 2; holdingId = 3; cropId = 2; season = "Rabi"; year = 2026; sowingDate = "2026-11-01"; expectedHarvestDate = "2027-02-20"; areaPlanted = 5.0; status = "AC" }
)
foreach ($p in $plans) { Post 8083 "/agrilink/crop/crop-plans" $p }

$observations = @(
    @{ planId = 1; officerId = 4; observationDate = "2026-06-15"; stage = "PL"; pestOrDiseaseFlag = $false; remarks = "Plan review completed. Field is ready." }
    @{ planId = 1; officerId = 4; observationDate = "2026-07-05"; stage = "SO"; pestOrDiseaseFlag = $false; remarks = "Germination observed. Healthy shoots." }
    @{ planId = 2; officerId = 4; observationDate = "2026-06-20"; stage = "PL"; pestOrDiseaseFlag = $false; remarks = "Plan approved. Sowing scheduled." }
)
foreach ($o in $observations) { Post 8083 "/agrilink/crop/growth-observations" $o }


# =====================================================================
# 4) INPUT SERVICE (8084)
# =====================================================================
$inputs = @(
    @{ name = "Urea Fertilizer"; category = "Fertiliser"; unit = "Bag"; pricePerUnit = 450.0; subsidisedPrice = 280.0; availableStock = 450; status = "AC" }
    @{ name = "NPK 19:19:19 Complex"; category = "Fertiliser"; unit = "Bag"; pricePerUnit = 900.0; subsidisedPrice = 600.0; availableStock = 300; status = "AC" }
    @{ name = "Bt Cotton Seed Pack"; category = "Seeds"; unit = "Pack"; pricePerUnit = 850.0; subsidisedPrice = 450.0; availableStock = 120; status = "AC" }
    @{ name = "Organic Compost"; category = "Fertiliser"; unit = "Tonne"; pricePerUnit = 3000.0; subsidisedPrice = 1800.0; availableStock = 40; status = "AC" }
)
foreach ($i in $inputs) { Post 8084 "/agrilink/input/catalogs" $i }

# Time series inputs requests (Jan - Jul 2026)
$requests = @(
    @{ farmerId = 1; inputId = 1; quantityRequested = 8; requestDate = "2026-01-15"; assignedCentreId = 1; actualPrice = 2240.0; status = "DL" }
    @{ farmerId = 1; inputId = 2; quantityRequested = 4; requestDate = "2026-02-18"; assignedCentreId = 1; actualPrice = 2400.0; status = "DL" }
    @{ farmerId = 2; inputId = 1; quantityRequested = 12; requestDate = "2026-03-05"; assignedCentreId = 2; actualPrice = 3360.0; status = "DL" }
    @{ farmerId = 1; inputId = 3; quantityRequested = 5; requestDate = "2026-05-10"; assignedCentreId = 1; actualPrice = 2250.0; status = "AP" }
    @{ farmerId = 2; inputId = 4; quantityRequested = 2; requestDate = "2026-06-25"; assignedCentreId = 2; actualPrice = 3600.0; status = "AP" }
    @{ farmerId = 1; inputId = 1; quantityRequested = 10; requestDate = "2026-07-12"; assignedCentreId = 1; actualPrice = 2800.0; status = "PE" }
)
foreach ($r in $requests) { Post 8084 "/agrilink/input/requests" $r }


# =====================================================================
# 5) SUBSIDY SERVICE (8085)
# =====================================================================
$schemes = @(
    @{ schemeName = "PM-KISAN Cash Support"; category = "WelfareSupport"; eligibilityCriteria = "Landholding < 5 acres"; benefitAmount = 6000.0; fundingSource = "Central Govt"; startDate = "2026-01-01"; endDate = "2026-12-31"; status = "AC" }
    @{ schemeName = "Kharif Fertilizer Rebate"; category = "InputSubsidy"; eligibilityCriteria = "Registered small farmers"; benefitAmount = 4500.0; fundingSource = "State Govt"; startDate = "2026-04-01"; endDate = "2026-09-30"; status = "AC" }
    @{ schemeName = "Solar Pump Setup Subsidy"; category = "CapitalSubsidy"; eligibilityCriteria = "Irrigated landholding"; benefitAmount = 45000.0; fundingSource = "Central & State"; startDate = "2026-02-01"; endDate = "2026-12-31"; status = "AC" }
)
foreach ($s in $schemes) { Post 8085 "/agriLink/subsidyScheme/createScheme" $s }

$subsidyApplications = @(
    @{ farmerId = 1; schemeId = 1; applicationDate = "2026-01-10"; eligibilityScore = 95.0; reviewedBy = 4; disbursedAmount = 6000.0; disbursedDate = "2026-01-15"; status = "AP" }
    @{ farmerId = 2; schemeId = 1; applicationDate = "2026-02-02"; eligibilityScore = 88.0; reviewedBy = 4; disbursedAmount = 6000.0; disbursedDate = "2026-02-10"; status = "AP" }
    @{ farmerId = 1; schemeId = 2; applicationDate = "2026-04-10"; eligibilityScore = 92.0; reviewedBy = 4; disbursedAmount = 4500.0; disbursedDate = "2026-04-18"; status = "AP" }
    @{ farmerId = 2; schemeId = 3; applicationDate = "2026-05-20"; eligibilityScore = 75.0; reviewedBy = 4; disbursedAmount = 45000.0; disbursedDate = "2026-06-05"; status = "AP" }
    @{ farmerId = 1; schemeId = 3; applicationDate = "2026-07-02"; eligibilityScore = 82.0; reviewedBy = 4; disbursedAmount = 0.0; disbursedDate = $null; status = "PE" }
)
foreach ($sa in $subsidyApplications) { Post 8085 "/agriLink/subsidyScheme/createApplication" $sa }


# =====================================================================
# 6) PRODUCE SERVICE (8086)
# =====================================================================
$listings = @(
    @{ farmerId = 1; cropId = 1; harvestDate = "2026-01-05"; quantityKg = 2500.0; qualityGrade = "A+"; askingPricePerKg = 25.0; status = "SO" }
    @{ farmerId = 2; cropId = 2; harvestDate = "2026-03-10"; quantityKg = 1800.0; qualityGrade = "A"; askingPricePerKg = 22.0; status = "SO" }
    @{ farmerId = 1; cropId = 3; harvestDate = "2026-06-15"; quantityKg = 1200.0; qualityGrade = "A"; askingPricePerKg = 55.0; status = "AV" }
    @{ farmerId = 2; cropId = 1; harvestDate = "2026-07-01"; quantityKg = 3000.0; qualityGrade = "B"; askingPricePerKg = 20.0; status = "AV" }
)
foreach ($l in $listings) { Post 8086 "/agrilink/produce/produce-listings" $l }

# Time series transactions (Sales)
$sales = @(
    @{ listingId = 1; buyerId = 3; quantitySoldKg = 1500.0; agreedPricePerKg = 24.5; totalAmount = 36750.0; saleDate = "2026-01-12"; paymentStatus = "PD" }
    @{ listingId = 1; buyerId = 3; quantitySoldKg = 1000.0; agreedPricePerKg = 24.0; totalAmount = 24000.0; saleDate = "2026-01-18"; paymentStatus = "PD" }
    @{ listingId = 2; buyerId = 3; quantitySoldKg = 1800.0; agreedPricePerKg = 21.8; totalAmount = 39240.0; saleDate = "2026-03-20"; paymentStatus = "PD" }
    @{ listingId = 3; buyerId = 3; quantitySoldKg = 500.0; agreedPricePerKg = 54.0; totalAmount = 27000.0; saleDate = "2026-06-25"; paymentStatus = "PE" }
)
foreach ($s in $sales) { Post 8086 "/agrilink/produce/produce-sales" $s }


# =====================================================================
# 7) REPORT SERVICE (8087)
# =====================================================================
$reports = @(
    @{ generatedBy = 4; scope = "District"; metrics = "RegisteredFarmers=25,ActivePlans=18,DisbursedSubsidies=₹96750"; generatedDate = "2026-03-31" }
    @{ generatedBy = 4; scope = "State"; metrics = "CottonYieldAcre=11.8,PaddyYieldAcre=23.2"; generatedDate = "2026-06-30" }
    @{ generatedBy = 4; scope = "District"; metrics = "InputDemands=Urea:20Bags,NPK:4Bags"; generatedDate = "2026-07-20" }
)
foreach ($r in $reports) { Post 8087 "/agriLink/analytics/reports/generate" $r }


# =====================================================================
# 8) NOTIFICATION SERVICE (8088)
# =====================================================================
$notifications = @(
    @{ userId = 1; message = "Reminder: Submit your PM-KISAN renewal form by end of the month."; category = "SubsidyAlert"; status = "UN"; createdDate = "2026-01-05" }
    @{ userId = 1; message = "Advisory: Pest warning issued for Cotton in Krishnagiri district. Spray Neem oil."; category = "CropAdvisory"; status = "UN"; createdDate = "2026-05-22" }
    @{ userId = 2; message = "Input Request #3 for Urea Fertilizer has been APPROVED."; category = "InputAlert"; status = "RD"; createdDate = "2026-03-06" }
    @{ userId = 1; message = "System Notification: Scheduled maintenance of the portal tonight between 12:00 AM - 02:00 AM."; category = "SystemAlert"; status = "RD"; createdDate = "2026-07-25" }
)
foreach ($n in $notifications) { Post 8088 "/agrilink/notification/notifications" $n }

Write-Host "`nDone seeding time-series mock datasets."
