import { Domain } from '../models';
import logger from './logger';

/**
 * Database seeder to populate initial data
 */
export class DatabaseSeeder {
  /**
   * Seed default domains
   */
  public static async seedDomains(): Promise<void> {
    try {
      const defaultDomains = [
        'temp-mail.local',
        '10minute-mail.local',
        'guerrilla-mail.local',
        'throwaway-email.local',
        'disposable-email.local',
      ];

      for (const domainName of defaultDomains) {
        const [domain, created] = await Domain.findOrCreate({
          where: { domain: domainName },
          defaults: {
            domain: domainName,
            isActive: true,
          },
        });

        if (created) {
          logger.info(`Created default domain: ${domainName}`);
        }
      }

      logger.info('Domain seeding completed');
    } catch (error) {
      logger.error('Failed to seed domains:', error);
      throw error;
    }
  }

  /**
   * Run all seeders
   */
  public static async run(): Promise<void> {
    try {
      logger.info('Starting database seeding...');
      
      await this.seedDomains();
      
      logger.info('Database seeding completed successfully');
    } catch (error) {
      logger.error('Database seeding failed:', error);
      throw error;
    }
  }
}

export default DatabaseSeeder;