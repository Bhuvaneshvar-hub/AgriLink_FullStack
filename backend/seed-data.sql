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

-- Shared password for every seeded user below (same convention as DataSeeder.java): Agrilink@123
-- Users 6-9 are Farmer-role logins for the farmer_profile rows further down (Chitra/Devaraj/Eswari/Ganesan).
INSERT INTO user_details (userId, regionId, roleId, phone, email, name, passwordHash, status, createdAt) VALUES
(1, 1, 1, '0000000000', 'admin@agrilink.com', 'System Administrator', '$2a$10$rzlJ5oKFnj1fMDZJGMAm2emZbr5dcND8Hc63faXvEoXwGpzci4I8e', 'A', NOW()),
(2, 1, 1, '9876543210', 'asha@example.com', 'Asha Devi', '$2a$10$rzlJ5oKFnj1fMDZJGMAm2emZbr5dcND8Hc63faXvEoXwGpzci4I8e', 'A', NOW()),
(3, 1, 1, '8765432109', 'babu@example.com', 'Babu Lal', '$2a$10$rzlJ5oKFnj1fMDZJGMAm2emZbr5dcND8Hc63faXvEoXwGpzci4I8e', 'A', NOW()),
(4, 2, 3, '7654321098', 'chandra@example.com', 'Chandra Kumar', '$2a$10$rzlJ5oKFnj1fMDZJGMAm2emZbr5dcND8Hc63faXvEoXwGpzci4I8e', 'A', NOW()),
(5, 1, 2, '6543210987', 'divya@example.com', 'Divya Raj', '$2a$10$rzlJ5oKFnj1fMDZJGMAm2emZbr5dcND8Hc63faXvEoXwGpzci4I8e', 'A', NOW()),
(6, 1, 6, '9543210876', 'chitra@example.com', 'Chitra Murugan', '$2a$10$rzlJ5oKFnj1fMDZJGMAm2emZbr5dcND8Hc63faXvEoXwGpzci4I8e', 'A', NOW()),
(7, 1, 6, '9432108765', 'devaraj@example.com', 'Devaraj Pillai', '$2a$10$rzlJ5oKFnj1fMDZJGMAm2emZbr5dcND8Hc63faXvEoXwGpzci4I8e', 'A', NOW()),
(8, 1, 6, '9321087654', 'eswari@example.com', 'Eswari Nadar', '$2a$10$rzlJ5oKFnj1fMDZJGMAm2emZbr5dcND8Hc63faXvEoXwGpzci4I8e', 'A', NOW()),
(9, 1, 6, '9210876543', 'ganesan@example.com', 'Ganesan Rao', '$2a$10$rzlJ5oKFnj1fMDZJGMAm2emZbr5dcND8Hc63faXvEoXwGpzci4I8e', 'A', NOW());

-- =====================================================================
-- 2) agrilink_farmer
-- =====================================================================
USE agrilink_farmer;

DELETE FROM land_holding;
DELETE FROM farmer_profile;

INSERT INTO farmer_profile (farmerId, userId, name, dateOfBirth, gender, nationalIdNumber, village, district, state, phone, bankAccountNumber, status) VALUES
(1, 2, 'Asha Devi', '1988-04-12', 'Female', 'ID-908123', 'Hosur', 'Krishnagiri', 'Tamil Nadu', '9876543210', 'SBI-009823412', 'AC'),
(2, 3, 'Babu Lal', '1982-08-25', 'Male', 'ID-702315', 'Shoolagiri', 'Krishnagiri', 'Tamil Nadu', '8765432109', 'HDFC-441209831', 'AC'),
(3, 6, 'Chitra Murugan', '1990-11-03', 'Female', 'ID-556201', 'Denkanikottai', 'Krishnagiri', 'Tamil Nadu', '9543210876', 'ICICI-778120934', 'AC'),
(4, 7, 'Devaraj Pillai', '1979-02-17', 'Male', 'ID-334789', 'Bargur', 'Krishnagiri', 'Tamil Nadu', '9432108765', 'AXIS-330912845', 'AC'),
(5, 8, 'Eswari Nadar', '1993-07-29', 'Female', 'ID-661204', 'Uthangarai', 'Krishnagiri', 'Tamil Nadu', '9321087654', 'SBI-118273645', 'AC'),
(6, 9, 'Ganesan Rao', '1985-05-09', 'Male', 'ID-889341', 'Pochampalli', 'Krishnagiri', 'Tamil Nadu', '9210876543', 'HDFC-556738291', 'IN');

INSERT INTO land_holding (holdingId, farmerId, surveyNumber, areaAcres, soilType, irrigationSource, ownershipType, status) VALUES
(1, 1, 'SVY-101A', 4.2, 'Loam', 'Borewell', 'Owned', 'AC'),
(2, 1, 'SVY-101B', 2.5, 'Clay', 'Rainfed', 'Leased', 'AC'),
(3, 2, 'SVY-205C', 5.0, 'Sandy', 'Canal', 'Owned', 'AC'),
(4, 2, 'SVY-205D', 3.1, 'Loam', 'Borewell', 'Owned', 'AC'),
(5, 3, 'SVY-312E', 6.4, 'Black', 'Canal', 'Owned', 'AC'),
(6, 4, 'SVY-418F', 2.8, 'Red', 'Rainfed', 'Leased', 'AC'),
(7, 4, 'SVY-418G', 4.9, 'Loam', 'Borewell', 'Owned', 'AC'),
(8, 5, 'SVY-527H', 3.7, 'Sandy', 'Drip', 'Owned', 'AC'),
(9, 6, 'SVY-633J', 5.5, 'Clay', 'Canal', 'Leased', 'AC');

