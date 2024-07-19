import { Animal } from "../types";
import { AnimalColor } from "../AnimalColor";

export const Lion: Animal = {
	id: "Lion",
	name: "ライオン",
	cost: 3,
	poops: 0,
	color: [AnimalColor.RED],
	effect: {
		global: true, // ほかのどのプレイヤーのダイスでも効果が発動する
		timing: "first",
		creation: 0,
		stealIf: ["Lion", ">=", "2", "?", "2", ":", "1"], //自分のライオンが2匹以上なら、2Coinを盗む。そうでない場合、1Coinを盗む
	},
	inventory: 6,
};
