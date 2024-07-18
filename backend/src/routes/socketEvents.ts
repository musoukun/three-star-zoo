import { Server, Socket } from "socket.io";
import { PrismaClient } from "@prisma/client";
import { getRoomInfo } from "../repository/RoomRepository";
import { GameService } from "../services/GameService";
import { RoomService } from "../services/RoomService";
import { TestGameService } from "../services/TestGameService";
import { Player, GameState, Animal } from "../types/types";
import { GameController } from "../controller/gameController";
import { TestGameController } from "../controller/testGameController";

export function configureSocketEvents(io: Server, prisma: PrismaClient) {
	const gameService = new GameService();
	const roomService = new RoomService(prisma);
	const testGameController = new TestGameController(prisma);
	const gameController = new GameController(gameService, roomService);

	io.on("connection", (socket: Socket) => {
		console.log("A user connected");

		socket.on("getRoomInfo", async ({ roomId, playerId }, callback) => {
			const roomInfo = await getRoomInfo(prisma, roomId);
			callback(roomInfo);
		});

		socket.on("createRoom", async (data, response) => {
			const result = await roomService.handleCreateRoom(
				socket,
				data.name,
				data.password,
				data.playerName,
				data.playerId
			);
			response(result);
		});

		socket.on("joinRoom", async (data, response) => {
			const success = await roomService.handleJoinRoom(
				socket,
				data.roomId,
				data.password,
				data.playerName,
				data.playerId
			);
			response(success);
		});

		socket.on("startGame", async (data, response) => {
			await gameController.handleStartGame(
				data.roomId,
				data.playerId,
				data.players,
				response
			);
		});

		socket.on("leaveRoom", async ({ roomId, playerId }, callback) => {
			await roomService.handlePlayerLeave(playerId, roomId);
			if (typeof callback === "function") {
				callback(true);
			}
		});

		socket.on("cageClick", async (data, callback) => {
			try {
				const updatedGameState = await gameController.handleCageClick(
					data.roomId,
					data.playerId,
					data.cageNumber,
					data.animal as Animal
				);
				callback(true, updatedGameState);
			} catch (error) {
				console.error("Error in cageClick:", error);
				callback(false, null);
			}
		});

		socket.on("rollDice", async ({ roomId, playerId }, callback) => {
			try {
				const updatedGameState = await gameController.handleDiceRoll(
					roomId,
					playerId
				);
				callback(true, updatedGameState);
			} catch (error) {
				console.error("Error in rollDice:", error);
				callback(false, null);
			}
		});

		// Test game events
		socket.on(
			"startTestGame",
			async (
				data: { roomId: string; playerId: string },
				response: (
					success: boolean,
					gameState: GameState | null
				) => void
			) => {
				await testGameController.handleStartTestGame(data, response);
			}
		);

		socket.on("resetTestGame", async (data, response) => {
			await roomService.resetTestRoom(data.roomId);
			response();
		});

		// Test game events
		socket.on("startTestGame", async (data, response) => {
			await testGameController.handleStartTestGame(data, response);
		});

		socket.on("addTestPlayer", async (data, response) => {
			await testGameController.handleAddTestPlayer(data, response);
		});

		socket.on("setCurrentPlayer", async (data, response) => {
			await testGameController.handleSetCurrentPlayer(data, response);
		});

		socket.on("addCoins", async (data, response) => {
			await testGameController.handleAddCoins(data, response);
		});

		socket.on("placeAnimal", async (data, response) => {
			await testGameController.handlePlaceAnimal(data, response);
		});

		socket.on("changePhase", async (data, response) => {
			await testGameController.handleChangePhase(data, response);
		});

		socket.on("testRollDice", async (data, response) => {
			await testGameController.handleTestRollDice(data, response);
		});

		socket.on("poopAction", async (data, response) => {
			await testGameController.handlePoopAction(data, response);
		});

		socket.on("flushAction", async (data, response) => {
			await testGameController.handleFlushAction(data, response);
		});

		socket.on("disconnect", () => {
			console.log("A user disconnected");
		});
	});
}
