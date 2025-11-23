-- PostgreSQL init script for local development
-- This file helps teammates create a database and user quickly.
-- Schema creation is handled by Django migrations.

-- Adjust names and passwords before running.

-- Example: create role (user)
-- CREATE ROLE app_user WITH LOGIN PASSWORD 'change_this_password';

-- Example: create database owned by role
-- CREATE DATABASE app_db OWNER app_user ENCODING 'UTF8' TEMPLATE template1;

-- Example: basic privileges (optional)
-- GRANT ALL PRIVILEGES ON DATABASE app_db TO app_user;

-- To apply schema, run in project directory:
--   1) Set backend-python/.env with DB_NAME=app_db, DB_USER=app_user, DB_PASSWORD=...
--   2) python manage.py migrate

-- If you prefer raw SQL schema, generate it with:
--   python manage.py sqlmigrate products 0003 > products_0003.sql
--   python manage.py sqlmigrate orders 0004 > orders_0004.sql
--   python manage.py sqlmigrate system 0001 > system_0001.sql
-- And load them in order after creating the database.