import { ActionState } from "./ActionState";
import { AnimalColor } from "./AnimalColor";

export type User = {
	id: string; // ルームに入室するときにfrontend側で設定するUUID
	name: string;
};

export type Cage = {
	animals: Animal[];
	max: number;
};

export type Board = {
	[key: string]: Cage;
};

export type Player = {
	id: string | undefined;
	name: string;
	action: ActionState; // actionをオプショナルから必須に変更
	poops: number; // poopsを必須に変更
	board: Board; // boardを必須に変更
	money: number; // moneyを必須に変更
	star: number; // starを必須に変更
	inventory: Animal[];
	diceResult?: number;
	owner: boolean;
	startPlayer: boolean; // startPlayerを必須に変更
	current: boolean; // currentを必須に変更
	turnCount: number; // turnCountを必須に変更
	turnOrder: number; // turnOrderを必須に変更
};

export type GameState = {
	players: Player[];
	currentPlayer?: Player | null;
	phase: "waiting" | "init" | "main" | "end";
	roundNumber: number;
	isTestMode?: boolean;
};

export type Phase = "waiting" | "init" | "main" | "end";

export type GameRoom = {
	id: string;
	name: string;
	password: string;
	players: Player[] | User[];
	gameState: GameState | null;
	prevGameState?: GameState | null;
	ownerId: string;
	version?: number;
};

export { ActionState };

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
