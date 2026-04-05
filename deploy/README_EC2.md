# MathEase EC2 Deployment

Your app is deployed at:

- **By IP:** http://54.206.4.117/
- **By domain (HTTPS):** https://mathease.shop / https://www.mathease.shop

## Server access

```bash
ssh -i "C:\xampp\htdocs\MathEase_Key.pem" ubuntu@54.206.4.117
```

## Database (AWS RDS)

Set **`DB_HOST`**, **`DB_USER`**, **`DB_PASS`**, and **`DB_NAME`** in `/var/www/MathEase/.env` on the server (see `deploy/.env.example`). Do not commit real credentials to Git.

Ensure the RDS security group allows inbound **MySQL/Aurora (3306)** from this EC2 instance’s security group (or private IP), and that PHP/Apache runs as **`www-data`** so it can read `.env` (typically `chmod 640`, owner `www-data` or root with group `www-data`).

## Deploy path

- **App root:** `/var/www/MathEase`
- **Web user:** www-data

## Update app from GitHub

On the server:

```bash
sudo -u www-data bash -c 'cd /var/www/MathEase && git pull origin main'
```

Or from your PC (then pull on server), or re-run the clone step to a new folder and switch Apache DocumentRoot.

## Apache

- **Configs:** `/etc/apache2/sites-enabled/`
- **Reload:** `sudo systemctl reload apache2`
- **Logs:** `/var/log/apache2/`
