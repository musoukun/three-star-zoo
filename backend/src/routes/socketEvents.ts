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
	handleStartTestGame,
	handleResetTestRoom,
} from "../controller/gameController";
import { RoomService } from "../services/RoomService";
import {
	handleAddCoins,
	handleAddTestPlayer,
	handleChangePhase,
	handleFlushAction,
	handlePlaceAnimal,
	handlePoopAction,
	handleSetCurrentPlayer,
	handleTestRollDice,
} from "../controller/testGameController";

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

		socket.on("startTestGame", async (data, response) => {
			await handleStartTestGame(data, response);
		});

		socket.on("resetTestGame", async (data, response) => {
			await handleResetTestRoom(data, response);
		});

		socket.on("startTestGame", async (data, response) => {
			await handleStartTestGame(data, response);
		});

		socket.on("addTestPlayer", async (data, response) => {
			await handleAddTestPlayer(data, response);
		});

		socket.on("setCurrentPlayer", async (data, response) => {
			await handleSetCurrentPlayer(data, response);
		});

		socket.on("addCoins", async (data, response) => {
			await handleAddCoins(data, response);
		});

		socket.on("placeAnimal", async (data, response) => {
			await handlePlaceAnimal(data, response);
		});

		socket.on("changePhase", async (data, response) => {
			await handleChangePhase(data, response);
		});

		socket.on("testRollDice", async (data, response) => {
			await handleTestRollDice(data, response);
		});

		socket.on("poopAction", async (data, response) => {
			await handlePoopAction(data, response);
		});

		socket.on("flushAction", async (data, response) => {
			await handleFlushAction(data, response);
		});
	});
}
