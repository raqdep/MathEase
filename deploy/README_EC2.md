# MathEase EC2 Deployment

Your app is deployed at:

- **By IP:** http://54.206.4.117/
- **By domain (HTTPS):** https://mathease.shop / https://www.mathease.shop

## Server access

```bash
ssh -i "C:\xampp\htdocs\MathEase_Key.pem" ubuntu@54.206.4.117
```

## Database (MariaDB on EC2)

- **Host:** localhost  
- **Database:** mathease_database3  
- **User:** mathease  
- **Password:** MathEase_EC2_2025  

Credentials are in `/var/www/MathEase/.env` on the server. Change the password in production and update `.env` and MariaDB user accordingly.

## Deploy path

- **App root:** `/var/www/MathEase`
- **Web user:** www-data

## Update app from GitHub

On the server:

```bash
sudo -u www-data bash -c 'cd /var/www/MathEase && git pull origin master'
```

Or from your PC (then pull on server), or re-run the clone step to a new folder and switch Apache DocumentRoot.

## Apache

- **Configs:** `/etc/apache2/sites-enabled/`
- **Reload:** `sudo systemctl reload apache2`
- **Logs:** `/var/log/apache2/`
