# Deploy MathEase to EC2

Use this guide to deploy (or update) MathEase on your EC2 instance.

**EC2:** `54.206.4.117`  
**SSH:** `ssh -i "C:\xampp\htdocs\MathEase_Key.pem" ubuntu@54.206.4.117`

---

## Option A: First-time deploy (new server)

### 1. Connect to EC2

From **PowerShell** (Windows):

```powershell
ssh -i "C:\xampp\htdocs\MathEase_Key.pem" ubuntu@54.206.4.117
```

### 2. Run the setup script on the server

If you have the repo cloned and the script there:

```bash
cd /var/www/MathEase
sudo bash deploy/setup-ec2.sh
```

If the server is empty, copy the script first. From your **PC** (PowerShell):

```powershell
scp -i "C:\xampp\htdocs\MathEase_Key.pem" "C:\xampp\htdocs\ep67\MathEase\deploy\setup-ec2.sh" ubuntu@54.206.4.117:~/
```

Then on the **server**:

```bash
# Clone repo first so deploy folder exists
sudo git clone https://github.com/raqdep/MathEase.git /var/www/MathEase
sudo chown -R www-data:www-data /var/www/MathEase
# Copy updated deploy files if you just scp'd them
sudo bash /var/www/MathEase/deploy/setup-ec2.sh
```

### 3. Database (AWS RDS)

The app reads **database settings from `.env`** (see `php/config.php`). Your RDS instance:

- **Host:** `mathtry-db.c9aqi8mg6z1y.ap-southeast-2.rds.amazonaws.com`
- **User:** `admin`
- **Database:** `mathease_database3`

**Security group:** RDS must allow inbound **MySQL (3306)** from your EC2 instance’s security group (or its private IP). EC2 does not need a public rule on RDS if both are in the same VPC.

No MySQL install on EC2 is required for RDS — import or migrate schema into RDS if the database is new (see `database/` SQL files).

*If you prefer MariaDB on EC2 instead,* create DB/user and import schema:

```bash
sudo mysql -e "CREATE DATABASE IF NOT EXISTS mathease_database3; CREATE USER IF NOT EXISTS 'mathease'@'localhost' IDENTIFIED BY 'YOUR_PASSWORD'; GRANT ALL ON mathease_database3.* TO 'mathease'@'localhost'; FLUSH PRIVILEGES;"
sudo mysql mathease_database3 < /var/www/MathEase/database/mathease_db_complete.sql
```
Then set `DB_HOST=localhost`, `DB_USER=mathease`, `DB_PASS=...` in `.env`.

### 4. Configure .env

```bash
sudo nano /var/www/MathEase/.env
```

Deploy copies `.env` from `deploy/.env.example`, which already has your **original RDS** defaults. Set at least:

- `DB_HOST`, `DB_USER`, `DB_PASS`, `DB_NAME` (RDS values are pre-filled)
- `MAIL_*` for OTP/password reset emails
- Optionally `GROQ_API_KEY` for AI quiz feedback

Save, then:

```bash
sudo chown www-data:www-data /var/www/MathEase/.env
sudo chmod 640 /var/www/MathEase/.env
```

### 5. Reload Apache

```bash
sudo systemctl reload apache2
```

Open in browser: **http://54.206.4.117/**

---

## Option B: Update existing deployment (already set up)

After you’ve pushed changes to GitHub, on the **server**:

```bash
sudo apt-get install -y composer php-zip  # once, if Composer/vendor missing
sudo -u www-data bash -c 'cd /var/www/MathEase && git fetch origin && git checkout main && git pull origin main && composer install --no-dev --no-interaction --optimize-autoloader'
sudo systemctl reload apache2
```

Your `.env` and database stay as-is; only code and Composer packages are updated.

---

## Deploy from your PC (rsync) – optional

To push files from your machine without going through GitHub:

```powershell
# From PC (run from MathEase project root)
scp -i "C:\xampp\htdocs\MathEase_Key.pem" -r "C:\xampp\htdocs\ep67\MathEase\*" ubuntu@54.206.4.117:/tmp/mathease-upload/
```

Then on the server:

```bash
sudo rsync -a --exclude='.env' --exclude='.git' /tmp/mathease-upload/ /var/www/MathEase/
sudo chown -R www-data:www-data /var/www/MathEase
sudo systemctl reload apache2
```

(Do not overwrite `.env` so you keep your server secrets.)

---

## Useful server commands

| Task              | Command |
|-------------------|--------|
| Pull latest code  | `sudo -u www-data bash -c 'cd /var/www/MathEase && git pull origin main'` |
| Reload Apache     | `sudo systemctl reload apache2` |
| Edit .env         | `sudo nano /var/www/MathEase/.env` |
| Apache error log  | `sudo tail -f /var/log/apache2/mathease_error.log` |
| PHP errors        | `sudo tail -f /var/log/apache2/error.log` |

---

## Troubleshooting

- **403 Forbidden:** Check `AllowOverride All` and `Require all granted` for `/var/www/MathEase` in Apache config. Run `sudo a2enmod rewrite` and reload Apache.
- **500 / blank page:** Check Apache and PHP error logs; ensure `.env` exists and `uploads/` is writable by `www-data`.
- **DB connection failed:** Verify `DB_HOST`, `DB_USER`, `DB_PASS`, `DB_NAME` in `.env` and that MariaDB is running: `sudo systemctl status mariadb`.
