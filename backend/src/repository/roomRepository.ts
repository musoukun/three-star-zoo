import { Prisma, PrismaClient, Room } from "@prisma/client";
import { io } from "../server";
import { GameState, Player } from "../types/types";
import { error } from "console";

export class RoomRepository {
	private prisma: PrismaClient;

	constructor(prisma: PrismaClient) {
		this.prisma = prisma;
	}

	public async getRoomFromDatabase(roomId: string): Promise<Room | null> {
		if (!roomId) {
			console.error("No roomId provided");
			return null;
		}
		const room = await this.prisma.room.findUnique({
			where: { id: roomId },
		});
		return (room as Room) ?? null; // roomがnullの場合はnullを返す
	}

	public async saveRoomToDatabase(
		newRoom: Room,
		incrementVersion = false // この値は引数で指定されない場合はfalseになる
	): Promise<Room> {
		// gameStateのバージョンを更新

		if (newRoom.gameState) {
			(newRoom.gameState as unknown as GameState).version = (
				newRoom.gameState as unknown as GameState
			).version
				? (newRoom.gameState as unknown as GameState).version + 1
				: 1;
		}

		const room = await this.prisma.room.upsert({
			where: { id: newRoom.id },
			update: {
				name: newRoom.name,
				password: newRoom.password,
				players: newRoom.players as Prisma.JsonArray,
				ownerId: newRoom.ownerId,
				gameState: newRoom.gameState as Prisma.InputJsonValue,
				prevGameState: newRoom.prevGameState as Prisma.InputJsonValue,
				version: incrementVersion ? { increment: 1 } : undefined,
			},
			create: {
				id: newRoom.id,
				name: newRoom.name,
				password: newRoom.password,
				players: newRoom.players as Prisma.JsonArray,
				ownerId: newRoom.ownerId,
				gameState: newRoom.gameState as Prisma.InputJsonValue,
				version: 1,
			},
		});
		return room;
	}

	public async removeRoomFromDatabase(roomId: string): Promise<void> {
		await this.prisma.room.delete({ where: { id: roomId } });
		io.emit("roomListUpdate"); // Notify all clients about the room list update
	}

	public async getRoomList(): Promise<Room[]> {
		const rooms = await this.prisma.room.findMany();
		return rooms as Room[];
	}

	public async getRoomInfo(roomId: string): Promise<Room | null> {
		const room = await this.getRoomFromDatabase(roomId);
		if (room) {
			const { password, ...roomInfo } = room;
			return roomInfo as Room;
		}
		return null;
	}
}
