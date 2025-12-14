import { DataTypes, Model, Optional, Association } from 'sequelize';
import sequelize from '../configs/database';
import { IReceivedEmail } from '../types';
import TemporaryEmail from './TemporaryEmail';

interface ReceivedEmailCreationAttributes extends Optional<IReceivedEmail, 'id' | 'createdAt' | 'updatedAt'> {}

class ReceivedEmail extends Model<IReceivedEmail, ReceivedEmailCreationAttributes> implements IReceivedEmail {
  public id!: string;
  public temporaryEmailId!: string;
  public fromEmail!: string;
  public fromName?: string;
  public subject!: string;
  public textContent?: string;
  public htmlContent?: string;
  public attachments?: any[];
  public isRead!: boolean;
  public receivedAt!: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public static associations: {
    temporaryEmail: Association<ReceivedEmail, TemporaryEmail>;
  };
}

ReceivedEmail.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    temporaryEmailId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: TemporaryEmail,
        key: 'id',
      },
    },
    fromEmail: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        isEmail: true,
      },
    },
    fromName: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    subject: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    textContent: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    htmlContent: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    attachments: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: [],
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    receivedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
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
    modelName: 'ReceivedEmail',
    tableName: 'received_emails',
    timestamps: true,
    indexes: [
      {
        fields: ['temporary_email_id'],
      },
      {
        fields: ['from_email'],
      },
      {
        fields: ['is_read'],
      },
      {
        fields: ['received_at'],
      },
      {
        fields: ['created_at'],
      },
      {
        fields: ['subject'],
      },
    ],
  }
);

export default ReceivedEmail;