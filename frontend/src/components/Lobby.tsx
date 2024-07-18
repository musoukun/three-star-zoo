import React, { useState, useEffect, useRef, useCallback } from "react";
import { Socket } from "socket.io-client";
import axios from "axios";
import { GameState, Player } from "../types/types";
import { getOrCreatePlayerId } from "../utils/uuid";

export type Room = {
	id: string;
	name: string;
	password: string;
	players: Player[];
	ownerId: string;
	gameState: GameState | null;
};

interface LobbyProps {
	socket: Socket | null;
	setCurrentRoomId: (roomId: string) => void;
	setCurrentView: (view: "lobby" | "room") => void;
}

/**
 * ロビーコンポーネント
 * ルームの作成、参加、一覧表示を管理します
 */
const Lobby: React.FC<LobbyProps> = ({
	socket,
	setCurrentRoomId,
	setCurrentView,
}) => {
	const [rooms, setRooms] = useState<Room[]>([]);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
	const [errorMessage, setErrorMessage] = useState("");

	const newRoomNameRef = useRef<HTMLInputElement>(null);
	const newRoomPasswordRef = useRef<HTMLInputElement>(null);
	const playerNameRef = useRef<HTMLInputElement>(null);
	const joinPlayerNameRef = useRef<HTMLInputElement>(null);
	const joinPasswordRef = useRef<HTMLInputElement>(null);

	const fetchRooms = useCallback(async () => {
		try {
			const response = await axios.get("http://localhost:5000/api/rooms");
			setRooms(
				response.data.filter((room: Room) => room.players.length > 0)
			);
		} catch (error) {
			setRooms([]);
			console.error("Failed to fetch rooms:", error);
		}
	}, []);

	useEffect(() => {
		fetchRooms();
		if (socket) {
			setupSocketListeners(socket);
		}
		return () => {
			if (socket) {
				removeSocketListeners(socket);
			}
		};
	}, [socket, fetchRooms]);

	/**
	 * ソケットリスナーを設定する
	 */
	const setupSocketListeners = (socket: Socket) => {
		socket.on("roomListUpdate", fetchRooms);
		socket.on("roomPlayerCountUpdate", handleRoomPlayerCountUpdate);
	};

	/**
	 * ソケットリスナーを削除する
	 */
	const removeSocketListeners = (socket: Socket) => {
		socket.off("roomListUpdate", fetchRooms);
		socket.off("roomPlayerCountUpdate", handleRoomPlayerCountUpdate);
	};

	/**
	 * ルームのプレイヤー数更新を処理する
	 */
	const handleRoomPlayerCountUpdate = useCallback(
		(updatedRoom: Room) => {
			setRooms((prevRooms) =>
				prevRooms
					.map((room) =>
						room.id === updatedRoom.id
							? { ...room, players: updatedRoom.players }
							: room
					)
					.filter((room) => room.players.length > 0)
			);
			fetchRooms();
		},
		[fetchRooms]
	);

	/**
	 * ルームを作成する
	 */
	const createRoom = useCallback(() => {
		if (socket) {
			try {
				const playerId = getOrCreatePlayerId();
				const newRoomName = newRoomNameRef.current?.value || "";
				const newRoomPassword = newRoomPasswordRef.current?.value || "";
				const playerName = playerNameRef.current?.value || "";

				socket.emit(
					"createRoom",
					{
						name: newRoomName,
						password: newRoomPassword,
						playerName: playerName,
						playerId: playerId,
					},
					({ roomId }: { roomId: string }) => {
						console.log("Room created with ID:", roomId);
						setCurrentRoomId(roomId);
						setCurrentView("room");
					}
				);
			} catch (error) {
				console.error("Failed to create room:", error);
			}
		}
	}, [socket, setCurrentRoomId, setCurrentView]);

	/**
	 * 参加モーダルを開く
	 */
	const openJoinModal = useCallback((room: Room) => {
		setSelectedRoom(room);
		setErrorMessage("");
		setIsModalOpen(true);
	}, []);

	/**
	 * 参加モーダルを閉じる
	 */
	const closeJoinModal = useCallback(() => {
		setIsModalOpen(false);
		setSelectedRoom(null);
		setErrorMessage("");
	}, []);

	/**
	 * ルームに参加する
	 */
	const handleJoinRoom = useCallback(() => {
		if (!selectedRoom) return;

		const joinPlayerName = joinPlayerNameRef.current?.value || "";
		const joinPassword = joinPasswordRef.current?.value || "";

		if (!joinPlayerName.trim()) {
			setErrorMessage("プレイヤー名を入力してください。");
			return;
		}

		if (!joinPassword) {
			setErrorMessage("パスワードを入力してください。");
			return;
		}

		if (socket) {
			const playerId = getOrCreatePlayerId();
			socket.emit(
				"joinRoom",
				{
					roomId: selectedRoom.id,
					password: joinPassword,
					playerName: joinPlayerName,
					playerId: playerId,
				},
				(success: boolean) => {
					if (success) {
						setCurrentRoomId(selectedRoom.id);
						setCurrentView("room");
						closeJoinModal();
					} else {
						setErrorMessage(
							"入室に失敗しました。パスワードが間違っているか、部屋が満員です。"
						);
					}
				}
			);
		}
	}, [
		selectedRoom,
		socket,
		setCurrentRoomId,
		setCurrentView,
		closeJoinModal,
	]);

	return (
		<div className="container mx-auto">
			<h1 className="text-4xl font-bold mb-8 text-center">Lobby</h1>
			<CreateRoomForm
				playerNameRef={playerNameRef}
				newRoomNameRef={newRoomNameRef}
				newRoomPasswordRef={newRoomPasswordRef}
				createRoom={createRoom}
			/>
			<RoomList rooms={rooms} openJoinModal={openJoinModal} />
			<JoinRoomModal
				isOpen={isModalOpen}
				selectedRoom={selectedRoom}
				errorMessage={errorMessage}
				joinPlayerNameRef={joinPlayerNameRef}
				joinPasswordRef={joinPasswordRef}
				closeJoinModal={closeJoinModal}
				handleJoinRoom={handleJoinRoom}
			/>
		</div>
	);
};

