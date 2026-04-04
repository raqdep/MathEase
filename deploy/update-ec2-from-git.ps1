# Pull latest MathEase from GitHub on EC2 and reload Apache.
# Run from Windows PowerShell (adjust paths if your key or project folder differs).
#
# Usage:
#   cd C:\xampp\htdocs\ep67\MathEase
#   .\deploy\update-ec2-from-git.ps1
#
# First-time server setup (SSH in once): sudo bash /var/www/MathEase/deploy/setup-ec2.sh
# Then edit secrets on server: sudo nano /var/www/MathEase/.env

param(
    [string]$KeyPath = "C:\xampp\htdocs\MathEase_Key.pem",
    [string]$UserHost = "ubuntu@54.206.4.117",
    [string]$WebRoot = "/var/www/MathEase"
)

$ErrorActionPreference = "Stop"
if (-not (Test-Path -LiteralPath $KeyPath)) {
    Write-Error "PEM not found: $KeyPath"
}

# Run git/composer as www-data; reload Apache as ubuntu (passwordless sudo on typical EC2 AMI).
$bashRemote = "sudo -u www-data bash -lc 'cd $WebRoot && git fetch origin && git checkout main && git pull origin main && composer install --no-dev --no-interaction --optimize-autoloader'; sudo systemctl reload apache2"
ssh -i $KeyPath -o StrictHostKeyChecking=accept-new $UserHost $bashRemote
