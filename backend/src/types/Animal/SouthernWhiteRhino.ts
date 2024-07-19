import { Animal } from "../types";
import { AnimalColor } from "../AnimalColor";

export const SouthernWhiteRhino: Animal = {
	id: "SouthernWhiteRhino",
	name: "ミナミシロサイ",
	cost: 6,
	poops: 2,
	color: [AnimalColor.GREEN],
	effect: {
		global: false, // 自分のダイスのみ効果が発動する
		timing: "first",
		creation: 0,
		steal: [1, "target", 1, "star"], //対象のプレイヤーからStarを1つ盗む
	},
	inventory: 6,
};
