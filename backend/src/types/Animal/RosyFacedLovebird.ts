import { Animal } from "../Animal";
import { AnimalColor } from "../AnimalColor";

export const RosyFacedLovebird: Animal = {
	id: "RosyFacedLovebird",
	name: "コンゴウインコ",
	cost: 0,
	poops: 0,
	color: [AnimalColor.RED, AnimalColor.GREEN, AnimalColor.ORANGE],
	effect: {
		global: true, // ほかのどのプレイヤーのダイスでも効果が発動する
		timing: "first",
		creation: 1, // 1枚のコインを取得
	},
	inventory: 8,
};
