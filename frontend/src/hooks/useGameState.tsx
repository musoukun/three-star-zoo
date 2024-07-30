import { atom, useRecoilState } from "recoil";
import { GameState } from "../types/types";
import { useCallback, useMemo } from "react";
import { getOrCreatePlayerId } from "../utils/uuid";
import { rollingAtom } from "../atoms/atoms";

// GameState用のatomを作成
const gameStateAtom = atom<GameState>({
	key: "gameStateAtom",
	default: {} as GameState,
});

export const useGameState = () => {
	const [rolling, setRolling] = useRecoilState<boolean>(rollingAtom);
	const [gameState, setGameState] = useRecoilState(gameStateAtom);
	const playerId = useMemo(() => getOrCreatePlayerId(), []);

	const updateGameState = useCallback(
		(newGameState: GameState) => {
			setGameState(newGameState);
		},
		[setGameState]
	);

	const myPlayer = useMemo(
		() => gameState.players?.find((player) => player.id === playerId),
		[gameState.players, playerId]
	);

	const currentPlayer = useMemo(
		() => gameState.players?.find((player) => player.current),
		[gameState.players]
	);

	const otherPlayers = useMemo(
		() =>
			gameState.players?.filter((player) => player.id !== playerId) || [],
		[gameState.players, playerId]
	);

	const isCurrentTurn = useMemo(() => myPlayer?.current || false, [myPlayer]);

	return {
		gameState,
		updateGameState,
		myPlayer,
		currentPlayer,
		otherPlayers,
		isCurrentTurn,
		playerId,
		phase: gameState.phase,
		myPlayerBoard: myPlayer?.board || {},
		myPlayerAction: myPlayer?.action || "INIT",
		myPlayerDiceResult: myPlayer?.diceResult || null,
		myPlayerInventory: myPlayer?.inventory || [],
		setRolling,
		rolling,
	};
};
