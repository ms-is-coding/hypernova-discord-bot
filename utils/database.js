const knex = require("knex").default;

const db = knex({
	client: "better-sqlite3",
	connection: {
		filename: "messagin.db",
	}, useNullAsDefault: true,
});


async function initDatabase() {
	const moneyExists = await db.schema.hasTable("money");

	if (!moneyExists) {
		await db.schema.createTable("money", table => {
			table;
		});
	}
}

module.exports = { db, initDatabase };
