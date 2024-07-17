import { ActionState } from "./ActionState";
import { AnimalColor } from "./AnimalColor";
import { Effect } from "./AnimalEffect";

export type RoomType = {
	id: string;
	name: string;
	password: string;
	players: Player[];
	ownerId: string;
	gameState: GameState | null;
	version?: number;
};

export type User = {
	id: string; // ルームに入室するときにfrontend側で設定するUUID
	name: string;
};

export type Animal = {
	id: string;
	name: string;
	cost: number;
	poops: number;
	color: AnimalColor[];
	effect: Effect;
	inventory: number;
	global: boolean;
};

export type Cage = {
	animals: Animal[];
	max: number;
};

export interface Board {
	[key: string]: Cage;
}

export type Player = {
	id: string | undefined;
	name: string;
	action: ActionState;
	turnCount?: number;
	turnOrder?: number;
	poops?: number;
	board: Board;
	money: number;
	diceResult?: number;
	star?: number;
	inventory: Animal[];
	owner?: boolean;
	startPlayer?: boolean;
	current?: boolean;
};

export interface GameState {
	players: Player[];
	currentPlayer: Player | null;
	phase: "waiting" | "init" | "main" | "end";
	roundNumber: number;
}

export type Room = {
	id: string;
	name: string;
	password: string;
	players: Player[] | User[];
	ownerId: string;
	gameState: GameState | null;
};
