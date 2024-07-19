import { Animal } from "../types";
import { AnimalColor } from "../AnimalColor";

export const Penguin: Animal = {
	id: "Penguin",
	name: "ペンギン",
	cost: 2,
	poops: 1,
	color: [AnimalColor.BLUE],
	effect: {
		global: true, // ほかのどのプレイヤーのダイスでも効果が発動する
		timing: "first",
		creation: 0,
		creationIf: ["Penguin", ">=", "2", "?", "2", ":", "1"], //自分のペンギンが2匹以上なら、2Coinを生成する。1体の場合、1Coinを生成する
	},
	inventory: 6,
};
