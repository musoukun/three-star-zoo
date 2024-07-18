import { Socket } from "socket.io";
import { PrismaClient } from "@prisma/client";
import { Player, GameState, Animal } from "../types/types";
import { GameService } from "../services/GameService";
import { RoomService } from "../services/RoomService";

const prisma = new PrismaClient();
const gameService = new GameService(prisma);
const roomService = new RoomService(prisma);

export async function handleCreateRoom(
	socket: Socket,
	data: {
		name: string;
		password: string;
		playerName: string;
		playerId: string;
	},
	response: (data: { roomId: string } | null) => void
) {
	const result = await roomService.handleCreateRoom(
		socket,
		data.name,
		data.password,
		data.playerName,
		data.playerId
	);
	response(result);
}

export async function handleJoinRoom(
	socket: Socket,
	data: {
		roomId: string;
		password: string;
		playerName: string;
		playerId: string;
	},
	response: (success: boolean) => void
) {
	const success = await roomService.handleJoinRoom(
		socket,
		data.roomId,
		data.password,
		data.playerName,
		data.playerId
	);
	response(success);
}

export async function handleStartGame(
	data: { roomId: string; playerId: string; players: Player[] },
	response: (success: boolean, gameState: GameState | null) => void
) {
	const result = await gameService.handleStartGame(
		data.roomId,
		data.playerId,
		data.players
	);
	response(result.success, result.gameState);
}

export async function handleCageClick(
	data: {
		roomId: string;
		cageNumber: string;
		animalId: string;
		playerId: string;
	},
	callback: (success: boolean, gameState: GameState | null) => void
) {
	await gameService.handleCageClick(
		data.roomId,
		data.cageNumber,
		data.animalId,
		data.playerId,
		callback
	);
}
export async function handleDiceRoll(
	roomId: string,
	playerId: string,
	diceCount: number,
	callback: (success: boolean) => void
) {
	await gameService.handleDiceRoll(roomId, playerId, diceCount, callback);
}

export async function handlePlayerLeave(playerId: string, roomId: string) {
	await roomService.handlePlayerLeave(playerId, roomId);
}

export async function handleStartTestGame(
	data: { roomId: string; playerId: string },
	response: (success: boolean, gameState: GameState | null) => void
) {
	const result = await gameService.handleStartTestGame(
		data.roomId,
		data.playerId
	);
	response(result.success, result.gameState);
}

export async function handleResetTestRoom(
	data: { roomId: string },
	response: () => void
) {
	await roomService.resetTestRoom(data.roomId);
	response();
}
