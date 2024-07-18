import { Board, Cage } from "../types/types";

const createEmptyCage = (): Cage => ({
	animals: [],
	max: 4,
});

export const initialBoard: Board = {
	cage1: createEmptyCage(),
	cage2: createEmptyCage(),
	cage3: createEmptyCage(),
	cage4: createEmptyCage(),
	cage5: createEmptyCage(),
	cage6: createEmptyCage(),
	cage7: createEmptyCage(),
	cage8: createEmptyCage(),
	cage9: createEmptyCage(),
	cage10: createEmptyCage(),
	"cage11-12": createEmptyCage(),
};