DELETE FROM crop_history;

INSERT INTO crop_history (historyId, holdingId, farmerId, cropName, season, cropYear, areaAcres, yieldQuintals, remarks) VALUES
(1, 1, 1, 'Paddy', 'Kharif', 2024, 4.2, 92.5, 'Good monsoon; healthy yield.'),
(2, 1, 1, 'Groundnut', 'Rabi', 2025, 4.2, 38.0, 'Rotated to restore soil nitrogen.'),
(3, 3, 2, 'Sugarcane', 'Perennial', 2024, 5.0, 210.0, 'Canal irrigation supported strong growth.'),
(4, 5, 3, 'Cotton', 'Kharif', 2024, 6.4, 47.5, 'Minor pink bollworm incidence controlled.'),
(5, 8, 5, 'Tomato', 'Zaid', 2025, 3.7, 120.0, 'Drip irrigation improved fruit quality.');

-- =====================================================================
-- 3) agrilink_crop
-- =====================================================================
USE agrilink_crop;

DELETE FROM growth_observation;
DELETE FROM crop_plan;
DELETE FROM crop_catalog;

INSERT INTO crop_catalog (cropId, cropName, category, season, typicalDurationDays, expectedYieldPerAcre, status) VALUES
(1, 'Rice', 'Cereal', 'Kharif', 120, 24.0, 'AC'),
(2, 'Wheat', 'Cereal', 'Rabi', 110, 18.5, 'AC'),
(3, 'Cotton', 'Fibre', 'Kharif', 180, 12.0, 'AC'),
(4, 'Groundnut', 'Oilseed', 'Rabi', 105, 15.0, 'AC'),
(5, 'Maize', 'Cereal', 'Kharif', 100, 20.0, 'AC'),
(6, 'Sugarcane', 'Cash Crop', 'Perennial', 365, 40.0, 'AC'),
(7, 'Soybean', 'Oilseed', 'Kharif', 95, 13.0, 'AC'),
(8, 'Chickpea', 'Pulse', 'Rabi', 100, 9.0, 'AC'),
(9, 'Tomato', 'Vegetable', 'Zaid', 90, 30.0, 'AC'),
(10, 'Mustard', 'Oilseed', 'Rabi', 110, 11.0, 'IN');

INSERT INTO crop_plan (planId, farmerId, holdingId, cropId, season, year, sowingDate, expectedHarvestDate, areaPlanted, status) VALUES
(1, 1, 1, 1, 'Kharif', 2026, '2026-06-01', '2026-10-01', 4.0, 'GROWING'),
(2, 1, 2, 3, 'Kharif', 2026, '2026-05-15', '2026-11-15', 2.0, 'GROWING'),
(3, 2, 3, 2, 'Rabi', 2026, '2026-11-01', '2027-02-20', 5.0, 'PLANNED'),
(4, 2, 4, 4, 'Rabi', 2025, '2025-10-20', '2026-02-05', 3.0, 'HARVESTED'),
(5, 3, 5, 5, 'Kharif', 2026, '2026-06-10', '2026-09-20', 6.0, 'GROWING'),
(6, 3, 5, 6, 'Perennial', 2026, '2026-03-01', '2027-03-01', 5.5, 'GROWING'),
(7, 4, 6, 7, 'Kharif', 2026, '2026-06-25', '2026-09-28', 2.5, 'SOWING'),
(8, 4, 7, 3, 'Kharif', 2025, '2025-05-18', '2025-11-18', 4.5, 'HARVESTED'),
(9, 5, 8, 9, 'Zaid', 2026, '2026-03-15', '2026-06-13', 3.5, 'GROWING'),
(10, 5, 8, 8, 'Rabi', 2026, '2026-11-10', '2027-02-18', 3.0, 'PLANNED'),
(11, 1, 1, 5, 'Kharif', 2025, '2025-06-05', '2025-09-13', 4.0, 'FAILED'),
(12, 6, 9, 2, 'Rabi', 2026, '2026-11-05', '2027-02-25', 5.5, 'PLANNED'),
(13, 2, 3, 1, 'Kharif', 2025, '2025-06-02', '2025-10-02', 5.0, 'HARVESTED');

