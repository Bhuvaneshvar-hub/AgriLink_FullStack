-- =====================================================================
-- Fix legacy Notification rows whose `category` predates the
-- NotificationCategory enum (CropAdvisory / Subsidy / InputProcurement /
-- ProduceSale / Compliance). An invalid value (e.g. the old 'General')
-- makes Hibernate fail when reading the list, which 500s GET /notifications
-- ("Failed to load system notifications").
--
-- Run:  & "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -uroot -proot -e "source .../backend/fix-notification-categories.sql"
-- =====================================================================
USE agrilink_notification;

-- Map any out-of-enum category to the generic 'Compliance' bucket.
UPDATE notification
SET category = 'Compliance'
WHERE category NOT IN ('CropAdvisory', 'Subsidy', 'InputProcurement', 'ProduceSale', 'Compliance');

-- Verify: this should return zero rows.
SELECT notificationId, category, status
FROM notification
WHERE category NOT IN ('CropAdvisory', 'Subsidy', 'InputProcurement', 'ProduceSale', 'Compliance');
