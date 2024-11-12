import { DataTypes, InferAttributes, Model } from "sequelize";
import { sequelize } from "../sequelize.ts";

export class WakaTimeCredentials
  extends Model<InferAttributes<WakaTimeCredentials>> {
  declare date: Date;
  declare accessToken: string;
  declare refreshToken: string;
  declare uid: string;
  declare username: string;
}

WakaTimeCredentials.init({
  date: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  accessToken: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  refreshToken: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  uid: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
  },
}, { sequelize, tableName: "WakaTimeCredentials" });
