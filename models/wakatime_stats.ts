import { DataTypes } from "sequelize";
import { sequelize } from "../sequelize.ts";

export const WakaTimeStats = sequelize.define("WakaTimeStats", {
  date: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  user: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  range: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  totalSeconds: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  humanReadableTotal: {
    type: DataTypes.STRING,
    allowNull: false,
  },
}, {
  indexes: [
    {
      type: "UNIQUE",
      name: "stat_uniq",
      fields: ["user", "range"],
    },
  ],
});
