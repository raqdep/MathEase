# MathEase EC2 Deployment

Your app is deployed at:

- **By IP:** http://54.206.4.117/
- **By domain (HTTPS):** https://mathease.shop / https://www.mathease.shop

## Server access

Use your SSH key and server user (e.g. `ubuntu@YOUR_SERVER_IP`). Do not commit private keys or passwords to the repo.

## Database (MariaDB on EC2)

Use the values in `/var/www/MathEase/.env` on the server (see `deploy/.env.example`). Rotate passwords in production; never store real credentials in this README.

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
