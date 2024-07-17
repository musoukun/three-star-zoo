import { Animal } from "../Animal";
import { AnimalColor } from "../AnimalColor";

export const BottlenoseDolphin: Animal = {
	id: "BottlenoseDolphin",
	name: "バンドウイルカ",
	cost: 6,
	poops: 0,
	color: [AnimalColor.BLUE],
	effect: {
		global: false,
		timing: "first",
		creation: 7, // 7枚のコインを取得
		steal: [5, "target", 1], // 1人指定して5枚奪う
		choice: ["creation", "steal"], // どちらかを選択、 7枚取得か5枚奪うか
	},
	inventory: 2,
};
