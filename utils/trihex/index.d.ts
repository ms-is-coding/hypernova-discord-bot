enum Types {
	Null       = 0b0000000,
	// numbers
	Unsigned8  = 0b0000001,
	Unsigned16 = 0b0000010,
	Unsigned32 = 0b0000011,
	Unsigned64 = 0b0000100,
	Signed8    = 0b0000101,
	Signed16   = 0b0000110,
	Signed32   = 0b0000111,
	Signed64   = 0b0001000,
	Float32    = 0b0001001,
	Float64    = 0b0001010,
	// text
	Numeric  = 0b0001011, // 4bits
	Alpha    = 0b0001100, // 5bits
	AlphaNum = 0b0001101, // 6bits
	Ascii    = 0b0001110, // 7bits
	Hex      = 0b0001111, // 4bits
	Base32   = 0b0010000, // 5bits
	Base64   = 0b0010001, // 6bits
	Utf8     = 0b0010010, // 8bits
}

type Type = keyof typeof Types;

class DataError {
	type: "Overflow" | "NoEncoding"
}

interface TriHexOptions {
	type: keyof typeof Types;
	color: string | number;
	background: string | number;
}

/**
 * Generates SVG code for a TriHex Code, do not specify
 * the type unless you are absolutely sure it's the right one
 * @example // data type is unknown
 * const image = TriHex(data);
 * // data type is known
 * const image = TriHex("hello world", { type: "Alpha" });
 * // note that in alpha mode, the text will be converted to lowercase
 */
export function TriHex(data: any, options: TriHexOptions): string;

export function validate(data: string, type: Type): string;

export function filter(data: string, type: Type): string;
