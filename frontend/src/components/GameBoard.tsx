import React, { useEffect, useState, useCallback } from "react";
import { Socket } from "socket.io-client";
import { useRecoilState } from "recoil";
import { gameStateAtom } from "../atoms/atoms";
import { getOrCreatePlayerId } from "../utils/uuid";
import {
	Animal,
	AnimalCard as AnimalCardType,
	Board,
	GameState,
	Player,
} from "../types/types";
import AreaBoard from "./AreaBoard";
import OtherPlayer from "./OtherPlayer";
import AnimalCardList from "./AnimalCardList";
import { ActionState } from "../types/ActionState";

interface GameBoardProps {
	socket: Socket;
	roomId: string;
	animalCards: AnimalCardType[];
}

const GameBoard: React.FC<GameBoardProps> = ({
	socket,
	roomId,
	animalCards,
}) => {
	const [gameState, setGameState] = useRecoilState<GameState>(gameStateAtom);
	const [playerId, setPlayerId] = useState<string>(getOrCreatePlayerId());
	const [myPlayerData, setMyPlayerData] = useState<Player | undefined>();
	const [isCurrentTurn, setIsCurrentTurn] = useState<boolean>(false);
	const [localVersion, setLocalVersion] = useState<number>(0);

	const getCurrentPlayer = useCallback((players: Player[]) => {
		return players.find((player) => player.current) || null;
	}, []);

	const updateGameState = useCallback(
		(newGameState: GameState, version: number) => {
			// この処理の説明：新しいゲーム状態がローカルの状態よりも新しい場合、ローカルの状態を更新する
			if (version > localVersion) {
				console.log("Updating game state:", newGameState);
				setGameState(newGameState);
				setLocalVersion(version);
				const updatedMyPlayer = newGameState.players.find(
					(player) => player.id === playerId
				);
				if (updatedMyPlayer) {
					console.log("Updating my player data:", updatedMyPlayer);
					setMyPlayerData(updatedMyPlayer);
				}
				setIsCurrentTurn(updatedMyPlayer?.current || false);
			}
		},
		[localVersion, playerId, setGameState]
	);

	useEffect(() => {
		setPlayerId(getOrCreatePlayerId());
	}, []);

	useEffect(() => {
		if (gameState && playerId) {
			const myPlayer = gameState.players.find(
				(player) => player.id === playerId
			);
			if (myPlayer) {
				setMyPlayerData(myPlayer);
				setIsCurrentTurn(myPlayer.current as boolean);
			}
		}
	}, [gameState, playerId]);

	useEffect(() => {
		const handleGameStarted = (newGameStateData: GameState) => {
			console.log("Game started:", newGameStateData);
			updateGameState(newGameStateData, 0);
		};

		const handleGameStateUpdate = (
			newGameStateData: GameState,
			version: number
		) => {
			console.log(
				"Received new game state:",
				newGameStateData,
				"version:",
				version
			);
			updateGameState(newGameStateData, version);
		};

		socket.on("gameStarted", handleGameStarted);
		socket.on("gameStateUpdate", handleGameStateUpdate);

		return () => {
			socket.off("gameStarted", handleGameStarted);
			socket.off("gameStateUpdate", handleGameStateUpdate);
		};
	}, [socket, updateGameState]);

	const handleCageClick = useCallback(
		(cageNumber: string, animal: Animal) => {
			console.log(
				`Emitting cageClick: cageNumber=${cageNumber}, animal=${animal.id}, playerId=${playerId}`
			);

			socket.emit(
				"cageClick",
				{ roomId, cageNumber, animalId: animal.id, playerId },
				(success: boolean, serverGameState: GameState | null) => {
					if (success && serverGameState) {
						updateGameState(serverGameState, localVersion + 1);
					} else {
						socket.emit("getGameState", { roomId });
					}
				}
			);
		},
		[socket, roomId, playerId, localVersion, updateGameState]
	);

	if (!gameState || !gameState.players) {
		return <div>Loading...</div>;
	}

	const currentPlayer = getCurrentPlayer(gameState.players);
	const otherPlayers = gameState.players.filter(
		(player) => player.id !== playerId
	);

	return (
		<div className="flex flex-col h-screen bg-[#f0e6d2] font-crimson-text">
			<div className="p-4 bg-blue-100">
				<h2 className="text-xl font-bold">
					現在のプレイヤー: {currentPlayer?.name}
				</h2>
				<h3 className="text-xl">ターンの状態: {gameState?.phase}</h3>
				<h3 className="text-xl">ラウンド: {gameState?.roundNumber}</h3>
				<h3 className="text-xl">うんち: {currentPlayer?.poops || 0}</h3>
				{currentPlayer?.diceResult !== undefined && (
					<h3 className="text-xl">
						ダイスの結果: {currentPlayer.diceResult}
					</h3>
				)}
			</div>
			<div className="flex flex-1 overflow-hidden">
				<div className="w-2/3 p-4 overflow-y-auto">
					{otherPlayers.map((player: Player) => (
						<OtherPlayer
							key={player.id}
							player={player}
							isCurrentTurn={
								player.id === gameState?.currentPlayer?.id
							}
						/>
					))}
				</div>
				<div className="w-1/2 flex flex-wrap justify-center content-start p-4 overflow-y-auto bg-gray-100">
					<AnimalCardList AnimalCards={animalCards} />
				</div>
			</div>
			<div className="h-1/3 p-4 bg-white shadow-lg">
				{myPlayerData && (
					<AreaBoard
						board={myPlayerData.board as Board}
						isCurrentTurn={isCurrentTurn}
						onCageClick={handleCageClick}
						phase={gameState.phase}
						action={myPlayerData.action as ActionState}
						socket={socket}
						roomId={roomId}
						playerId={playerId}
						diceResult={myPlayerData.diceResult || null}
						inventory={myPlayerData.inventory as Animal[]}
					/>
				)}
			</div>
		</div>
	);
};

export default GameBoard;
