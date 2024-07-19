import { Prisma, PrismaClient } from "@prisma/client";
import { Room } from "@prisma/client";
import { io } from "../server";

export async function getRoomFromDatabase(
	prisma: PrismaClient,
	roomId: string
): Promise<Room | null> {
	if (!roomId) {
		console.error("No roomId provided");
		return null;
	}
	const room = await prisma.room.findUnique({ where: { id: roomId } });
	return (room as Room) ?? null; // roomがnullの場合はnullを返す
}

export async function saveRoomToDatabase(
	prisma: PrismaClient,
	newRoom: Room,
	incrementVersion = false // この値は引数で指定されない場合はfalseになる
) {
	const room = await prisma.room.upsert({
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

export async function removeRoomFromDatabase(
	prisma: PrismaClient,
	roomId: string
) {
	await prisma.room.delete({ where: { id: roomId } });
	io.emit("roomListUpdate");
}

export async function getRoomList(prisma: PrismaClient): Promise<Room[]> {
	const rooms = await prisma.room.findMany();
	return rooms as Room[];
}

export async function getRoomInfo(
	prisma: PrismaClient,
	roomId: string
): Promise<Room | null> {
	const room = await getRoomFromDatabase(prisma, roomId);
	if (room) {
		const { password, ...roomInfo } = room;
		return roomInfo as Room;
	}
	return null;
}
