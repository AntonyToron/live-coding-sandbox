import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { PadSession as PadSessionInterface, CursorPosition } from '../types';

interface PadSessionCreationAttributes extends Optional<PadSessionInterface, 'id' | 'created_at' | 'updated_at' | 'cursor_position'> {}

export class PadSession extends Model<PadSessionInterface, PadSessionCreationAttributes> implements PadSessionInterface {
  public id!: string;
  public pad_id!: string;
  public session_id!: string;
  public username!: string;
  public is_active!: boolean;
  public cursor_position?: CursorPosition;
  public last_seen!: Date;
  public created_at!: Date;
  public updated_at!: Date;
}

PadSession.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    pad_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'pads',
        key: 'id',
      },
    },
    session_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    cursor_position: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    last_seen: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
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
    modelName: 'PadSession',
    tableName: 'pad_sessions',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['pad_id'],
      },
      {
        fields: ['session_id'],
      },
      {
        fields: ['is_active'],
      },
    ],
  }
);