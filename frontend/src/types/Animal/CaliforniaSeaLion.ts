import { Animal } from "../types";
import { AnimalColor } from "../AnimalColor";

export const CaliforniaSeaLion: Animal = {
	id: "CaliforniaSeaLion",
	name: "カリフォルニアアシカ",
	cost: 3,
	poops: 0,
	color: [AnimalColor.BLUE],
	effect: {
		global: false,
		timing: "first",
		creation: 3, // 3枚のコインを取得
		steal: [2, "target"], // 1人指定して2枚奪う
	},
	inventory: 4,
};
