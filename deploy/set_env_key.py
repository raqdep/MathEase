#!/usr/bin/env python3
"""Set or replace KEY=VALUE in .env. Usage: python3 set_env_key.py KEY VALUE"""
import sys, os
if len(sys.argv) != 3:
    print("Usage: set_env_key.py KEY VALUE"); sys.exit(1)
key, val = sys.argv[1], sys.argv[2]
p = "/var/www/MathEase/.env"
if os.path.exists(p):
    with open(p) as f:
        lines = [l for l in f.readlines() if not l.strip().startswith(key + "=")]
else:
    lines = []
with open(p, "w") as f:
    f.writelines(lines)
    f.write(key + "=" + val + "\n")
os.chmod(p, 0o640)
try:
    import pwd
    os.chown(p, pwd.getpwnam("www-data").pw_uid, -1)
except Exception:
    pass
print("Set", key, "in .env")
