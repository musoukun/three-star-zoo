import { Server, Socket } from "socket.io";
import { PrismaClient } from "@prisma/client";
import { getRoomInfo } from "../repository/roomRepository";
import {
	handleCreateRoom,
	handleJoinRoom,
	handleStartGame,
	handleCageClick,
	handleDiceRoll,
	handlePlayerLeave,
} from "../controller/gameController";
import { GameService } from "../services/GameService";

export function configureSocketEvents(io: Server, prisma: PrismaClient) {
	io.on("connection", (socket: Socket) => {
		console.log("connected");

		socket.on("getRoomInfo", async ({ roomId, playerId }, callback) => {
			const roomInfo = await getRoomInfo(prisma, roomId);
			callback(roomInfo);
		});

		socket.on("createRoom", async (data, response) => {
			await handleCreateRoom(socket, data, response);
		});

		socket.on("joinRoom", async (data, response) => {
			await handleJoinRoom(socket, data, response);
		});

		socket.on("startGame", async (data, response) => {
			await handleStartGame(data, response);
		});

		socket.on("leaveRoom", async ({ roomId, playerId }, callback) => {
			await handlePlayerLeave(playerId, roomId);
			if (typeof callback === "function") {
				callback(true);
			}
		});

		socket.on("disconnect", async () => {
			console.log("A user disconnected");
		});

		socket.on("cageClick", async (data, response) => {
			await handleCageClick(data, response);
		});

		socket.on(
			"rollDice",
			async ({ roomId, playerId, diceCount }, callback) => {
				await handleDiceRoll(
					roomId,
					playerId,
					diceCount,
					(success: boolean) => {
						callback(success);
					}
				);
			}
		);
	});
}