INSERT INTO growth_observation (observationId, planId, officerId, observationDate, stage, pestOrDiseaseFlag, remarks) VALUES
(1, 1, 4, '2026-06-15', 'GERMINATION', 0, 'Seedlings emerged uniformly. Field is healthy.'),
(2, 1, 4, '2026-07-05', 'VEGETATIVE', 0, 'Vegetative growth strong; good tillering.'),
(3, 2, 4, '2026-06-20', 'GERMINATION', 0, 'Germination observed across the plot.'),
(4, 2, 5, '2026-07-18', 'VEGETATIVE', 1, 'Early aphid presence noticed on cotton leaves; advised neem spray.'),
(5, 4, 4, '2025-11-12', 'GERMINATION', 0, 'Groundnut germination uniform.'),
(6, 4, 4, '2025-12-08', 'VEGETATIVE', 0, 'Vegetative canopy developing well.'),
(7, 4, 4, '2026-01-05', 'FLOWERING', 0, 'Flowering phase reached; good pegging expected.'),
(8, 4, 4, '2026-02-01', 'MATURITY', 0, 'Pods mature; crop ready for harvest.'),
(9, 5, 5, '2026-06-25', 'GERMINATION', 0, 'Maize sprouts emerged evenly.'),
(10, 5, 5, '2026-07-20', 'VEGETATIVE', 0, 'Strong vegetative growth, knee-high stage.'),
(11, 6, 4, '2026-04-10', 'GERMINATION', 0, 'Sugarcane setts sprouted.'),
(12, 6, 4, '2026-06-15', 'VEGETATIVE', 1, 'Minor borer damage on a few canes; monitoring.'),
(13, 8, 5, '2025-06-10', 'GERMINATION', 0, 'Cotton germination good.'),
(14, 8, 5, '2025-08-01', 'VEGETATIVE', 0, 'Healthy vegetative growth.'),
(15, 8, 5, '2025-09-15', 'FLOWERING', 0, 'Bolls forming; flowering strong.'),
(16, 8, 5, '2025-11-10', 'MATURITY', 0, 'Bolls opened; harvest completed.'),
(17, 9, 4, '2026-03-25', 'GERMINATION', 0, 'Tomato seedlings transplanted and established.'),
(18, 9, 4, '2026-04-28', 'VEGETATIVE', 1, 'Leaf curl virus symptoms on a few plants; roguing advised.'),
(19, 13, 4, '2025-06-15', 'GERMINATION', 0, 'Paddy nursery transplanted; uniform stand.'),
(20, 13, 4, '2025-08-20', 'FLOWERING', 0, 'Panicle initiation and flowering observed.'),
(21, 13, 4, '2025-09-25', 'MATURITY', 0, 'Grains filled and mature; harvested.');

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
(1, 1, 1, '2026-01-06', 2500.0, 'A', 25.0, 'SO'),
(2, 2, 2, '2026-01-18', 1800.0, 'A', 22.0, 'SO'),
(3, 1, 3, '2026-01-30', 1200.0, 'A', 55.0, 'PB'),
(4, 2, 1, '2026-02-11', 3000.0, 'B', 20.0, 'AV'),
(5, 1, 2, '2026-02-23', 900.0, 'A', 30.0, 'AV'),
(6, 2, 3, '2026-03-07', 1500.0, 'B', 48.0, 'AV'),
(7, 1, 1, '2026-03-19', 2100.0, 'C', 18.0, 'AV'),
(8, 2, 2, '2026-03-31', 750.0, 'A', 26.0, 'WD'),
(9, 1, 3, '2026-04-12', 1350.0, 'B', 52.0, 'AV'),
(10, 2, 1, '2026-04-24', 2800.0, 'A', 24.0, 'AV'),
(11, 1, 2, '2026-05-06', 640.0, 'B', 28.0, 'AV'),
(12, 2, 3, '2026-05-18', 1900.0, 'A', 60.0, 'AV');

INSERT INTO produce_sale (saleId, listingId, buyerId, quantitySoldKg, agreedPricePerKg, totalAmount, saleDate, paymentStatus) VALUES
(1, 1, 3, 1500.0, 24.5, 36750.0, '2026-01-12', 'PD'),
(2, 1, 3, 1000.0, 24.0, 24000.0, '2026-01-18', 'PD'),
(3, 2, 3, 1800.0, 21.8, 39240.0, '2026-03-20', 'PD'),
(4, 3, 3, 500.0, 54.0, 27000.0, '2026-06-25', 'PE'),
(5, 4, 4, 1200.0, 19.5, 23400.0, '2026-07-02', 'PE'),
(6, 6, 4, 800.0, 47.0, 37600.0, '2026-07-08', 'OV'),
(7, 7, 3, 2000.0, 17.5, 35000.0, '2026-07-15', 'PD'),
(8, 10, 4, 1000.0, 23.5, 23500.0, '2026-07-20', 'OV');

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
(1, 1, 'Reminder: Submit your PM-KISAN renewal form by end of the month.', 'Subsidy', 'UN', '2026-01-05'),
(2, 1, 'Advisory: Pest warning issued for Cotton in Krishnagiri district. Spray Neem oil.', 'CropAdvisory', 'UN', '2026-05-22'),
(3, 2, 'Input Request #3 for Urea Fertilizer has been APPROVED.', 'InputProcurement', 'RD', '2026-03-06'),
(4, 1, 'System Notification: Scheduled maintenance of the portal tonight between 12:00 AM - 02:00 AM.', 'Compliance', 'RD', '2026-07-25');
