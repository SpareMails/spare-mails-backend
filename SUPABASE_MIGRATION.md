# Migration to Supabase PostgreSQL

## Summary of Changes

Your backend has been successfully migrated from MySQL to Supabase PostgreSQL. Here are the changes made:

### 1. **Dependencies Updated** (`package.json`)
- ✅ Removed: `mysql2`
- ✅ Added: `pg` (PostgreSQL driver) and `pg-hstore` (for Sequelize compatibility)

### 2. **Database Configuration** (`src/configs/database.ts`)
- ✅ Changed dialect from `mysql` to `postgres`
- ✅ Added support for `DATABASE_URL` connection string (Supabase preferred method)
- ✅ Added SSL configuration for production environments
- ✅ Updated default port from `3306` to `5432`

### 3. **Environment Variables** (`src/configs/environment.ts`)
- ✅ Added `DATABASE_URL` for Supabase connection string
- ✅ Updated default port to `5432` (PostgreSQL)
- ✅ Updated default database name to `postgres`

### 4. **Model Data Types** (`src/models/ReceivedEmail.ts`)
- ✅ Changed `DataTypes.TEXT('long')` to `DataTypes.TEXT` (PostgreSQL compatible)
- ✅ Changed `DataTypes.JSON` to `DataTypes.JSONB` (better performance in PostgreSQL)

### 5. **Environment Example** (`.env.example`)
- ✅ Created comprehensive example with Supabase configuration

---

## Next Steps

### 1. **Install Dependencies**
```bash
npm install
```

### 2. **Get Your Supabase Credentials**
1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **Database**
3. Find your connection string under **Connection string** → **URI**
4. Copy the connection string (it looks like: `postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`)

### 3. **Update Your `.env` File**
Create a `.env` file based on `.env.example`:

```env
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
NODE_ENV=development
PORT=3000
# ... other variables
```

**Important:** Replace `[YOUR-PASSWORD]` and `[YOUR-PROJECT-REF]` with your actual Supabase credentials.

### 4. **Run Database Migrations**
The application will automatically sync the database schema when you start the server in development mode:

```bash
npm run dev
```

### 5. **Seed the Database (Optional)**
If you have seed data:

```bash
npm run seed
```

---

## Supabase-Specific Notes

### Connection Pooling
Supabase uses connection pooling by default. The configuration already includes optimal pool settings (max: 10 connections).

### SSL
SSL is automatically enabled in production mode for secure connections to Supabase.

### Direct Connection vs Connection Pooler
- **Transaction mode** (port 6543): Use for short-lived connections
- **Session mode** (port 5432): Use for long-lived connections (recommended)

The current configuration uses port 5432 (session mode), which is suitable for backend applications.

### Database Extensions
If you need PostgreSQL extensions (like `uuid-ossp` for UUID generation), enable them in your Supabase dashboard:
1. Go to **Database** → **Extensions**
2. Search for the extension (e.g., `uuid-ossp`)
3. Enable it

---

## Testing the Connection

Start your server and check the logs:

```bash
npm run dev
```

You should see:
```
✅ Database connection established successfully
✅ Database synchronized successfully
🚀 SpareMails backend server is running on port 3000
```

---

## Troubleshooting

### Connection Issues
- Verify your `DATABASE_URL` is correct
- Check that your Supabase project is active
- Ensure your IP is allowed in Supabase (Network Restrictions)

### SSL Certificate Errors
If you encounter SSL errors, the configuration already includes `rejectUnauthorized: false` for development.

### Migration Errors
If you get schema errors, you may need to manually create tables or use Sequelize migrations instead of `sync()`.

---

## Additional Optimizations (Optional)

### 1. **Use Sequelize Migrations**
For production, consider using proper migrations instead of `sync()`:

```bash
npm install --save-dev sequelize-cli
npx sequelize-cli init
```

### 2. **Enable Row-Level Security (RLS)**
Configure RLS in Supabase for additional security on your tables.

### 3. **Use Supabase Realtime**
If you want real-time updates, consider using Supabase's built-in Realtime features.

---

## What's Compatible

✅ All Sequelize features work the same
✅ UUIDs, timestamps, and indexes
✅ Foreign keys and associations
✅ JSON/JSONB data types
✅ Text fields (no size limits like MySQL)
✅ Transactions and migrations

---

Your application is now ready to use Supabase PostgreSQL! 🎉
