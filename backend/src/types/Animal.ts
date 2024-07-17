// Animal.ts
import { AnimalColor } from "./AnimalColor";
import { Effect } from "./AnimalEffect";

export type Animal = {
	id: string;
	name?: string;
	cost?: number;
	poops?: number;
	color?: AnimalColor[];
	effect?: Effect;
	inventory?: number;
	global?: boolean;
	effectchoise?: boolean;
};
