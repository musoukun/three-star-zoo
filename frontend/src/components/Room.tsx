import React, { useState, useEffect, useCallback } from "react";
import { Socket } from "socket.io-client";
import GameBoard from "./GameBoard";
import animalCardsMock from "./animalCardsMock";
import type { Player, GameState, GameRoom } from "../types/types";
import { useSetRecoilState } from "recoil";
import { gameStateAtom } from "../atoms/atoms";
import { getOrCreatePlayerId } from "../utils/uuid";

interface RoomProps {
	socket: Socket | null;
	roomId: string;
	onLeaveRoom: () => void;
}

/**
 * ルームコンポーネント
 * プレイヤーの管理、ゲームの開始、ルームからの退出を処理します
 */
const Room: React.FC<RoomProps> = ({ socket, roomId, onLeaveRoom }) => {
	const [players, setPlayers] = useState<Player[]>([]);
	const [isOwner, setIsOwner] = useState(false);
	const [gameStarted, setGameStarted] = useState(false); // ゲームが開始されたかどうか
	const setGameState = useSetRecoilState(gameStateAtom); // ゲーム状態を更新する関数
	const playerId = getOrCreatePlayerId(); // プレイヤーIDを取得

	/**
	 * ルーム情報を取得する
	 */
	const fetchRoomInfo = useCallback(() => {
		if (socket) {
			socket.emit(
				"getRoomInfo",
				{ roomId },
				(roomInfo: GameRoom | null) => {
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
		}
	}, [socket, roomId, playerId, setGameState, onLeaveRoom]);

	/**
	 * ソケットイベントのハンドラーをセットアップする
	 */
	const setupSocketHandlers = useCallback(() => {
		if (!socket) return;

		const handleRoomUpdate = (updatedPlayers: Player[]) => {
			setPlayers(updatedPlayers);
			console.log("Room updated, new player list:", updatedPlayers);
		};

		const handleOwnerUpdate = (ownerId: string) => {
			setIsOwner(ownerId === playerId);
			console.log("Owner updated, new owner ID:", ownerId);
		};

		const handleGameStarted = (initialGameState: GameState) => {
			setGameState(initialGameState);
			setGameStarted(true);
			console.log("Received initial game state:", initialGameState);
		};

		const handlePlayerJoined = (newPlayer: Player) => {
			setPlayers((prevPlayers) => [...prevPlayers, newPlayer]);
			console.log("New player joined:", newPlayer);
		};

		const handlePlayerLeft = (leftPlayerId: string) => {
			setPlayers((prevPlayers) =>
				prevPlayers.filter((player) => player.id !== leftPlayerId)
			);
			console.log("Player left:", leftPlayerId);
		};

		socket.on("roomUpdate", handleRoomUpdate);
		socket.on("ownerUpdate", handleOwnerUpdate);
		socket.on("gameStarted", handleGameStarted);
		socket.on("playerJoined", handlePlayerJoined);
		socket.on("playerLeft", handlePlayerLeft);

		return () => {
			socket.off("roomUpdate", handleRoomUpdate);
			socket.off("ownerUpdate", handleOwnerUpdate);
			socket.off("gameStarted", handleGameStarted);
			socket.off("playerJoined", handlePlayerJoined);
			socket.off("playerLeft", handlePlayerLeft);
		};
	}, [socket, playerId, setGameState]);

	// マウント時にルーム情報を取得し、ソケットイベントのハンドラーをセットアップする
	useEffect(() => {
		fetchRoomInfo();
		// socketが変更された場合に再度ルーム情報を取得する
		const cleanupSocketHandlers = setupSocketHandlers(); // クリーンアップ関数を取得

		// ページを離れる際にルームから退出する
		const handleBeforeUnload = (event: BeforeUnloadEvent) => {
			socket?.emit("leaveRoom", roomId);
			event.preventDefault();
		};

		// ページを離れる際に確認ダイアログを表示する
		window.addEventListener("beforeunload", handleBeforeUnload);

		return () => {
			// typeofとしているのは、cleanupSocketHandlersが関数であるかどうかをチェックするため
			// undefinedの場合は関数を呼び出すとエラーになるため
			if (typeof cleanupSocketHandlers === "function") {
				cleanupSocketHandlers();
			}
			window.removeEventListener("beforeunload", handleBeforeUnload);
		};
	}, [socket, roomId, fetchRoomInfo, setupSocketHandlers]);

	/**
	 * ゲームを開始する
	 */
	const startGame = useCallback(() => {
		if (socket && isOwner) {
			console.log("Attempting to start game");
			const startPlayerIndex = 0;
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
	}, [socket, isOwner, players, roomId, playerId, setGameState]);

	/**
	 * ルームから退出する
	 */
	const leaveRoom = useCallback(() => {
		if (socket) {
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
	}, [socket, roomId, playerId, onLeaveRoom]);

	if (gameStarted) {
		return (
			<div className="">
				<GameBoard
					socket={socket as Socket}
					roomId={roomId}
					animalCards={animalCardsMock}
				/>
			</div>
		);
	}

	return (
		<div className="container mx-auto">
			<h1 className="text-4xl font-bold mb-8 text-center">
				Room: {roomId}
			</h1>
			<RoomInfo
				players={players}
				isOwner={isOwner}
				socket={socket}
				startGame={startGame}
				leaveRoom={leaveRoom}
			/>
		</div>
	);
};

/**
 * ルーム情報コンポーネント
 * プレイヤーリストとゲーム開始/退出ボタンを表示します
 */
const RoomInfo: React.FC<{
	players: Player[];
	isOwner: boolean;
	socket: Socket | null;
	startGame: () => void;
	leaveRoom: () => void;
}> = ({ players, isOwner, socket, startGame, leaveRoom }) => (
	<div className="bg-white p-6 rounded shadow">
		<h2 className="text-2xl font-semibold mb-4">Players:</h2>
		<PlayerList players={players} socket={socket} isOwner={isOwner} />
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
);

/**
 * プレイヤーリストコンポーネント
 * ルーム内のプレイヤーを表示します
 */
const PlayerList: React.FC<{
	players: Player[];
	socket: Socket | null;
	isOwner: boolean;
}> = ({ players, socket, isOwner }) => (
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
);

export default Room;
