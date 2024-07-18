import { ActionState } from "./ActionState";
import { AnimalColor } from "./AnimalColor";
import { Effect } from "./AnimalEffect";

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

export type Animal = {
	id: string;
	name?: string; // nameをオプショナルに変更
	cost?: number;
	poops?: number;
	color?: AnimalColor[];
	effect?: Effect;
	global?: boolean;
};

export type Player = {
	id: string | undefined;
	name: string;
	action: ActionState; // actionをオプショナルから必須に変更
	turnCount: number; // turnCountを必須に変更
	turnOrder: number; // turnOrderを必須に変更
	poops: number; // poopsを必須に変更
	board: Board; // boardを必須に変更
	money: number; // moneyを必須に変更
	star: number; // starを必須に変更
	inventory: Animal[];
	diceResult?: number;
	owner?: boolean;
	startPlayer: boolean; // startPlayerを必須に変更
	current: boolean; // currentを必須に変更
};
export interface GameState {
	players: Player[];
	currentPlayer?: Player | null;
	phase: "waiting" | "init" | "main" | "end";
	roundNumber: number;
	isTestMode?: boolean;
}

export type Room = {
	id: string;
	name: string;
	password: string;
	players: Player[] | User[];
	ownerId: string;
	gameState: GameState | null;
	version?: number;
};
