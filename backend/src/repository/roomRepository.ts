import { PrismaClient } from "@prisma/client";
import { GameRoom, User } from "../types/types";
import { io } from "../server";

export async function getRoomFromDatabase(
	prisma: PrismaClient,
	roomId: string
): Promise<GameRoom | null> {
	if (!roomId) {
		console.error("No roomId provided");
		return null;
	}
	const dbRoom = await prisma.room.findUnique({ where: { id: roomId } });
	return dbRoom ? (JSON.parse(dbRoom.data as string) as GameRoom) : null;
}

export async function saveRoomToDatabase(
	prisma: PrismaClient,
	room: GameRoom | User
) {
	const roomData = JSON.stringify(room);
	await prisma.room.upsert({
		where: { id: room.id },
		update: { data: roomData },
		create: { id: room.id, data: roomData, version: 1 },
	});
}

export async function removeRoomFromDatabase(
	prisma: PrismaClient,
	roomId: string
) {
	await prisma.room.delete({ where: { id: roomId } });
	io.emit("roomListUpdate");
}

export async function getRoomList(prisma: PrismaClient) {
	const dbRooms = await prisma.room.findMany();
	return dbRooms.map(
		(dbRoom) => JSON.parse(dbRoom.data as string) as GameRoom
	);
}

export async function getRoomInfo(
	prisma: PrismaClient,
	roomId: string
): Promise<GameRoom | null> {
	const room = await getRoomFromDatabase(prisma, roomId);
	if (room) {
		const { password, ...roomInfo } = room;
		return roomInfo as GameRoom;
	}
	return null;
}
