# Database Schema Changes - Snake Case Column Names

## Summary of Changes

All models have been updated to use snake_case column names in the database while maintaining camelCase attribute names in the TypeScript code. This is achieved through Sequelize's `underscored: true` configuration.

## Column Mapping (camelCase → snake_case)

### domains table
- `isActive` → `is_active`
- `createdAt` → `created_at`
- `updatedAt` → `updated_at`

### temporary_emails table
- `isActive` → `is_active`
- `expiresAt` → `expires_at`
- `createdAt` → `created_at`
- `updatedAt` → `updated_at`

### received_emails table
- `temporaryEmailId` → `temporary_email_id`
- `fromEmail` → `from_email`
- `fromName` → `from_name`
- `textContent` → `text_content`
- `htmlContent` → `html_content`
- `isRead` → `is_read`
- `receivedAt` → `received_at`
- `createdAt` → `created_at`
- `updatedAt` → `updated_at`

### email_attachments table
- `emailId` → `email_id`
- `contentType` → `content_type`
- `filePath` → `file_path`
- `createdAt` → `created_at`

## Database Configuration

The `underscored: true` setting in `database.ts` automatically handles the conversion:

```typescript
define: {
  timestamps: true,
  underscored: true, // This converts camelCase to snake_case
}
```

## Index Updates

All model indexes have been updated to use camelCase field names (which Sequelize will automatically convert to snake_case in the database).

## Migration Notes

If you have existing data, you'll need to:

1. **Drop existing tables** (development only):
   ```sql
   DROP TABLE IF EXISTS email_attachments;
   DROP TABLE IF EXISTS received_emails;
   DROP TABLE IF EXISTS temporary_emails;
   DROP TABLE IF EXISTS domains;
   ```

2. **Restart the application** to recreate tables with correct column names
3. **Run the seeder** to populate default domains:
   ```bash
   npm run seed
   ```

## Benefits

- ✅ **Database Convention**: Follows standard snake_case naming for database columns
- ✅ **Code Convention**: Maintains camelCase in TypeScript/JavaScript code
- ✅ **Automatic Conversion**: Sequelize handles the mapping automatically
- ✅ **Consistency**: All models follow the same pattern
- ✅ **Maintainability**: Easier to read SQL queries and database schemas