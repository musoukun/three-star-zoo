import { useRecoilState } from "recoil";
import { gameStateAtom, myPlayerAtom, rollingAtom } from "../atoms/atoms";
import { GameState, Player } from "../types/types";
import { useCallback } from "react";
import { getOrCreatePlayerId } from "../utils/uuid";

export const useGameState = () => {
	const [gameState, setGameState] = useRecoilState<GameState>(gameStateAtom);
	const [myPlayer, setMyPlayer] = useRecoilState<Player | null>(myPlayerAtom);
	const [rolling, setRolling] = useRecoilState<boolean>(rollingAtom);

	const playerId = getOrCreatePlayerId();

	const updateGameState = useCallback(
		(newGameState: GameState) => {
			setGameState(newGameState);

			const updatedMyPlayer = newGameState.players.find(
				(player) => player.id === playerId
			);
			if (updatedMyPlayer) {
				setMyPlayer(updatedMyPlayer);
			}
		},
		[playerId, setGameState, setMyPlayer]
	);

	// 自分のターンかどうか
	// この関数は外部から呼び出したときに常に最新の値を返すようにuseCallbackでラップする

	const isCurrentTurn = useCallback(() => {
		return (
			gameState?.players.find((player) => player.id === playerId)
				?.current ?? false
		);
	}, [gameState, playerId]);

	const getCurrentPlayer = useCallback((players: Player[]) => {
		return players.find((player) => player.current) || null;
	}, []);

	const getPhase = useCallback(() => gameState?.phase ?? "INIT", [gameState]);
	const getMyPlayer = useCallback(() => {
		return (
			gameState?.players.find((player) => player.id === playerId) ?? null
		);
	}, [gameState, playerId]);
	// myPlayerから必要な値を取得するヘルパー関数
	const getMyPlayerBoard = () => myPlayer?.board ?? {};
	const getMyPlayerAction = () => myPlayer?.action ?? "INIT";
	const getMyPlayerDiceResult = () => myPlayer?.diceResult ?? null;
	const getMyPlayerInventory = () => myPlayer?.inventory ?? [];

	return {
		gameState,
		updateGameState,
		playerId,
		myPlayer,
		isCurrentTurn,
		getCurrentPlayer,
		rolling,
		setRolling,
		getMyPlayer,
		getMyPlayerBoard,
		getMyPlayerAction,
		getMyPlayerDiceResult,
		getMyPlayerInventory,
		getPhase,
	};
};
