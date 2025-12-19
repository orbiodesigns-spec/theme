# Stream Theme Master

This project is separated into a Client (Frontend) and Server (Backend).

## Project Structure
- `client/`: React + Vite frontend application.
- `server/`: Node.js + Express backend API.

## Environment Setup
Copy the example files and configure your secrets:
- **Server**: `cp server/.env.example server/.env`
- **Client**: `cp client/.env.example client/.env`

## Local Development (How to Run)

### 1. Backend (Server)
```bash
cd server
npm install 
npm run dev
```
Server runs on: `http://localhost:5000`

### 2. Frontend (Client)
```bash
cd client
npm install
npm run dev
```
Client runs on: `http://localhost:5173`

## Deployment Guide (Production)

### 1. Database Setup
1. Create a MySQL database (version 5.7+ recommended).
2. Import the schema:
   ```bash
   mysql -u user -p database_name < server/database/import_schema.sql
   ```

### 2. Backend Deployment
1. Set environment variables on your server (VPS/Heroku/Render):
   - `NODE_ENV=production`
   - `DB_HOST`, `DB_USER`, `DB_PASS`, `DB_NAME`
   - `JWT_SECRET`
   - `CLIENT_URL` (URL of your frontend)
   - `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`
2. Install dependencies & Start:
   ```bash
   npm install --production
   npm start
   ```

### 3. Frontend Deployment
1. Set build environment variables:
   - `VITE_API_URL` (URL of your backend API, e.g., `https://api.yourdomain.com/api`)
2. Build the static site:
   ```bash
   npm install
   npm run build
   ```
3. Serve the `client/dist` folder using Nginx, Apache, or a static host (Vercel/Netlify).

## API Documentation
- **API Base**: `/api`
- **Auth**: Bearer Token (JWT)
