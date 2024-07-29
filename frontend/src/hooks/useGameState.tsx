import { useRecoilState, useRecoilValue } from "recoil";
import { gameStateAtom, myPlayerAtomFamily, rollingAtom } from "../atoms/atoms";
import { GameState, EmitGameState, Player } from "../types/types";
import { useCallback, useMemo, useState } from "react";
import { getOrCreatePlayerId } from "../utils/uuid";

export const useGameState = () => {
	const [gameState, setGameState] = useRecoilState<GameState>(gameStateAtom);
	const [rolling, setRolling] = useRecoilState<boolean>(rollingAtom);

	const playerId = useMemo(() => getOrCreatePlayerId(), []);
	const myPlayer = useRecoilValue(myPlayerAtomFamily(playerId));

	// currentPlayer と otherPlayers を useState で管理
	const [currentPlayer, setCurrentPlayer] = useState<
		Player | null | undefined
	>(() => gameState.players.find((player) => player.current));

	const [otherPlayers, setOtherPlayers] = useState<Player[]>(() =>
		gameState.players.filter((player) => player.id !== currentPlayer?.id)
	);

	// updateGameState を useCallback でメモ化し、依存配列に setCurrentPlayer と setOtherPlayers を追加
	const updateGameState = useCallback(
		(newGameState: GameState | EmitGameState) => {
			const updatedGameState = newGameState as GameState;
			setGameState(updatedGameState);

			// currentPlayer と otherPlayers を更新
			const newCurrentPlayer = updatedGameState.players.find(
				(player) => player.current
			);
			setCurrentPlayer(newCurrentPlayer);
			setOtherPlayers(
				updatedGameState.players.filter(
					(player) => player.id !== newCurrentPlayer?.id
				)
			);
		},
		[setGameState, setCurrentPlayer, setOtherPlayers]
	);

	// gameStateData を直接返すオブジェクトとして定義
	const gameStateData = {
		gameState,
		myPlayer,
		otherPlayers,
		isCurrentTurn: myPlayer?.current ?? false,
		myPlayerBoard: myPlayer?.board ?? {},
		myPlayerAction: myPlayer?.action ?? "INIT",
		myPlayerDiceResult: myPlayer?.diceResult ?? null,
		myPlayerInventory: myPlayer?.inventory ?? [],
		phase: gameState.phase,
		rolling,
		currentPlayer,
	};

	return {
		...gameStateData,
		updateGameState,
		setRolling,
		playerId,
	};
};
