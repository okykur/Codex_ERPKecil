-- Run from a maintenance database such as postgres:
-- psql -U postgres -d postgres -f database/init/000_create_database.sql
SELECT 'CREATE DATABASE erplittle'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'erplittle')\gexec

-- Supply password with: psql -v erp_app_password='strong-password' ...
SELECT format('CREATE USER erp_app WITH PASSWORD %L', :'erp_app_password')
WHERE NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'erp_app')\gexec

GRANT ALL PRIVILEGES ON DATABASE erplittle TO erp_app;
