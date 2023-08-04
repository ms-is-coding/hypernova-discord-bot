/* eslint-disable no-inline-comments */

const Types = {
	Null: 0b000000,
	// numbers
	Unsigned8: 0b000001,
	Unsigned16: 0b000010,
	Unsigned32: 0b000011,
	Unsigned64: 0b000100,
	Signed8: 0b000101,
	Signed16: 0b000110,
	Signed32: 0b000111,
	Signed64: 0b001000,
	Float32: 0b001001,
	Float64: 0b001010,
	// text
	Numeric: 0b001011, // 4bits
	Alpha: 0b001100, // 5bits
	AlphaNum: 0b001101, // 6bits
	Ascii: 0b001110, // 7bits
	Hex: 0b001111, // 4bits
	Base32: 0b010000, // 5bits
	Base64: 0b010001, // 6bits
	Utf8: 0b010010, // 8bits
};

Object.freeze(Types);

function flat(l, t, scale, color) {
	const x0 = l.toFixed(3);
	const y0 = t.toFixed(3);
	const x1 = (l + 1 * scale).toFixed(3);
	const y1 = t.toFixed(3);
	const x2 = (l + 0.5 * scale).toFixed(3);
	const y2 = (t + 0.866 * scale).toFixed(3);
	return `\t<polygon points="${x0} ${y0} ${x1} ${y1} ${x2} ${y2}" fill="${color}" />\n`;
}

function pointy(l, t, scale, color) {
	const x0 = l.toFixed(3);
	const y0 = (t + 0.866 * scale).toFixed(3);
	const x1 = (l + 1 * scale).toFixed(3);
	const y1 = (t + 0.866 * scale).toFixed(3);
	const x2 = (l + 0.5 * scale).toFixed(3);
	const y2 = t.toFixed(3);
	return `\t<polygon points="${x0} ${y0} ${x1} ${y1} ${x2} ${y2}" fill="${color}" />\n`;
}

function getSize(data, type) {
	const l = data.length;
	switch (type) {

		case Types.Numeric: return l * 4;
		case Types.Alpha: return l * 5;
		case Types.AlphaNum: return l * 6;
		case Types.Ascii: return l * 7;
		case Types.Hex: return l * 4;
		case Types.Base32: return l * 5;
		case Types.Base64: return l * 6;
		case Types.Utf8: return l * 8;

		case Types.Unsigned8: return l * 8;
		case Types.Signed8: return l * 8;
		case Types.Unsigned16: return l * 16;
		case Types.Signed16: return l * 16;
		case Types.Unsigned32: return l * 32;
		case Types.Signed32: return l * 32;
		case Types.Unsigned64: return l * 64;
		case Types.Signed64: return l * 64;
		case Types.Float32: return l * 32;
		case Types.Float64: return l * 64;

	}
}

function getLayers(size) {
	let layers = 4;
	while (6 * layers ** 2 - 96 < size) layers++;
	return layers;
}

function appendHead(rawdata, layers, type, mask) {
	const l = layers - 4;
	const b1 = 0xd0 | (l >> 4 & 0x3);
	const b2 = (l << 4 & 0xf0) | (type >> 2);
	const b3 = (type << 6 & 0xc0) | (mask << 2);
	const head = Buffer.from([b1, b2, b3, 0xff, 0xff, 0xff, 0xfc, 0, 0, 0, 0, 0]);
	const data = Buffer.from(rawdata).map(x => x ^ ((mask << 4) | mask));
	return Buffer.concat([head, data]);
}

function getType(data) {

	if (data instanceof Buffer) {
		return Types.Unsigned8;
	}

	// not the best approach as javascript numbers cannot be really classified
	// but should not break anything
	else if (data instanceof Array) {
		let hasFloat = false;
		for (const element of data) {
			if (typeof element != "number") return Types.Null;
			if (element != parseInt(element)) hasFloat = true;
		}
		if (hasFloat) return Types.Float64;
		else return Types.Signed64;
	}

	else if (typeof data == "string") {
		// start from smallest value count
		if (/^[0-9 ]+$/.test(data)) return Types.Numeric; // 4bits (11values)
		if (/^[0-9a-fA-F]+$/.test(data)) return Types.Hex; // 4bits (16values)
		if (/^[a-zA-Z ]+$/.test(data)) return Types.Alpha; // 5bits (27values)
		if (/^[a-zA-Z2-7=]+$/.test(data)) return Types.Base32; // 5bits
		if (/^[a-zA-Z0-9\- ]+$/.test(data)) return Types.AlphaNum; // 6bits (64values) //! may cause problems for base64 detection.
		if (/^([a-zA-Z0-9_=-]+|[a-zA-Z0-9/+=]+)$/.test(data)) return Types.Base64; // 6bits (64values)
		if (data.split("").every(x => x.charCodeAt(0) < 128)) return Types.Ascii; // 7bits (128values)
		else return Types.Utf8;
	}
}

function s(l) { return 2 * l - 1; }

