-- =====================================================================
-- Sample data for Agri-Input (2.4) and Subsidy (2.5) modules.
-- Tied to the real login-linked farmers so their portals aren't empty:
--   bala      -> farmerId 6,  userId 10
--   yogapriya -> farmerId 16, userId 13
-- Run: mysql -uroot -proot < seed-input-subsidy.sql
-- =====================================================================

-- ---------- Agri-Input ----------
USE agrilink_input;
DELETE FROM request;
DELETE FROM catalog;

INSERT INTO catalog (inputId, name, category, unit, pricePerUnit, subsidisedPrice, availableStock, status) VALUES
(1, 'Urea Fertilizer',       'Fertilizer', 'Bag',    450.0,  280.0,  450, 'AC'),
(2, 'NPK 19:19:19 Complex',  'Fertilizer', 'Bag',    900.0,  600.0,  300, 'AC'),
(3, 'Bt Cotton Seed Pack',   'Seeds',      'Pack',   850.0,  450.0,  120, 'AC'),
(4, 'Organic Compost',       'Fertilizer', 'Tonne', 3000.0, 1800.0,   40, 'AC'),
(5, 'Hybrid Maize Seed',     'Seeds',      'Pack',   600.0,  350.0,  200, 'AC'),
(6, 'Neem Pesticide',        'Pesticide',  'Litre',  500.0,  300.0,  150, 'AC');

INSERT INTO request (requestId, farmerId, inputId, quantityRequested, requestDate, assignedCentreId, actualPrice, status) VALUES
(1,  6, 1,  8, '2026-01-15', 1, 2240.0, 'DL'),
(2,  6, 2,  4, '2026-02-18', 1, 2400.0, 'AP'),
(3,  6, 3,  5, '2026-05-10', 1, 2250.0, 'PE'),
(4, 16, 1, 12, '2026-03-05', 2, 3360.0, 'DL'),
(5, 16, 4,  2, '2026-06-25', 2, 3600.0, 'AP'),
(6, 16, 5,  3, '2026-07-12', 1, 1050.0, 'PE');

-- ---------- Subsidy & Scheme ----------
USE agrilink_subsidy;
DELETE FROM subsidy_application;
DELETE FROM scheme_catalog;

INSERT INTO scheme_catalog (schemeId, schemeName, category, eligibilityCriteria, benefitAmount, fundingSource, startDate, endDate, status, createdAt) VALUES
(1, 'PM-KISAN Cash Support',    'WelfareSupport', 'Landholding < 5 acres',    6000.0,  'Central Govt',    '2026-01-01', '2026-12-31', 'AC', NOW()),
(2, 'Kharif Fertilizer Rebate', 'InputSubsidy',   'Registered small farmers', 4500.0,  'State Govt',      '2026-04-01', '2026-09-30', 'AC', NOW()),
(3, 'Drip Irrigation Grant',    'EquipmentGrant', 'Irrigated landholding',   45000.0,  'Central & State', '2026-02-01', '2026-12-31', 'AC', NOW());

INSERT INTO subsidy_application (applicationId, farmerId, userId, schemeId, applicationDate, eligibilityScore, reviewedBy, disbursedAmount, disbursedDate, status, createdAt) VALUES
(1,  6, 10, 1, '2026-01-10', 95.0,    5, 6000.0, '2026-01-15', 'AP', NOW()),
(2,  6, 10, 2, '2026-04-10', 90.0, NULL,    0.0, NULL,         'PE', NOW()),
(3, 16, 13, 1, '2026-02-02', 88.0,    5, 6000.0, '2026-02-10', 'AP', NOW()),
(4, 16, 13, 3, '2026-05-20', 70.0,    5,    0.0, NULL,         'RE', NOW()),
(5, 16, 13, 2, '2026-07-02', 82.0, NULL,    0.0, NULL,         'PE', NOW());

SELECT 'catalog' AS tbl, COUNT(*) AS n FROM agrilink_input.catalog
UNION ALL SELECT 'request', COUNT(*) FROM agrilink_input.request
UNION ALL SELECT 'scheme_catalog', COUNT(*) FROM agrilink_subsidy.scheme_catalog
UNION ALL SELECT 'subsidy_application', COUNT(*) FROM agrilink_subsidy.subsidy_application;
