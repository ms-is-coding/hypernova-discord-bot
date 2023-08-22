const knex = require("knex").default;

const db = knex({
  client: "better-sqlite3",
  connection: {
    filename: "data/log.db",
  }, useNullAsDefault: true,
});

function info(message) {
  console.log(`\x1b[96m[INFO]\x1b[0m ${message}`);
}

function error(message, exit) {
  console.log(`\x1b[91m[ERROR]\x1b[0m ${message}`);
  if (exit) return process.exit();
}

function warn(message) {
  console.log(`\x1b[93m[WARN]\x1b[0m ${message}`);
}

async function initLogDatabase() {
  const trihexExists = await db.schema.hasTable("trihex");

  if (!trihexExists) {
    await db.schema.createTable("trihex", table => {
      table.time("timestamp").defaultTo("date('now')");
      table.string("user_id", 20);
      table.string("data");
      table.string("feedback");
    });
  }
}

module.exports = {
  info, error, warn, initLogDatabase, db
};
