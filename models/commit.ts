import { DataTypes } from "sequelize";
import { sequelize } from "../sequelize.ts";

export const Commit = sequelize.define("Commit", {
  date: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  repository: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  branch: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  author: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  id: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    primaryKey: true,
  },
  totalChanges: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
});
