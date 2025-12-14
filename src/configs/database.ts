import { Sequelize } from 'sequelize';
import logger from './logger';
import { environment } from './environment';

// Supabase PostgreSQL connection with pooler support (IPv4)
const sequelize = environment.DATABASE_URL
  ? new Sequelize(environment.DATABASE_URL, {
      dialect: 'postgres',
      dialectOptions: {
        ssl: environment.NODE_ENV === 'production' ? {
          require: true,
          rejectUnauthorized: false,
        } : false,
        // Force IPv4 for Supabase pooler compatibility
        host: undefined,
      },
      logging: (msg) => logger.debug(msg),
      pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000,
      },
      define: {
        timestamps: true,
        underscored: true,
      },
    })
  : new Sequelize({
      database: environment.DB_NAME,
      username: environment.DB_USER,
      password: environment.DB_PASSWORD,
      host: environment.DB_HOST,
      port: parseInt(environment.DB_PORT),
      dialect: 'postgres',
      dialectOptions: {
        ssl: environment.NODE_ENV === 'production' ? {
          require: true,
          rejectUnauthorized: false,
        } : false,
      },
      logging: (msg) => logger.debug(msg),
      pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000,
      },
      define: {
        timestamps: true,
        underscored: true,
      },
    });

export const connectDatabase = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    logger.info('Database connection established successfully');
    
    // Sync models in development
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: true });
      logger.info('Database synchronized successfully');
    }
  } catch (error) {
    logger.error('Unable to connect to the database:', error);
    process.exit(1);
  }
};

export default sequelize;