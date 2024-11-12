import { Sequelize } from "sequelize";

export const sequelize = new Sequelize("sqlite:stats.db", { logging: false });

export async function init() {
  await sequelize.sync();
}
