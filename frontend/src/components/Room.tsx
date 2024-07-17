// src/components/Room.tsx
import React, { useState, useEffect } from "react";
import { Socket } from "socket.io-client";
import GameBoard from "./GameBoard";
import animalCardsMock from "./animalCardsMock";
import type { Player, Room, GameState } from "../types/types";
import { useSetRecoilState } from "recoil";
import { gameStateAtom } from "../atoms/atoms";
import { getOrCreatePlayerId } from "../utils/uuid";

interface RoomProps {
	socket: Socket | null;
	roomId: string;
	onLeaveRoom: () => void;
}

const Room: React.FC<RoomProps> = ({ socket, roomId, onLeaveRoom }) => {
	const [players, setPlayers] = useState<Player[]>([]);
	const [isOwner, setIsOwner] = useState(false);
	const [gameStarted, setGameStarted] = useState(false);
	const setGameState = useSetRecoilState(gameStateAtom);
	const playerId = getOrCreatePlayerId();

	useEffect(() => {
		if (socket) {
			socket.emit(
				"getRoomInfo",
				{ roomId, playerId },
				(roomInfo: Room | null) => {
					if (roomInfo) {
						setPlayers(roomInfo.players);
						setIsOwner(roomInfo.ownerId === playerId);
						if (roomInfo.gameState) {
							setGameState(roomInfo.gameState);
							setGameStarted(true);
						}
					} else {
						console.error("Failed to get room info");
						onLeaveRoom();
					}
				}
			);

			socket.on("roomUpdate", (updatedPlayers: Player[]) => {
				setPlayers(updatedPlayers);
				console.log("Room updated, new player list:", updatedPlayers);
			});

			socket.on("ownerUpdate", (ownerId: string) => {
				setIsOwner(ownerId === playerId);
				console.log("Owner updated, new owner ID:", ownerId);
			});

			socket.on("gameStarted", (initialGameState: GameState) => {
				setGameState(initialGameState);
				setGameStarted(true);
				console.log("Received initial game state:", initialGameState);
			});
			// 新しいイベントリスナーを追加
			socket.on("playerJoined", (newPlayer: Player) => {
				setPlayers((prevPlayers) => [...prevPlayers, newPlayer]);
				console.log("New player joined:", newPlayer);
			});

			socket.on("playerLeft", (leftPlayerId: string) => {
				setPlayers((prevPlayers) =>
					prevPlayers.filter((player) => player.id !== leftPlayerId)
				);
				console.log("Player left:", leftPlayerId);
			});
		}

		const handleBeforeUnload = (event: BeforeUnloadEvent) => {
			socket?.emit("leaveRoom", roomId);
			event.preventDefault();
			// event.returnValue = "";
		};

		window.addEventListener("beforeunload", handleBeforeUnload);

		return () => {
			window.removeEventListener("beforeunload", handleBeforeUnload);
			if (socket) {
				socket.off("roomUpdate");
				socket.off("ownerUpdate");
				socket.off("gameStarted");
				socket.off("playerJoined");
				socket.off("playerLeft");
			}
		};
	}, [socket, roomId, onLeaveRoom, setGameState]);

	const startGame = () => {
		if (socket && isOwner) {
			console.log("Attempting to start game");
			const startPlayerIndex = 0; // 一旦固定で先頭プレイヤーをスタートプレイヤーに設定
			const updatedPlayers = players.map((player, index) => ({
				...player,
				startPlayer: index === startPlayerIndex,
			}));
			socket.emit(
				"startGame",
				{ roomId, playerId, players: updatedPlayers },
				(success: boolean, updatedGameState: GameState) => {
					if (success) {
						setGameState(updatedGameState);
						setGameStarted(true);
						console.log("Game started successfully");
						console.log("Initial game state:", updatedGameState);
					} else {
						console.error("Failed to start game");
					}
				}
			);
		} else {
			console.error(
				"Cannot start game: not owner or socket not connected"
			);
		}
	};

	const leaveRoom = () => {
		if (socket) {
			const playerId = getOrCreatePlayerId();
			socket.emit(
				"leaveRoom",
				{ roomId, playerId },
				(success: boolean) => {
					if (success) {
						console.log("Successfully left the room");
					} else {
						console.error(
							"Failed to leave the room or room not found"
						);
					}
					onLeaveRoom();
				}
			);
		}
	};

	if (gameStarted) {
		return (
			<div className="container mx-auto">
				<GameBoard
					socket={socket as Socket}
					roomId={roomId}
					animalCards={animalCardsMock}
				/>
			</div>
		);
	}

	console.log("isOwner", isOwner);
	console.log("players.length", players.length);

	return (
		<div className="container mx-auto">
			<h1 className="text-4xl font-bold mb-8 text-center">
				Room: {roomId}
			</h1>
			<div className="bg-white p-6 rounded shadow">
				<h2 className="text-2xl font-semibold mb-4">Players:</h2>
				<ul className="space-y-2 mb-6">
					{players.map((player) => (
						<li
							key={player.id}
							className="bg-gray-100 p-2 rounded flex justify-between items-center"
						>
							<span>{player.name}</span>
							{player.id === socket?.id && (
								<span className="text-blue-500">(You)</span>
							)}
							{isOwner && player.id === socket?.id && (
								<span className="text-green-500">(Owner)</span>
							)}
						</li>
					))}
				</ul>
				<div className="flex justify-between">
					{isOwner && players.length >= 1 && (
						<button
							onClick={startGame}
							className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors"
						>
							Start Game
						</button>
					)}
					<button
						onClick={leaveRoom}
						className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
					>
						Leave Room
					</button>
				</div>
			</div>
		</div>
	);
};

export default Room;
