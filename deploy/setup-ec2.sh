#!/bin/bash
# MathEase EC2 one-time setup
# Run on Ubuntu EC2: bash setup-ec2.sh
# Requires: sudo

set -e
REPO_URL="https://github.com/raqdep/MathEase.git"
WEB_ROOT="/var/www/MathEase"

echo "==> Installing Apache, PHP, MariaDB (optional), Git..."
sudo apt-get update
sudo apt-get install -y apache2 php php-mysql php-mbstring php-xml php-curl php-json php-gd mariadb-server git unzip

echo "==> Enabling Apache modules..."
sudo a2enmod rewrite
sudo a2enmod headers

echo "==> Cloning MathEase from GitHub..."
sudo mkdir -p /var/www
if [ -d "$WEB_ROOT" ]; then
  echo "    $WEB_ROOT exists; pulling latest..."
  sudo -u www-data bash -c "cd $WEB_ROOT && git fetch origin && git reset --hard origin/master"
else
  sudo git clone "$REPO_URL" "$WEB_ROOT"
  sudo chown -R www-data:www-data "$WEB_ROOT"
fi

echo "==> Creating .env from example (edit with your credentials)..."
if [ ! -f "$WEB_ROOT/.env" ]; then
  sudo cp "$WEB_ROOT/deploy/.env.example" "$WEB_ROOT/.env"
  sudo chown www-data:www-data "$WEB_ROOT/.env"
  sudo chmod 640 "$WEB_ROOT/.env"
  echo "    Edit: sudo nano $WEB_ROOT/.env"
else
  echo "    .env already exists; skipping."
fi

echo "==> Creating uploads directory..."
sudo mkdir -p "$WEB_ROOT/uploads/profiles"
sudo touch "$WEB_ROOT/uploads/profiles/.gitkeep"
sudo chown -R www-data:www-data "$WEB_ROOT/uploads"

echo "==> Configuring Apache DocumentRoot..."
CONF="/etc/apache2/sites-available/mathease.conf"
if [ ! -f "$CONF" ]; then
  sudo tee "$CONF" << APACHE
<VirtualHost *:80>
    ServerAdmin webmaster@localhost
    DocumentRoot $WEB_ROOT
    <Directory $WEB_ROOT>
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>
    ErrorLog \${APACHE_LOG_DIR}/mathease_error.log
    CustomLog \${APACHE_LOG_DIR}/mathease_access.log combined
</VirtualHost>
APACHE
  sudo a2ensite mathease.conf
  sudo a2dissite 000-default.conf 2>/dev/null || true
fi

echo "==> Reloading Apache..."
sudo systemctl reload apache2

echo ""
echo "=== Next steps ==="
echo "1. .env was copied from deploy/.env.example (original RDS: admin / mathease_database3)."
echo "2. Edit .env if needed: sudo nano $WEB_ROOT/.env  (MAIL_*, optional GROQ_API_KEY)"
echo "3. Open in browser: http://$(curl -s ifconfig.me 2>/dev/null || echo 'YOUR_EC2_IP')/"
echo "   (If using MariaDB on EC2 instead of RDS, create DB/user and import schema; set DB_HOST=localhost in .env)"
echo ""
