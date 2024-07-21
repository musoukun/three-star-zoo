import { GameState, Player, ResultPoops } from "../types/types";
import { atom, atomFamily, selectorFamily } from "recoil";

// 現在自分のターン中のプレイヤー情報を表すAtom
export const currentPlayerAtom = atom<Player>({
	key: "currentPlayerAtom",
	default: {
		id: "",
		name: "",
	},
});

// // プレイヤー情報を更新する関数
// // 呼び出し方: setCurrentPlayer({ id: "1", name: "プレイヤー1", ... })
// export const currentPlayerSetter = atomFamily<Player | null, string>({
// 	key: "currentPlayerSetter",
// 	default: null,
// });
// // プレイヤー情報を取得する関数
// // 呼び出し方: currentPlayerGetter("1")
// export const currentPlayerGetter = atomFamily<Player | null, string>({
// 	key: "currentPlayerGetter",
// 	default: null,
// });

export const gameStateAtom = atom<GameState>({
	key: "gameStateAtom",
	default: {
		players: [],
		currentPlayer: undefined,
		phase: "waiting",
		roundNumber: 1, // ラウンド数
		poopsResult: [], // この行を追加
		version: 1, // この行を追加
	},
});

export const myPlayerAtom = atom<Player | null>({
	key: "myPlayerAtom",
	default: null,
});

export const myPlayerAtomFamily = atomFamily<Player | null, string>({
	key: "playerAtom",
	default: selectorFamily({
		key: "playerDefault",
		get:
			(playerId) =>
			({ get }) => {
				const gameState = get(gameStateAtom);
				return (
					gameState.players.find(
						(player) => player.id === playerId
					) ?? null
				);
			},
	}),
});

export const rollingAtom = atom<boolean>({
	key: "rollingAtom",
	default: false,
});

// うんちの結果を表示するかどうかの状態を管理するAtom
export const showPoopResultsAtom = atom<boolean>({
	key: "showPoopResultsAtom",
	default: false,
});

// ダイスの結果を表示するかどうかの状態を管理するAtom
export const showDiceResultAtom = atom<boolean>({
	key: "showDiceResultAtom",
	default: false,
});

// const [poopResults, setPoopResults] = useState<ResultPoops[]>([]);
// ↑と同じAtom
export const poopResultsAtom = atom<ResultPoops[] | null>({
	key: "poopResultsAtom",
	default: null,
});

export const diceResultAtom = atom<number[] | null>({
	key: "diceResultAtom",
	default: null,
});
