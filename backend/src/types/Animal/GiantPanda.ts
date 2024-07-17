import { Animal } from "../Animal";
import { AnimalColor } from "../AnimalColor";

export const GiantPanda: Animal = {
	id: "GiantPanda",
	name: "ジャイアントパンダ",
	cost: 3,
	poops: 2,
	color: [AnimalColor.PURPLE],
	effect: {
		global: true, // ほかのどのプレイヤーのダイスでも効果が発動する
		timing: "first",
		creation: 0,
		buff: [2, "GiantPanda", "each"], //自分のジャイアントパンダの数だけ、自分のCoinを+2する
	},
	inventory: 6,
};
