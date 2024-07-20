import { useRecoilState, useRecoilValue } from "recoil";
import { gameStateAtom, myPlayerAtomFamily, rollingAtom } from "../atoms/atoms";
import { GameState, Player } from "../types/types";
import { useMemo } from "react";
import { getOrCreatePlayerId } from "../utils/uuid";

export const useGameState = () => {
	const [gameState, setGameState] = useRecoilState<GameState>(gameStateAtom);
	const [rolling, setRolling] = useRecoilState<boolean>(rollingAtom);

	const playerId = useMemo(() => getOrCreatePlayerId(), []);
	const myPlayer = useRecoilValue(myPlayerAtomFamily(playerId));

	const gameStateData = useMemo(() => {
		return {
			gameState,
			myPlayer,
			isCurrentTurn: myPlayer?.current ?? false,
			myPlayerBoard: myPlayer?.board ?? {},
			myPlayerAction: myPlayer?.action ?? "INIT",
			myPlayerDiceResult: myPlayer?.diceResult ?? null,
			myPlayerInventory: myPlayer?.inventory ?? [],
			phase: gameState.phase,
			rolling,
		};
	}, [gameState, myPlayer, rolling]);

	const updateGameState = (newGameState: GameState) => {
		setGameState(newGameState);
	};

	const getCurrentPlayer = (players: Player[]) => {
		return players.find((player) => player.current) || null;
	};

	return {
		...gameStateData,
		updateGameState,
		setRolling,
		getCurrentPlayer,
		playerId,
	};
};
