export type Effect = {
	global: boolean;
	timing: string;
	creation: number;
	creationIf?: string[]; // そのまま条件式を各
	steal?: [number, string, number?, string?]; // 第２引数にtargetかanyoneが入る、第３引数はstealの人数が入る,第4引数はstarかcoin
	buff?: [number, string, string]; //Animalのidが第2引数に入る, 第3引数はonceかeach
	bonusbuff?: [number, string, string];
	bonussteal?: number;
	stealIf?: string[]; // そのまま条件式をかく
	choice?: string[];
	adjacent?: [number, string, string]; // 隣接しているときの項目、第1引数に得られる数、第2引数にAnimalのidが入る、第3引数はonceかeach
};
