import { PrismaClient } from "@prisma/client";
import { Room as RoomType, User } from "../types/types";
import { io } from "../server";

export async function getRoomFromDatabase(
	prisma: PrismaClient,
	roomId: string
): Promise<RoomType | null> {
	if (!roomId) {
		console.error("No roomId provided");
		return null;
	}
	const dbRoom = await prisma.room.findUnique({ where: { id: roomId } });
	return dbRoom ? (JSON.parse(dbRoom.data as string) as RoomType) : null;
}

export async function saveRoomToDatabase(
	prisma: PrismaClient,
	room: RoomType | User
) {
	const roomData = JSON.stringify(room);
	await prisma.room.upsert({
		where: { id: room.id },
		update: { data: roomData },
		create: { id: room.id, data: roomData },
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
		(dbRoom) => JSON.parse(dbRoom.data as string) as RoomType
	);
}

export async function getRoomInfo(
	prisma: PrismaClient,
	roomId: string
): Promise<RoomType | null> {
	const room = await getRoomFromDatabase(prisma, roomId);
	if (room) {
		const { password, ...roomInfo } = room;
		return roomInfo as RoomType;
	}
	return null;
}
