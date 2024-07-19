import { Socket } from "socket.io";
import { Prisma, PrismaClient, Room } from "@prisma/client";
import { GameState, Player, User } from "../types/types";
import {
	getRoomFromDatabase,
	saveRoomToDatabase,
	removeRoomFromDatabase,
	getRoomList,
} from "../repository/RoomRepository";
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

		const newRoom: Room = {
			id: roomId,
			name,
			password,
			players: [newPlayer],
			gameState: null,
			prevGameState: null,
			ownerId: playerId,
			version: 1,
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
		const room: Room | null = await getRoomFromDatabase(
			this.prisma,
			roomId
		);
		if (!room || !room.players) return false;

		if (room.password && room.password !== password) {
			socket.emit("error", "Incorrect password");
			return false;
		}
		const players = room.players as Player[];
		if (players.length >= 4) {
			socket.emit("error", "Room is full");
			return false;
		}

		const newPlayer: User = {
			id: playerId,
			name: playerName,
		};

		(room.players as User[]).push(newPlayer);

		await saveRoomToDatabase(this.prisma, room as Room);

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
		const room: Room | null = await getRoomFromDatabase(
			this.prisma,
			roomId
		);
		if (!room || !room.players) return;

		const players = room.players as Player[];

		if (players.length === 1) {
			await removeRoomFromDatabase(this.prisma, roomId);
		} else {
			// playerIdのプレイヤーが、ownerである場合、次のプレイヤーをownerにする
			if (room.ownerId === playerId) {
				const newOwner = players.find((p) => p.id !== playerId);
				if (newOwner) {
					room.ownerId = newOwner.id as string;
				}
			}
			// playerIdのプレイヤーを削除
			const playerIndex = players.findIndex((p) => p.id === playerId);
			if (playerIndex !== -1) {
				// spliceの1つ目の引数は削除する要素のインデックス, 2つ目の引数は削除する要素の数
				players.splice(playerIndex, 1);
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

	/**
	 * ルームリストを取得する
	 * @returns
	 */
	async getRoomById(roomId: string): Promise<Room | null> {
		const room: Room | null = await this.prisma.room.findUnique({
			where: { id: roomId },
		});

		if (!room) return null;

		return room as Room;
	}

	/**
	 * ルームのゲーム状態を更新する
	 * @param roomId
	 * @param gameState
	 * @returns
	 */
	async updateRoomWithGameState(
		roomId: string,
		gameState: GameState
	): Promise<GameState> {
		const room: Room | null = await getRoomFromDatabase(
			this.prisma,
			roomId
		);
		if (!room) {
			throw new Error("Room not found");
		}
		room.gameState = gameState as unknown as Prisma.JsonValue;

		// updateになる
		const updatedRoom = await saveRoomToDatabase(this.prisma, room, true);

		return updatedRoom.gameState as unknown as GameState;
	}
}