/**
 * ルーム作成フォームコンポーネント
 */
const CreateRoomForm: React.FC<{
	playerNameRef: React.RefObject<HTMLInputElement>;
	newRoomNameRef: React.RefObject<HTMLInputElement>;
	newRoomPasswordRef: React.RefObject<HTMLInputElement>;
	createRoom: () => void;
}> = ({ playerNameRef, newRoomNameRef, newRoomPasswordRef, createRoom }) => (
	<div className="mb-8">
		<input
			type="text"
			ref={playerNameRef}
			placeholder="Your name"
			className="w-full p-2 mb-4 border rounded"
		/>
		<input
			type="text"
			ref={newRoomNameRef}
			placeholder="Room name"
			className="w-full p-2 mb-4 border rounded"
		/>
		<input
			type="password"
			ref={newRoomPasswordRef}
			placeholder="Room password (optional)"
			className="w-full p-2 mb-4 border rounded"
		/>
		<button
			onClick={createRoom}
			className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 transition-colors"
		>
			Create Room
		</button>
	</div>
);

/**
 * ルーム一覧コンポーネント
 */
const RoomList: React.FC<{
	rooms: Room[];
	openJoinModal: (room: Room) => void;
}> = ({ rooms, openJoinModal }) => (
	<div>
		<h2 className="text-2xl font-semibold mb-4">Available Rooms</h2>
		{rooms.length > 0 ? (
			<ul className="space-y-4">
				{rooms.map((room) => (
					<li
						key={room.id}
						className="bg-white p-4 rounded shadow flex justify-between items-center"
					>
						<span>
							{room.name} (Players: {room.players?.length}/4)
						</span>
						<button
							onClick={() => openJoinModal(room)}
							className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors"
						>
							Join
						</button>
					</li>
				))}
			</ul>
		) : (
			<p className="text-center text-gray-500">部屋はありません</p>
		)}
	</div>
);

/**
 * ルーム参加モーダルコンポーネント
 */
const JoinRoomModal: React.FC<{
	isOpen: boolean;
	selectedRoom: Room | null;
	errorMessage: string;
	joinPlayerNameRef: React.RefObject<HTMLInputElement>;
	joinPasswordRef: React.RefObject<HTMLInputElement>;
	closeJoinModal: () => void;
	handleJoinRoom: () => void;
}> = ({
	isOpen,
	selectedRoom,
	errorMessage,
	joinPlayerNameRef,
	joinPasswordRef,
	closeJoinModal,
	handleJoinRoom,
}) => {
	if (!isOpen || !selectedRoom) return null;

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
			<div className="bg-white p-6 rounded-lg w-96">
				<h2 className="text-2xl font-bold mb-4">
					Join Room: {selectedRoom.name}
				</h2>
				<input
					type="text"
					ref={joinPlayerNameRef}
					placeholder="Your name"
					className="w-full p-2 mb-4 border rounded"
				/>
				<input
					type="password"
					ref={joinPasswordRef}
					placeholder="Room password"
					className="w-full p-2 mb-4 border rounded"
				/>
				{errorMessage && (
					<p className="text-red-500 mb-4">{errorMessage}</p>
				)}
				<div className="flex justify-end">
					<button
						onClick={closeJoinModal}
						className="bg-gray-300 text-black px-4 py-2 rounded mr-2 hover:bg-gray-400 transition-colors"
					>
						Cancel
					</button>
					<button
						onClick={handleJoinRoom}
						className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors"
					>
						Join
					</button>
				</div>
			</div>
		</div>
	);
};

export default Lobby;
