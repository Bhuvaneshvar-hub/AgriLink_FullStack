-- AgriLink Seeding Script (SQL Format)
-- To be executed on a MySQL server instance hosting the AgriLink databases.
-- 
-- How to run:
--   mysql -u root -p < seed-data.sql

-- =====================================================================
-- 1) agrilink_iam
-- =====================================================================
USE agrilink_iam;

DELETE FROM audit_log;
DELETE FROM user_session;
DELETE FROM user_details;
DELETE FROM user_role;

INSERT INTO user_role (roleId, roleName, description, status) VALUES
(1, 'AgriLinkAdmin', 'Full administrative access', 'A'),
(2, 'ExtensionOfficer', 'Field officer - registers and verifies farmers', 'A'),
(3, 'ProcurementOfficer', 'Manages crop procurement', 'A'),
(4, 'SubsidyAdmin', 'Reviews and approves subsidy applications', 'A'),
(5, 'ComplianceAnalyst', 'Audits actions and ensures compliance', 'A'),
(6, 'Farmer', 'Manages own crop plans and subsidy requests', 'A');

INSERT INTO user_details (userId, regionId, roleId, phone, email, name, passwordHash, status, createdAt) VALUES
(1, 1, 1, '0000000000', 'admin@agrilink.com', 'System Administrator', '$2a$10$wdBgUJZCPwmKN7A6CvfFN./VY.kZXCCo.uPPiXHO2Jy/lhZcFKzAe', 'A', NOW()),
(2, 1, 1, '9876543210', 'asha@example.com', 'Asha Devi', '$2a$10$7bcoVuN/w2YcGtlGq0m5UeWMeruDk4RIQtmlpL3CE3fancTs2HeQi', 'A', NOW()),
(3, 1, 1, '8765432109', 'babu@example.com', 'Babu Lal', '$2a$10$DvVV340QTMMqpzf1WCC9GOUI9mbznBzU0PhX1web97vT5SBskYJ3i', 'A', NOW()),
(4, 2, 3, '7654321098', 'chandra@example.com', 'Chandra Kumar', '$2a$10$U4ZjFtacSL9YKOokvwc6hOLYI6vsF2mGe0ntYK9Zubey/wPSCEq6.', 'A', NOW()),
(5, 1, 2, '6543210987', 'divya@example.com', 'Divya Raj', '$2a$10$tKhjkE9jZWMZ3COgSHRcP.dYjk073OGXZ7FjbBK3jK1dPclpxbdvO', 'A', NOW());

-- =====================================================================
-- 2) agrilink_farmer
-- =====================================================================
USE agrilink_farmer;

DELETE FROM land_holding;
DELETE FROM farmer_profile;

INSERT INTO farmer_profile (farmerId, userId, name, dateOfBirth, gender, nationalIdNumber, village, district, state, phone, bankAccountNumber, status) VALUES
(1, 2, 'Asha Devi', '1988-04-12', 'Female', 'ID-908123', 'Hosur', 'Krishnagiri', 'Tamil Nadu', '9876543210', 'SBI-009823412', 'AC'),
(2, 3, 'Babu Lal', '1982-08-25', 'Male', 'ID-702315', 'Shoolagiri', 'Krishnagiri', 'Tamil Nadu', '8765432109', 'HDFC-441209831', 'AC');

INSERT INTO land_holding (holdingId, farmerId, surveyNumber, areaAcres, soilType, irrigationSource, ownershipType, status) VALUES
(1, 1, 'SVY-101A', 4.2, 'Loam', 'Borewell', 'Owned', 'AC'),
(2, 1, 'SVY-101B', 2.5, 'Clay', 'Rainfed', 'Leased', 'AC'),
(3, 2, 'SVY-205C', 5.0, 'Sandy', 'Canal', 'Owned', 'AC');

-- =====================================================================
-- 3) agrilink_crop
-- =====================================================================
USE agrilink_crop;

DELETE FROM growth_observation;
DELETE FROM crop_plan;
DELETE FROM crop_catalog;

INSERT INTO crop_catalog (cropId, cropName, category, season, typicalDurationDays, expectedYieldPerAcre, status) VALUES
(1, 'Paddy (Rice)', 'Cereal', 'Kharif', 120, 24.0, 'AC'),
(2, 'Wheat', 'Cereal', 'Rabi', 110, 18.5, 'AC'),
(3, 'Cotton', 'Fibre', 'Kharif', 180, 12.0, 'AC'),
(4, 'Groundnut', 'Oilseed', 'Rabi', 105, 15.0, 'AC');

INSERT INTO crop_plan (planId, farmerId, holdingId, cropId, season, year, sowingDate, expectedHarvestDate, areaPlanted, status) VALUES
(1, 1, 1, 1, 'Kharif', 2026, '2026-06-01', '2026-10-01', 4.0, 'AC'),
(2, 1, 2, 3, 'Kharif', 2026, '2026-05-15', '2026-11-15', 2.0, 'AC'),
(3, 2, 3, 2, 'Rabi', 2026, '2026-11-01', '2027-02-20', 5.0, 'AC');

INSERT INTO growth_observation (observationId, planId, officerId, observationDate, stage, pestOrDiseaseFlag, remarks) VALUES
(1, 1, 4, '2026-06-15', 'PL', 0, 'Plan review completed. Field is ready.'),
(2, 1, 4, '2026-07-05', 'SO', 0, 'Germination observed. Healthy shoots.'),
(3, 2, 4, '2026-06-20', 'PL', 0, 'Plan approved. Sowing scheduled.');

-- =====================================================================
-- 4) agrilink_input
-- =====================================================================
USE agrilink_input;

DELETE FROM request;
DELETE FROM catalog;

