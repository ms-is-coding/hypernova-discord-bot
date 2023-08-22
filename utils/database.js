const knex = require("knex").default;

const db = knex({
  client: "better-sqlite3",
  connection: {
    filename: "data/storage.db",
  }, useNullAsDefault: true,
});

const Databases = {
  StatusLink: "status-link"
};

async function initDatabase() {
  const statusLinkExists = await db.schema.hasTable(Databases.StatusLink);
  // const moneyExists = await db.schema.hasTable("money");

  if (!statusLinkExists) {
    await db.schema.createTable(Databases.StatusLink, table => {
      table.string("id0", 20);
      table.string("id1", 20);
      table.string("id2", 20);
      table.string("id3", 20);
      table.string("id4", 20);
    });
  }

  // if (!moneyExists) {
  // 	await db.schema.createTable("money", table => {
  // 		table;
  // 	});
  // }
}

module.exports = { db, initDatabase, Databases };
