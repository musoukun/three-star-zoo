import { Socket } from "socket.io";
import { PrismaClient } from "@prisma/client";
import { Player, Room as RoomType, User } from "../types/types";
import {
	getRoomFromDatabase,
	saveRoomToDatabase,
	removeRoomFromDatabase,
	getRoomList,
} from "../repository/roomRepository";
import { io } from "../server";
/**
 * ルームに関するサービスクラス
 * @param prisma
 * @returns
 * @constructor
 * @method handleCreateRoom	ルームを作成する
 * @method handleJoinRoom	ルームに参加する
 * @method handlePlayerLeave	プレイヤーがルームを離れる
 * @method generateRoomId	ルームIDを生成する
 */
export class RoomService {
	constructor(private prisma: PrismaClient) {}

	/**
	 * ルームを作成する
	 *
	 * @param socket
	 * @param name ルーム名
	 * @param password パスワード
	 * @param playerName プレイヤー名
	 * @param playerId プレイヤーID
	 * @returns roomId
	 */
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
		const newRoom: RoomType = {
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

	/**
	 * ルームに参加する
	 *
	 * @param socket
	 * @param roomId ルームID
	 * @param password パスワード
	 * @param playerName プレイヤー名
	 * @param playerId プレイヤーID
	 * @returns 成功したかどうか
	 */
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
		room.players.push(newPlayer as any);
		await saveRoomToDatabase(this.prisma, room);

		socket.join(roomId);

		socket.emit("joinedRoom", playerId);
		io.to(roomId).emit("playerJoined", newPlayer);
		io.to(roomId).emit("roomUpdate", room.players);
		io.emit("roomPlayerCountUpdate", { id: roomId, players: room.players });
		io.emit("roomList", await getRoomList(this.prisma));

		return true;
	}

	/**
	 * プレイヤーがルームを離れる
	 * @param playerId
	 * @param roomId
	 * @returns
	 */
	async handlePlayerLeave(playerId: string, roomId: string): Promise<void> {
		const room = await getRoomFromDatabase(this.prisma, roomId);
		if (!room) return;

		room.players = room.players.filter(
			(player) => player.id !== playerId
		) as Player[];

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

	/**
	 * テスト用ルームをリセットする
	 * @param roomId
	 * @returns
	 */
	async resetTestRoom(roomId: string): Promise<boolean> {
		try {
			const room = await getRoomFromDatabase(this.prisma, roomId);
			if (!room) return false;

			room.gameState = null;
			await saveRoomToDatabase(this.prisma, room);

			io.to(roomId).emit("roomReset");
			return true;
		} catch (error) {
			console.error("Failed to reset test room:", error);
			return false;
		}
	}

	/**
	 * ルームIDを生成する
	 * @param playerId
	 * @param roomId
	 * @param players
	 * @returns
	 */
	private generateRoomId(): string {
		return Math.random().toString(36).substring(2, 8).toUpperCase();
	}
}