function* getDataGen(data, mask) {
	for (let i = 0; i < data.byteLength; i++) {
		const x = data.at(i);
		yield x >> 7;
		yield x >> 6 & 1;
		yield x >> 5 & 1;
		yield x >> 4 & 1;
		yield x >> 3 & 1;
		yield x >> 2 & 1;
		yield x >> 1 & 1;
		yield x & 1;
	}
	while (true) {
		yield mask >> 3;
		yield mask >> 2 & 1;
		yield mask >> 1 & 1;
		yield mask & 1;
	}
}

function parseData(data, type) {
	if (type == Types.Hex) {
		return Buffer.from(data, "hex");
	}
	if (type == Types.Base64) {
		return Buffer.from(data, "base64");
	}
	return Buffer.from(data);
}

/**
 * @param {Buffer} data
 */
function getMask(data) {
	let optimal = 0;
	// ! fill mode
	let coeff = 0;
	for (let i = 0; i < 16; i++) {
		const buf = data.map(x => x ^ ((i << 4) | i));
		const current = buf.reduce((a, b, j) => (a + b) * j / buf.length) / buf.length;
		if (current > coeff) {
			coeff = current;
			optimal = i;
		}
	}
	// ! equal mode
	// let dist = 0.5;
	// for (let i = 0; i < 16; i++) {
	// 	let buf = data.map(x => x ^ ((i << 4) | i));
	// 	let arr = Array.from(buf).map(x => x.toString(2)).map(x => "0".repeat(8-x.length)+x).map(x => x.split("")).flat().map(x => +x);
	// 	let current = arr.reduce((a,b,i)=>(a+b)*i/arr.length) / arr.length;
	// 	let current_dist = Math.abs(current - 0.5);
	// 	if (current_dist < dist) {
	// 		dist = current_dist;
	// 		optimal = i;
	// 	}
	// }
	return optimal;
}

function run(i, x, y, scale, color, gen) {
	if (!gen.next().value) return "";
	if (i % 2) return pointy(x, y, scale, color);
	else return flat(x, y, scale, color);
}

function genSvg(data, options) {

	// ! do not modify UPPERCASE constants
	const SCALE = 4;
	const HEIGHT = 0.866 * SCALE;
	const WIDTH = 0.5 * SCALE;

	const type = options.type ? Types[options.type] : getType(data);
	const bitsize = getSize(data, type);
	const parsed = parseData(data, type);
	const layers = getLayers(bitsize);
	// todo add algo to check all 16 masks
	const mask = getMask(parsed);
	const buf = appendHead(parsed, layers, type, mask);
	const bitGen = getDataGen(buf, mask);

	const color = options.color ?? "#777";
	const background = options.background;
	const VIEWBOX = (layers + 1) * 2 * SCALE;

	const IMG = layers > 32 ? 1024 : 512;

	if (layers > 67) {
		throw new Error(`Data too big: ${layers} > 67`);
	}

	if (type == Types.Null) {
		throw new Error("Data cannot be encoded");
	}

	let str = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VIEWBOX} ${VIEWBOX}" width="${IMG}" height="${IMG}">\n`;
	if (background) {
		str += `<polygon points="0 ${VIEWBOX / 2} ${VIEWBOX / 4} ${VIEWBOX / 2 + HEIGHT * (layers + 1)} ${VIEWBOX * 3 / 4} ${VIEWBOX / 2 + HEIGHT * (layers + 1)} ${VIEWBOX} ${VIEWBOX / 2} ${VIEWBOX * 3 / 4} ${VIEWBOX / 2 - HEIGHT * (layers + 1)} ${VIEWBOX / 4} ${VIEWBOX / 2 - HEIGHT * (layers + 1)}" fill="${background}" />\n`;
	}

	for (let l = 1; l <= layers; l++) {
		let x = SCALE * (layers + l);
		let y = SCALE * (layers + 1) - HEIGHT;

		let i = 1;

		for (let j = 1; j <= s(l); i++, j++) {
			str += run(i, x, y, SCALE, color, bitGen);
			if (i % 2) x -= WIDTH;
			if (!(i % 2)) y -= HEIGHT;
		}
		for (let j = 1; j <= s(l); i++, j++) {
			str += run(i, x, y, SCALE, color, bitGen);
			x -= WIDTH;
		}
		for (let j = 1; j <= s(l); i++, j++) {
			str += run(i, x, y, SCALE, color, bitGen);
			if (!(i % 2)) x -= WIDTH;
			if (i % 2) y += HEIGHT;
		}
		for (let j = 0; j < s(l); i++, j++) {
			str += run(i, x, y, SCALE, color, bitGen);
			if (!(i % 2)) x += WIDTH;
			if (i % 2) y += HEIGHT;
		}
		for (let j = 0; j < s(l); i++, j++) {
			str += run(i, x, y, SCALE, color, bitGen);
			x += WIDTH;
		}
		for (let j = 0; j < s(l); i++, j++) {
			str += run(i, x, y, SCALE, color, bitGen);
			if (i % 2) x += WIDTH;
			if (!(i % 2)) y -= HEIGHT;
		}
	}

	str += "</svg>";

	return str;
}

function TriHex(data, options) {
	return genSvg(data, options);
}

function validate(data, type) {
	data;
	type;
	return true;
}

function filter(data, type) {
	data;
	type;
	return data;
}

module.exports = { TriHex, filter, validate, Types };
