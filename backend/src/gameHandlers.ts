import { Socket } from "socket.io";
import { PrismaClient } from "@prisma/client";
import { Player, GameState, Animal, Room, User } from "./types/types";
import {
	getRoomFromDatabase,
	saveRoomToDatabase,
	removeRoomFromDatabase,
	getRoomList,
} from "./repository/roomRepository";
import { initialBoard } from "./utils/initialBoard";
import { io } from "./server";

export async function handleCreateRoom(
	prisma: PrismaClient,
	socket: Socket,
	{
		name,
		password,
		playerName,
		playerId,
	}: { name: string; password: string; playerName: string; playerId: string },
	response: (data: { roomId: string } | null) => void
) {
	const roomId = generateRoomId();
	const newPlayer: User = {
		id: playerId,
		name: playerName,
	};
	const newRoom: Room = {
		id: roomId,
		name,
		password,
		players: [newPlayer],
		ownerId: playerId,
		gameState: null,
	};
	await saveRoomToDatabase(prisma, newRoom);
	socket.join(roomId);

	if (typeof response === "function") {
		response({ roomId });
	}

	io.to(roomId).emit("playerJoined", newPlayer);
	io.emit("roomPlayerCountUpdate", { id: roomId, players: newRoom.players });
	io.emit("roomList", await getRoomList(prisma));
}

export async function handleJoinRoom(
	prisma: PrismaClient,
	socket: Socket,
	{
		roomId,
		password,
		playerName,
		playerId,
	}: {
		roomId: string;
		password: string;
		playerName: string;
		playerId: string;
	},
	response: (success: boolean) => void
) {
	const room = await getRoomFromDatabase(prisma, roomId);
	if (!room) return;

	if (room.password && room.password !== password) {
		socket.emit("error", "Incorrect password");
		return;
	}
	if (room.players.length >= 4) {
		socket.emit("error", "Room is full");
		return;
	}

	const newPlayer: User = {
		id: playerId,
		name: playerName,
	};
	room.players.push(newPlayer as Player);
	await saveRoomToDatabase(prisma, room);

	socket.join(roomId);

	if (typeof response === "function") {
		response(true);
	}

	socket.emit("joinedRoom", playerId);
	io.to(roomId).emit("playerJoined", newPlayer);
	io.to(roomId).emit("roomUpdate", room.players);
	io.emit("roomPlayerCountUpdate", { id: roomId, players: room.players });
	io.emit("roomList", await getRoomList(prisma));
}

export async function handleStartGame(
	prisma: PrismaClient,
	{
		roomId,
		playerId,
		players,
	}: { roomId: string; playerId: string; players: Player[] },
	response: (success: boolean, gameState: GameState | null) => void
) {
	const room = await getRoomFromDatabase(prisma, roomId);
	if (!room || room.ownerId !== playerId || !players) {
		if (typeof response === "function") {
			response(false, null);
		}
		console.error("Failed to start game: invalid room or owner");
		return;
	}

	const initializedPlayers = players.map((player, index) => ({
		...player,
		action: "init" as const,
		board: initialBoard,
		poops: 0,
		money: 4,
		badge: 0,
		turnCount: 0,
		turnOrder: index + 1,
		startPlayer: index === 0,
	}));

	const getStartplayer = (players: Player[]) => {
		return players.find((player) => player.startPlayer) || players[0];
	};

	const updatedGameState: GameState = {
		players: initializedPlayers,
		currentPlayer: getStartplayer(initializedPlayers),
		phase: "init",
		roundNumber: 1,
	};

	room.gameState = updatedGameState;
	await saveRoomToDatabase(prisma, room);

	io.to(roomId).emit("gameStarted", updatedGameState);

	if (typeof response === "function") {
		response(true, updatedGameState);
	}

	console.log("Game started with initial state:", updatedGameState);
}

export async function handleCageClick(
	prisma: PrismaClient,
	{
		roomId,
		cageNumber,
		animal,
		playerId,
	}: { roomId: string; cageNumber: string; animal: Animal; playerId: string }
) {
	console.log(
		`Received cageClick: roomId=${roomId}, cageNumber=${cageNumber}, animal=${animal}, playerId=${playerId}`
	);
	const room = await getRoomFromDatabase(prisma, roomId);
	if (!room || !room.gameState) return;

	const currentPlayer = room.gameState.currentPlayer;
	if (!currentPlayer || currentPlayer.id !== playerId) return;

	const playerIndex = room.gameState.players.findIndex(
		(p) => p.id === currentPlayer.id
	);
	if (playerIndex === -1 || !room.gameState.players[playerIndex].board)
		return;

	const player = room.gameState.players[playerIndex];
	const board = player.board;
	if (!board || !(cageNumber in board)) return;

	const cage = board[cageNumber];
	if (!cage || cage.animals.includes(animal)) return;

	cage.animals.push(animal);
	await saveRoomToDatabase(prisma, room);
	io.to(roomId).emit("gameStateUpdate", room.gameState);
	console.log(`Updated cage ${cageNumber} for player ${player.name}`);
}

export async function handleActionComplete(
	prisma: PrismaClient,
	{ roomId, playerId }: { roomId: string; playerId: string }
) {
	const room = await getRoomFromDatabase(prisma, roomId);
	if (!room || !room.gameState) return;
	if (room.gameState.currentPlayer?.id !== playerId) return;

	const currentPlayerIndex = room.gameState.players.findIndex(
		(p) => p.id === room.gameState?.currentPlayer?.id
	);
	const nextPlayerIndex =
		(currentPlayerIndex + 1) % room.gameState.players.length;
	room.gameState.currentPlayer = room.gameState.players[nextPlayerIndex];

	if (
		room.gameState.players.every(
			(p) =>
				p.board &&
				Object.values(p.board).some((cage) => cage.animals.length > 0)
		)
	) {
		room.gameState.phase = "main";
	}

	await saveRoomToDatabase(prisma, room);

	io.to(roomId).emit("gameStateUpdate", room.gameState);
}

export async function handlePlayerLeave(
	prisma: PrismaClient,
	playerId: string,
	roomId: string
) {
	const room = await getRoomFromDatabase(prisma, roomId);
	if (!room) return;

	room.players = room.players.filter((player) => player.id !== playerId);
	if (room.players.length === 0) {
		await removeRoomFromDatabase(prisma, roomId);
	} else {
		if (room.ownerId === playerId) {
			room.ownerId = room.players[0].id as string;
		}
		await saveRoomToDatabase(prisma, room);
	}

	io.to(roomId).emit("playerLeft", playerId);
	io.to(roomId).emit("roomUpdate", room.players);
	io.to(roomId).emit("ownerUpdate", room.ownerId);
	io.emit("roomPlayerCountUpdate", { id: roomId, players: room.players });
	io.emit("roomList", await getRoomList(prisma));
}

function generateRoomId(): string {
	return Math.random().toString(36).substring(2, 8);
}
