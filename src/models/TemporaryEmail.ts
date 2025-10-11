import { DataTypes, Model, Optional, Association } from 'sequelize';
import sequelize from '../configs/database';
import { ITemporaryEmail } from '../types';
import Domain from './Domain';

interface TemporaryEmailCreationAttributes extends Optional<ITemporaryEmail, 'id' | 'createdAt' | 'updatedAt'> {}

class TemporaryEmail extends Model<ITemporaryEmail, TemporaryEmailCreationAttributes> implements ITemporaryEmail {
  public id!: string;
  public email!: string;
  public domain!: string;
  public isActive!: boolean;
  public expiresAt!: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public static associations: {
    domain: Association<TemporaryEmail, Domain>;
  };

  // Methods
  public isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  public getRemainingTime(): number {
    const now = new Date().getTime();
    const expiry = this.expiresAt.getTime();
    return Math.max(0, expiry - now);
  }
}

TemporaryEmail.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    domain: {
      type: DataTypes.STRING(100),
      allowNull: false,
      references: {
        model: Domain,
        key: 'domain',
      },
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'TemporaryEmail',
    tableName: 'temporary_emails',
    timestamps: true,
    indexes: [
      {
        fields: ['email'],
        unique: true,
      },
      {
        fields: ['domain'],
      },
      {
        fields: ['is_active'],
      },
      {
        fields: ['expires_at'],
      },
      {
        fields: ['created_at'],
      },
    ],
  }
);

export default TemporaryEmail;