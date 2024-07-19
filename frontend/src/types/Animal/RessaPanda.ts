import { Animal } from "../types";
import { AnimalColor } from "../AnimalColor";

export const RessaPanda: Animal = {
	id: "RessaPanda",
	name: "レッサーパンダ",
	cost: 0,
	poops: 0,
	color: [AnimalColor.RED, AnimalColor.GREEN, AnimalColor.ORANGE],
	effect: {
		global: false,
		timing: "first",
		creation: 0,
		buff: [1, "RessaPanda", "each"], //自分のレッサーパンダの数だけ、自分のCoinを+1する
		bonusbuff: [1, "GiantPanda", "once"], //自分のBoardにジャイアントパンダがいる場合、+1Coinする
	},
	inventory: 8,
	global: false,
};
