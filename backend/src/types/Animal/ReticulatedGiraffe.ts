import { Animal } from "../Animal";
import { AnimalColor } from "../AnimalColor";

export const ReticulatedGiraffe: Animal = {
	id: "ReticulatedGiraffe",
	name: "アミメキリン",
	cost: 4,
	poops: 1,
	color: [AnimalColor.GREEN],
	effect: {
		global: true, //	ほかのどのプレイヤーのダイスでも効果が発動する
		timing: "first",
		creation: 3, // 3枚のコインを取得
		adjacent: [1, "ReticulatedGiraffe", "once"], //自分のアミメキリンの隣のエリアの値が出た場合は、Coinを+1する
	},
	inventory: 8,
	global: true,
	effectchoise: true,
};
