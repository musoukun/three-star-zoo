import { BottlenoseDolphin } from "../types/Animal/BottlenoseDolphin";
import { Cheetah } from "../types/Animal/Cheetah";
import { Lion } from "../types/Animal/Lion";
import { ReticulatedGiraffe } from "../types/Animal/ReticulatedGiraffe";
import { Board, Cage } from "../types/types";

const createEmptyCage = (): Cage => ({
	animals: [],
	max: 4,
});

const createTestCage = (): Cage => ({
	animals: [BottlenoseDolphin, Cheetah, Lion, ReticulatedGiraffe],
	max: 4,
});

export const initialBoard: Board = {
	cage1: createEmptyCage(),
	cage2: createEmptyCage(),
	cage3: createEmptyCage(),
	cage4: createEmptyCage(),
	cage5: createEmptyCage(),
	cage6: createTestCage(), // todo: test後にもどす
	cage7: createEmptyCage(),
	cage8: createEmptyCage(),
	cage9: createEmptyCage(),
	cage10: createEmptyCage(),
	"cage11-12": createEmptyCage(),
};
