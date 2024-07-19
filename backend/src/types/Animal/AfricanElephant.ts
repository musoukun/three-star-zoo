import { Animal } from "../types";
import { AnimalColor } from "../AnimalColor";

export const AfricanElephant: Animal = {
	id: "AfricanElephant",
	name: "アフリカゾウ",
	cost: 6,
	poops: 3,
	color: [AnimalColor.GREEN],
	effect: {
		global: true,
		timing: "first",
		creation: 7, // Coinを7枚取得
	},
	inventory: 6,
};
