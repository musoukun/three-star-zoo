import { useRecoilState, useRecoilValue } from "recoil";
import { gameStateAtom, myPlayerAtom, rollingAtom } from "../atoms/atoms";
import { GameState, Player } from "../types/types";
import { useCallback, useMemo } from "react";
import { getOrCreatePlayerId } from "../utils/uuid";

export const useGameState = () => {
	const [gameState, setGameState] = useRecoilState<GameState>(gameStateAtom);
	const myPlayer = useRecoilValue<Player | null>(myPlayerAtom);
	const [rolling, setRolling] = useRecoilState<boolean>(rollingAtom);

	const playerId = useMemo(() => getOrCreatePlayerId(), []);

	const updateGameState = useCallback(
		(newGameState: GameState) => {
			setGameState(newGameState);
		},
		[setGameState]
	);

	const isCurrentTurn = useMemo(() => myPlayer?.current ?? false, [myPlayer]);

	const getMyPlayer = useCallback(() => {
		return (
			gameState.players.find((player) => player.id === playerId) ?? null
		);
	}, [gameState, playerId]);

	const getCurrentPlayer = useCallback((players: Player[]) => {
		return players.find((player) => player.current) || null;
	}, []);

	const getMyPlayerBoard = useCallback(
		() => myPlayer?.board ?? {},
		[myPlayer]
	);
	const getMyPlayerAction = useCallback(
		() => myPlayer?.action ?? "INIT",
		[myPlayer]
	);
	const getMyPlayerDiceResult = useCallback(
		() => myPlayer?.diceResult ?? null,
		[myPlayer]
	);
	const getMyPlayerInventory = useCallback(
		() => myPlayer?.inventory ?? [],
		[myPlayer]
	);
	const getPhase = useCallback(() => gameState.phase, [gameState]);

	return {
		gameState,
		updateGameState,
		playerId,
		myPlayer,
		isCurrentTurn,
		getCurrentPlayer,
		rolling,
		setRolling,
		getMyPlayerBoard,
		getMyPlayerAction,
		getMyPlayerDiceResult,
		getMyPlayerInventory,
		getPhase,
		getMyPlayer,
	};
};
