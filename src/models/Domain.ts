import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../configs/database';
import { IDomain } from '../types';

interface DomainCreationAttributes extends Optional<IDomain, 'id' | 'createdAt' | 'updatedAt'> {}

class Domain extends Model<IDomain, DomainCreationAttributes> implements IDomain {
  public id!: string;
  public domain!: string;
  public isActive!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Domain.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    domain: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      // validate: {
      //   isDomain(value: string) {
      //     const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}$/;
      //     if (!domainRegex.test(value)) {
      //       throw new Error('Invalid domain format');
      //     }
      //   },
      // },
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
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
    modelName: 'Domain',
    tableName: 'domains',
    timestamps: true,
    indexes: [
      {
        fields: ['domain'],
        unique: true,
      },
      {
        fields: ['is_active'],
      },
    ],
  }
);

export default Domain;