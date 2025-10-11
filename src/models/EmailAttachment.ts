import { DataTypes, Model, Optional, Association } from 'sequelize';
import sequelize from '../configs/database';
import { IEmailAttachment } from '../types';
import ReceivedEmail from './ReceivedEmail';

interface EmailAttachmentCreationAttributes extends Optional<IEmailAttachment, 'id' | 'createdAt'> {}

class EmailAttachment extends Model<IEmailAttachment, EmailAttachmentCreationAttributes> implements IEmailAttachment {
  public id!: string;
  public emailId!: string;
  public filename!: string;
  public contentType!: string;
  public size!: number;
  public filePath!: string;
  public readonly createdAt!: Date;

  // Associations
  public static associations: {
    email: Association<EmailAttachment, ReceivedEmail>;
  };
}

EmailAttachment.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    emailId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: ReceivedEmail,
        key: 'id',
      },
    },
    filename: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    contentType: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    size: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    filePath: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'EmailAttachment',
    tableName: 'email_attachments',
    timestamps: false,
    updatedAt: false,
    indexes: [
      {
        fields: ['email_id'],
      },
      {
        fields: ['filename'],
      },
      {
        fields: ['content_type'],
      },
    ],
  }
);

export default EmailAttachment;