INSERT INTO catalog (inputId, name, category, unit, pricePerUnit, subsidisedPrice, availableStock, status) VALUES
(1, 'Urea Fertilizer', 'Fertiliser', 'Bag', 450.0, 280.0, 450, 'AC'),
(2, 'NPK 19:19:19 Complex', 'Fertiliser', 'Bag', 900.0, 600.0, 300, 'AC'),
(3, 'Bt Cotton Seed Pack', 'Seeds', 'Pack', 850.0, 450.0, 120, 'AC'),
(4, 'Organic Compost', 'Fertiliser', 'Tonne', 3000.0, 1800.0, 40, 'AC');

INSERT INTO request (requestId, farmerId, inputId, quantityRequested, requestDate, assignedCentreId, actualPrice, status) VALUES
(1, 1, 1, 8, '2026-01-15', 1, 2240.0, 'DL'),
(2, 1, 2, 4, '2026-02-18', 1, 2400.0, 'DL'),
(3, 2, 1, 12, '2026-03-05', 2, 3360.0, 'DL'),
(4, 1, 3, 5, '2026-05-10', 1, 2250.0, 'AP'),
(5, 2, 4, 2, '2026-06-25', 2, 3600.0, 'AP'),
(6, 1, 1, 10, '2026-07-12', 1, 2800.0, 'PE');

-- =====================================================================
-- 5) agrilink_subsidy
-- =====================================================================
USE agrilink_subsidy;

DELETE FROM subsidy_application;
DELETE FROM scheme_catalog;

INSERT INTO scheme_catalog (schemeId, schemeName, category, eligibilityCriteria, benefitAmount, fundingSource, startDate, endDate, status) VALUES
(1, 'PM-KISAN Cash Support', 'WelfareSupport', 'Landholding < 5 acres', 6000.0, 'Central Govt', '2026-01-01', '2026-12-31', 'AC'),
(2, 'Kharif Fertilizer Rebate', 'InputSubsidy', 'Registered small farmers', 4500.0, 'State Govt', '2026-04-01', '2026-09-30', 'AC'),
(3, 'Solar Pump Setup Subsidy', 'CapitalSubsidy', 'Irrigated landholding', 45000.0, 'Central & State', '2026-02-01', '2026-12-31', 'AC');

INSERT INTO subsidy_application (applicationId, farmerId, schemeId, applicationDate, eligibilityScore, reviewedBy, disbursedAmount, disbursedDate, status) VALUES
(1, 1, 1, '2026-01-10', 95.0, 4, 6000.0, '2026-01-15', 'AP'),
(2, 2, 1, '2026-02-02', 88.0, 4, 6000.0, '2026-02-10', 'AP'),
(3, 1, 2, '2026-04-10', 92.0, 4, 4500.0, '2026-04-18', 'AP'),
(4, 2, 3, '2026-05-20', 75.0, 4, 45000.0, '2026-06-05', 'AP'),
(5, 1, 3, '2026-07-02', 82.0, 4, 0.0, NULL, 'PE');

-- =====================================================================
-- 6) agrilink_produce
-- =====================================================================
USE agrilink_produce;

DELETE FROM produce_sale;
DELETE FROM produce_listing;

INSERT INTO produce_listing (listingId, farmerId, cropId, harvestDate, quantityKg, qualityGrade, askingPricePerKg, status) VALUES
(1, 1, 1, '2026-01-05', 2500.0, 'A', 25.0, 'SO'),
(2, 2, 2, '2026-03-10', 1800.0, 'A', 22.0, 'SO'),
(3, 1, 3, '2026-06-15', 1200.0, 'A', 55.0, 'AV'),
(4, 2, 1, '2026-07-01', 3000.0, 'B', 20.0, 'AV');

INSERT INTO produce_sale (saleId, listingId, buyerId, quantitySoldKg, agreedPricePerKg, totalAmount, saleDate, paymentStatus) VALUES
(1, 1, 3, 1500.0, 24.5, 36750.0, '2026-01-12', 'PD'),
(2, 1, 3, 1000.0, 24.0, 24000.0, '2026-01-18', 'PD'),
(3, 2, 3, 1800.0, 21.8, 39240.0, '2026-03-20', 'PD'),
(4, 3, 3, 500.0, 54.0, 27000.0, '2026-06-25', 'PE');

-- =====================================================================
-- 7) agrilink_report
-- =====================================================================
USE agrilink_report;

DELETE FROM agri_report;

INSERT INTO agri_report (reportId, generatedBy, generatedDate, metrics, scope) VALUES
(1, 4, '2026-03-31', 'RegisteredFarmers=25,ActivePlans=18,DisbursedSubsidies=₹96750', 'District'),
(2, 4, '2026-06-30', 'CottonYieldAcre=11.8,PaddyYieldAcre=23.2', 'State'),
(3, 4, '2026-07-20', 'InputDemands=Urea:20Bags,NPK:4Bags', 'District');

-- =====================================================================
-- 8) agrilink_notification
-- =====================================================================
USE agrilink_notification;

DELETE FROM notification;

INSERT INTO notification (notificationId, userId, message, category, status, createdDate) VALUES
(1, 1, 'Reminder: Submit your PM-KISAN renewal form by end of the month.', 'SubsidyAlert', 'UN', '2026-01-05'),
(2, 1, 'Advisory: Pest warning issued for Cotton in Krishnagiri district. Spray Neem oil.', 'CropAdvisory', 'UN', '2026-05-22'),
(3, 2, 'Input Request #3 for Urea Fertilizer has been APPROVED.', 'InputAlert', 'RD', '2026-03-06'),
(4, 1, 'System Notification: Scheduled maintenance of the portal tonight between 12:00 AM - 02:00 AM.', 'SystemAlert', 'RD', '2026-07-25');
