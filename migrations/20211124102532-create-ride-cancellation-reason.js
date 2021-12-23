"use strict";
const momenttz = require("moment-timezone");

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.createTable(
        "RideCancellationReasons",
        {
          id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: Sequelize.INTEGER,
          },
          cancellationReason: {
            type: Sequelize.STRING,
            allowNull: false,
          },
          createdAt: {
            allowNull: false,
            type: Sequelize.DATE,
            defaultValue: new Date(momenttz().tz("Africa/Abidjan")),
          },
          updatedAt: {
            allowNull: false,
            type: Sequelize.DATE,
            defaultValue: new Date(momenttz().tz("Africa/Abidjan")),
          },
          deletedAt: {
            allowNull: true,
            type: Sequelize.DATE,
          },
        },
        { transaction }
      );

      await queryInterface.sequelize.query(`INSERT INTO RideCancellationReasons
      (cancellationReason, createdAt, updatedAt, deletedAt)
      VALUES('Unavailability of Vehicle', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, null),
      ('Cancelled by Customer', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, null),
      ('Other', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, null);
      `);

      await queryInterface.sequelize.query(`UPDATE Rides SET status = 'On the way' WHERE status = 'INPROGRESS'`);
      await queryInterface.sequelize.query(`UPDATE Rides SET status = 'Loading Complete' WHERE status = 'COMPLETED'`);
      await queryInterface.sequelize.query(`UPDATE Rides SET status = 'Scheduled' WHERE status = 'ASSIGNED'`);
      await queryInterface.sequelize.query(`UPDATE Rides SET status = 'Not Assigned' WHERE status = 'UNASSIGNED'`);
      await queryInterface.sequelize.query(`UPDATE Rides SET status = 'Cancelled' WHERE status = 'CANCELLED'`);
      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("RideCancellationReasons");
  },
};
