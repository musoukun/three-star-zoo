import { useRecoilState } from "recoil";
import { gameStateAtom } from "../atoms/atoms";
import { GameState, Player } from "../types/types";
import { useCallback, useState, useEffect } from "react";
import { getOrCreatePlayerId } from "../utils/uuid";

export const useGameState = () => {
	const [gameState, setGameState] = useRecoilState<GameState>(gameStateAtom);
	const [playerId, setPlayerId] = useState<string>(getOrCreatePlayerId());
	const [myPlayerData, setMyPlayerData] = useState<Player | undefined>();
	const [isCurrentTurn, setIsCurrentTurn] = useState<boolean>(false);

	const updateGameState = useCallback(
		(newGameState: GameState) => {
			setGameState(newGameState);

			const updatedMyPlayer = newGameState.players.find(
				(player) => player.id === playerId
			);
			if (updatedMyPlayer) {
				setMyPlayerData(updatedMyPlayer);
				setIsCurrentTurn(updatedMyPlayer.current as boolean);
			}
		},
		[playerId, setGameState]
	);

	useEffect(() => {
		const id = getOrCreatePlayerId();
		setPlayerId(id);
	}, []);

	const getCurrentPlayer = useCallback((players: Player[]) => {
		return players.find((player) => player.current) || null;
	}, []);

	return {
		gameState,
		updateGameState,
		playerId,
		myPlayerData,
		isCurrentTurn,
		getCurrentPlayer,
	};
};
