-- =====================================================================
-- Sample data for the Produce Sales & Market Linkage module (2.6)
-- Run:  & "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -uroot -proot -e "source .../backend/seed-produce.sql"
-- Idempotent: clears the two produce tables first, then re-inserts.
--
-- farmerId 1 (Arjun) & 2 exist for the admin/procurement (unscoped) view.
-- farmerId 6 (bala, userId 10) & 16 (yogapriya, userId 13) are the real
-- login-linked farmers, so those accounts see their own listings/sales.
-- =====================================================================
USE agrilink_produce;

DELETE FROM produce_sale;
DELETE FROM produce_listing;

-- Listings across all statuses: AV=Available, PB=PartiallyBooked, SO=Sold, WD=Withdrawn
INSERT INTO produce_listing (listingId, farmerId, cropId, harvestDate, quantityKg, qualityGrade, askingPricePerKg, status) VALUES
(1, 1, 1, '2026-01-06', 2500.0, 'A', 25.0, 'SO'),
(2, 2, 2, '2026-01-18', 1800.0, 'A', 22.0, 'SO'),
(3, 1, 3, '2026-01-30', 1200.0, 'A', 55.0, 'PB'),
(4, 2, 1, '2026-02-11', 3000.0, 'B', 20.0, 'AV'),
(5, 1, 2, '2026-02-23', 900.0, 'A', 30.0, 'AV'),
(6, 2, 3, '2026-03-07', 1500.0, 'B', 48.0, 'AV'),
(7, 1, 1, '2026-03-19', 2100.0, 'C', 18.0, 'AV'),
(8, 2, 2, '2026-03-31', 750.0, 'A', 26.0, 'WD'),
-- bala (farmerId 6)
(13, 6, 1, '2026-02-05', 2200.0, 'A', 26.0, 'SO'),
(14, 6, 2, '2026-02-17', 1400.0, 'B', 21.0, 'PB'),
(15, 6, 3, '2026-03-01', 1000.0, 'A', 58.0, 'AV'),
(16, 6, 1, '2026-03-13', 1750.0, 'C', 17.5, 'WD'),
-- yogapriya (farmerId 16)
(17, 16, 2, '2026-02-09', 2600.0, 'A', 27.0, 'SO'),
(18, 16, 3, '2026-02-21', 1150.0, 'B', 50.0, 'PB'),
(19, 16, 1, '2026-03-05', 3200.0, 'A', 23.0, 'AV'),
(20, 16, 2, '2026-03-17', 820.0, 'A', 29.0, 'AV');

-- Sales across all payment statuses: PD=Paid, PE=Pending, OV=Overdue
INSERT INTO produce_sale (saleId, listingId, buyerId, quantitySoldKg, agreedPricePerKg, totalAmount, saleDate, paymentStatus) VALUES
(1, 1, 4, 1500.0, 24.5, 36750.0, '2026-01-12', 'PD'),
(2, 1, 4, 1000.0, 24.0, 24000.0, '2026-01-18', 'PD'),
(3, 2, 4, 1800.0, 21.8, 39240.0, '2026-03-20', 'PD'),
(4, 3, 4, 500.0, 54.0, 27000.0, '2026-06-25', 'PE'),
-- bala's sales
(9, 13, 4, 1200.0, 26.0, 31200.0, '2026-02-10', 'PD'),
(10, 13, 4, 1000.0, 25.5, 25500.0, '2026-02-14', 'PD'),
(11, 14, 4, 600.0, 21.0, 12600.0, '2026-02-25', 'PE'),
-- yogapriya's sales
(12, 17, 4, 2600.0, 27.0, 70200.0, '2026-02-15', 'PD'),
(13, 18, 4, 500.0, 50.0, 25000.0, '2026-02-27', 'OV');

SELECT 'produce_listing' AS tbl, COUNT(*) AS rows_now FROM produce_listing
UNION ALL
SELECT 'produce_sale', COUNT(*) FROM produce_sale;
