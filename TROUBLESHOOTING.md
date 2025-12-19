# VPS Deployment Troubleshooting Guide

## Database Connection Issues

If your server is running but the database is not connecting, follow these steps:

### 1. Check Database Logs
When you start the server (`npm start`), look for these messages:
- ✅ **`✓ Database connected successfully`** - Good! Database is working.
- ❌ **`❌ Database connection failed`** - Problem! See error details.

### 2. Verify Environment Variables
On your VPS, ensure `.env` file has correct values:
```bash
cd server
cat .env
```

Required variables:
- `DB_HOST` - Usually `localhost` (if MySQL is on same VPS)
- `DB_USER` - Your MySQL username
- `DB_PASS` - Your MySQL password
- `DB_NAME` - Your database name (e.g., `stream_theme_master`)

### 3. Test Database Connection
Run this command on your VPS:
```bash
mysql -u YOUR_DB_USER -p YOUR_DB_NAME
```
If this fails, MySQL is not accessible with your credentials.

### 4. Check MySQL Service
Ensure MySQL is running:
```bash
sudo systemctl status mysql
```
If not running:
```bash
sudo systemctl start mysql
```

### 5. Import Database Schema
If database exists but tables are missing:
```bash
mysql -u YOUR_DB_USER -p YOUR_DB_NAME < server/database/import_schema.sql
```

### 6. Test Health Endpoint
After fixing, test the health check:
```bash
curl http://localhost:5000/api/health
```
Should return: `{"status":"healthy","database":"connected"}`

### 7. Check Server Logs
Look for specific errors in server output that indicate:
- Connection timeout (firewall/network issue)
- Access denied (wrong credentials)
- Unknown database (database not created)
- Can't connect to MySQL server (MySQL not running)

## Common Fixes

### Issue: Access Denied
**Solution**: Update `DB_USER` and `DB_PASS` in `.env`

### Issue: Unknown Database
**Solution**: Create database first:
```bash
mysql -u root -p
CREATE DATABASE stream_theme_master;
exit
```

### Issue: Can't Connect to MySQL Server
**Solution**: Start MySQL service (see step 4)

### Issue: Connection Timeout
**Solution**: Check firewall rules or use `127.0.0.1` instead of `localhost`
