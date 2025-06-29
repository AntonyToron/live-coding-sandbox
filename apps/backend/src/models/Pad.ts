import { DataTypes, Model, Optional, Op } from 'sequelize';
import { sequelize } from '../config/database';
import { Pad as PadInterface, ProgrammingLanguage } from '../types';

interface PadCreationAttributes extends Optional<PadInterface, 'id' | 'created_at' | 'updated_at' | 'share_token' | 'last_executed_at'> {}

export class Pad extends Model<PadInterface, PadCreationAttributes> implements PadInterface {
  public id!: string;
  public title!: string;
  public language!: ProgrammingLanguage;
  public code!: string;
  public is_public!: boolean;
  public share_token?: string;
  public user_id!: string;
  public last_executed_at?: Date;
  public created_at!: Date;
  public updated_at!: Date;
}

Pad.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [1, 100],
      },
    },
    language: {
      type: DataTypes.ENUM('javascript', 'typescript', 'python', 'java', 'go', 'rust', 'cpp'),
      allowNull: false,
      defaultValue: 'javascript',
    },
    code: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: '',
    },
    is_public: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    share_token: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    last_executed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'Pad',
    tableName: 'pads',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['user_id'],
      },
      {
        unique: true,
        fields: ['share_token'],
        where: {
          share_token: {
            [Op.ne]: null,
          },
        },
      },
    ],
  }
);