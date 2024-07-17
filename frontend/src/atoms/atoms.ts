import { GameState, Player } from "../types/types";
import { atomFamily } from "recoil";
import { atom } from "recoil";

// 現在自分のターン中のプレイヤー情報を表すAtom
export const currentPlayerAtom = atom<Player>({
	key: "currentPlayerAtom",
	default: {
		id: "",
		name: "",
	},
});

// プレイヤー情報を更新する関数
// 呼び出し方: setCurrentPlayer({ id: "1", name: "プレイヤー1", ... })
export const currentPlayerSetter = atomFamily<Player | null, string>({
	key: "currentPlayerSetter",
	default: null,
});
// プレイヤー情報を取得する関数
// 呼び出し方: currentPlayerGetter("1")
export const currentPlayerGetter = atomFamily<Player | null, string>({
	key: "currentPlayerGetter",
	default: null,
});

export const gameStateAtom = atom<GameState>({
	key: "gameStateAtom",
	default: {
		players: [],
		currentPlayer: undefined,
		phase: "waiting",
		roundNumber: 1, // ラウンド数
	},
});
