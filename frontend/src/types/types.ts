// src/types/types.ts

import { ActionState } from "./ActionState";
import { AnimalColor } from "./AnimalColor";
import { Effect } from "./AnimalEffect";

export type User = {
	id: string | undefined; // ルームに入室するときにfrontend側で設定するUUID
	name: string;
};

export type Animal = {
	id: string;
	name?: string;
	cost?: number;
	poops?: number;
	color?: AnimalColor[];
	effect?: Effect;
	inventory?: Animal[];
	global?: boolean;
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
	action?: ActionState;
	turnCount?: number;
	turnOrder?: number;
	poops?: number;
	board?: Board;
	diceResult?: number;
	money?: number;
	star?: number;
	inventory?: Animal[];
	owner?: boolean;
	startPlayer?: boolean;
	current?: boolean;
};

export type Room = {
	id: string;
	name: string;
	password: string;
	players: Player[];
	ownerId: string;
	gameState: GameState | null;
};

export type GameState = {
	players: Player[];
	currentPlayer?: Player;
	phase: "waiting" | "init" | "main" | "end";
	roundNumber: number;
	// 他のゲーム全体に関する状態をここに追加
};

export type AnimalCard = {
	id: number;
	name: string;
	color: string;
	image: string;
	stats: { label: string; value: number }[];
};
