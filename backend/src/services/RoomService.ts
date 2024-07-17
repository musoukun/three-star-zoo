import { Socket } from "socket.io";
import { PrismaClient } from "@prisma/client";
import { Player, Room, User } from "../types/types";
import {
	getRoomFromDatabase,
	saveRoomToDatabase,
	removeRoomFromDatabase,
	getRoomList,
} from "../repository/roomRepository";
import { initialBoard } from "../utils/initialBoard";
import { io } from "../server";

export class RoomService {
	constructor(private prisma: PrismaClient) {}

	async handleCreateRoom(
		socket: Socket,
		name: string,
		password: string,
		playerName: string,
		playerId: string
	): Promise<{ roomId: string } | null> {
		const roomId = this.generateRoomId();
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
		await saveRoomToDatabase(this.prisma, newRoom);
		socket.join(roomId);

		io.to(roomId).emit("playerJoined", newPlayer);
		io.emit("roomPlayerCountUpdate", {
			id: roomId,
			players: newRoom.players,
		});
		io.emit("roomList", await getRoomList(this.prisma));

		return { roomId };
	}

	async handleJoinRoom(
		socket: Socket,
		roomId: string,
		password: string,
		playerName: string,
		playerId: string
	): Promise<boolean> {
		const room = await getRoomFromDatabase(this.prisma, roomId);
		if (!room) return false;

		if (room.password && room.password !== password) {
			socket.emit("error", "Incorrect password");
			return false;
		}
		if (room.players.length >= 4) {
			socket.emit("error", "Room is full");
			return false;
		}

		const newPlayer: User = {
			id: playerId,
			name: playerName,
		};
		room.players.push(newPlayer as Player);
		await saveRoomToDatabase(this.prisma, room);

		socket.join(roomId);

		socket.emit("joinedRoom", playerId);
		io.to(roomId).emit("playerJoined", newPlayer);
		io.to(roomId).emit("roomUpdate", room.players);
		io.emit("roomPlayerCountUpdate", { id: roomId, players: room.players });
		io.emit("roomList", await getRoomList(this.prisma));

		return true;
	}

	async handlePlayerLeave(playerId: string, roomId: string): Promise<void> {
		const room = await getRoomFromDatabase(this.prisma, roomId);
		if (!room) return;

		room.players = room.players.filter((player) => player.id !== playerId);

		if (room.players.length === 0) {
			await removeRoomFromDatabase(this.prisma, roomId);
		} else {
			if (room.ownerId === playerId) {
				room.ownerId = room.players[0].id!;
				room.players[0].owner = true;
			}
			await saveRoomToDatabase(this.prisma, room);
		}

		io.to(roomId).emit("playerLeft", playerId);
		io.to(roomId).emit("roomUpdate", room.players);
		io.emit("roomPlayerCountUpdate", { id: roomId, players: room.players });
		io.emit("roomList", await getRoomList(this.prisma));
	}

	private generateRoomId(): string {
		return Math.random().toString(36).substring(2, 8).toUpperCase();
	}
}
