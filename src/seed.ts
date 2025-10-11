import dotenv from 'dotenv';
import { connectDatabase } from './configs/database';
import DatabaseSeeder from './configs/seeder';
import logger from './configs/logger';

// Load environment variables
dotenv.config();

async function runSeeder() {
  try {
    logger.info('Starting database seeding process...');
    
    // Connect to database
    await connectDatabase();
    
    // Run seeders
    await DatabaseSeeder.run();
    
    logger.info('Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    logger.error('Database seeding failed:', error);
    process.exit(1);
  }
}

runSeeder();