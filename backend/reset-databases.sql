-- =====================================================================
-- AgriLink — reset service databases so Hibernate recreates the schema
-- with the new camelCase columns.
--
-- WHY: columns were renamed snake_case -> camelCase. With
-- spring.jpa.hibernate.ddl-auto=update, Hibernate ADDS the new camelCase
-- columns but CANNOT rename the primary-key auto_increment column
-- (MySQL: "there can be only one auto column"), leaving tables in a
-- half-migrated state (e.g. "Unknown column 'schemeId'"). Dropping the
-- DBs lets each service recreate a correct schema on next startup,
-- because every service uses ...?createDatabaseIfNotExist=true.
--
-- WARNING: this DELETES all data in these dev databases. The IAM admin
-- user and roles are re-seeded automatically on startup.
--
-- HOW TO RUN (any one):
--   mysql -u root -p < reset-databases.sql
--   -- or paste into MySQL Workbench and execute
--
-- If you only hit the error on subsidy, you can run just that one line.
-- =====================================================================

DROP DATABASE IF EXISTS agrilink_subsidy;

-- The same rename affects every service whose tables already existed with
-- snake_case columns. Drop these too to avoid the identical error later:
DROP DATABASE IF EXISTS agrilink_farmer;
DROP DATABASE IF EXISTS agrilink_crop;
DROP DATABASE IF EXISTS agrilink_input;
DROP DATABASE IF EXISTS agrilink_produce;
DROP DATABASE IF EXISTS agrilink_report;
DROP DATABASE IF EXISTS agrilink_notification;
-- iam uses ddl-auto=create (recreated every start), so it does NOT need this,
-- but dropping is harmless if you want a fully clean slate:
-- DROP DATABASE IF EXISTS agrilink_iam;
