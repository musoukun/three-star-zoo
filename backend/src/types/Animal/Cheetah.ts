import { Animal } from "../types";
import { AnimalColor } from "../AnimalColor";

export const Cheetah: Animal = {
	id: "Cheetah",
	name: "チーター",
	cost: 5,
	poops: 0,
	color: [AnimalColor.RED],
	effect: {
		global: true, // ほかのどのプレイヤーのダイスでも効果が発動する
		timing: "end", // 全員の効果処理が終わった後実行する
		creation: 3, // 3枚のコインを取得
	},
	inventory: 6,
};
