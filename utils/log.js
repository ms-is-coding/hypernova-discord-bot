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

module.exports = {
	info, error, warn,
};
