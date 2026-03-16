CREATE DATABASE IF NOT EXISTS mathease_database3;
CREATE USER IF NOT EXISTS 'mathease'@'localhost' IDENTIFIED BY 'MathEase_EC2_2025';
GRANT ALL PRIVILEGES ON mathease_database3.* TO 'mathease'@'localhost';
FLUSH PRIVILEGES;
