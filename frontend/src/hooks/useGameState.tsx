import { useRecoilState, useRecoilValue } from "recoil";
import { gameStateAtom, myPlayerAtomFamily, rollingAtom } from "../atoms/atoms";
import { GameState, EmitGameState, Player } from "../types/types";
import { useMemo } from "react";
import { getOrCreatePlayerId } from "../utils/uuid";

export const useGameState = () => {
	const [gameState, setGameState] = useRecoilState<GameState>(gameStateAtom);
	const [rolling, setRolling] = useRecoilState<boolean>(rollingAtom);

	const playerId = useMemo(() => getOrCreatePlayerId(), []);
	const myPlayer = useRecoilValue(myPlayerAtomFamily(playerId));

	const updateGameState = (newGameState: GameState | EmitGameState) => {
		// if ("emitGameState" in newGameState) {
		// 	setGameState(
		// 		(newGameState as EmitGameState).updatedGameState as GameState
		// 	);
		// } else {
		setGameState(newGameState as GameState);
		// }
	};

	const currentPlayer: Player | null | undefined = useMemo(
		() => gameState.players.find((player) => player.current),
		[gameState.players]
	);

	const otherPlayers = useMemo(
		() =>
			gameState.players.filter(
				(player) => player.id !== currentPlayer?.id
			),
		[gameState.players, currentPlayer]
	);

	const gameStateData = useMemo(() => {
		return {
			// 名前変えたい
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
			currentPlayer: currentPlayer,
		};
	}, [gameState, myPlayer, rolling]);

	return {
		...gameStateData,
		updateGameState,
		setRolling,
		playerId,
	};
};
