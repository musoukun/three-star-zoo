import { Server, Socket } from "socket.io";
import { PrismaClient } from "@prisma/client";
import { getRoomInfo } from "../repository/RoomRepository";
import { GameService } from "../services/GameService";
import { RoomService } from "../services/RoomService";
import { TestGameService } from "../services/TestGameService";
import { Player, GameState, Animal } from "../types/types";
import { GameController } from "../controller/gameController";
import { TestGameController } from "../controller/testGameController";

export class SocketEventHandler {
	private io: Server;
	private prisma: PrismaClient;
	private gameService: GameService;
	private roomService: RoomService;
	private testGameController: TestGameController;
	private gameController: GameController;

	constructor(io: Server, prisma: PrismaClient) {
		this.io = io;
		this.prisma = prisma;
		this.gameService = new GameService();
		this.roomService = new RoomService(prisma);
		this.testGameController = new TestGameController(prisma);
		this.gameController = new GameController(
			this.gameService,
			this.roomService
		);
	}

	public setupSocketConnections(): void {
		this.io.on("connection", (socket: Socket) => {
			console.log("A user connected");

			this.configureRoomEvents(socket);
			this.configureGameEvents(socket);
			this.configureTestGameEvents(socket);

			socket.on("disconnect", () => {
				console.log("A user disconnected");
			});
		});
	}
	private emitGameState(gameState: GameState, socketId: string): void {
		this.io.to(socketId).emit("gameStateUpdate", gameState);
	}

	private configureRoomEvents(socket: Socket): void {
		socket.on("getRoomInfo", async ({ roomId }, callback) => {
			const roomInfo = await getRoomInfo(this.prisma, roomId);
			callback(roomInfo);
		});

		socket.on("createRoom", async (data, response) => {
			const result = await this.roomService.handleCreateRoom(
				socket,
				data.name,
				data.password,
				data.playerName,
				data.playerId
			);
			response(result);
		});

		socket.on("joinRoom", async (data, response) => {
			const success = await this.roomService.handleJoinRoom(
				socket,
				data.roomId,
				data.password,
				data.playerName,
				data.playerId
			);
			response(success);
		});

		socket.on("leaveRoom", async ({ roomId, playerId }, callback) => {
			await this.roomService.handlePlayerLeave(playerId, roomId);
			if (typeof callback === "function") {
				callback(true);
			}
		});
	}

	private configureGameEvents(socket: Socket): void {
		socket.on("startGame", async (data, response) => {
			await this.gameController.handleStartGame(
				data.roomId,
				data.playerId,
				data.players,
				response
			);
		});

		socket.on("cageClick", async (data, callback) => {
			try {
				const updatedGameState =
					await this.gameController.handleCageClick(
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
				const updatedGameState =
					await this.gameController.handleDiceRoll(roomId, playerId);
				callback(true, updatedGameState);
			} catch (error) {
				console.error("Error in rollDice:", error);
				callback(false, null);
			}
		});
	}

	private configureTestGameEvents(socket: Socket): void {
		socket.on("startTestGame", async (data, response) => {
			await this.testGameController.handleStartTestGame(data, response);
		});

		socket.on("resetTestGame", async (data, response) => {
			await this.roomService.resetTestRoom(data.roomId);
			response();
		});

		socket.on("addTestPlayer", async (data, response) => {
			await this.testGameController.handleAddTestPlayer(data, response);
		});

		socket.on("setCurrentPlayer", async (data, response) => {
			await this.testGameController.handleSetCurrentPlayer(
				data,
				response
			);
		});

		socket.on("addCoins", async (data, response) => {
			await this.testGameController.handleAddCoins(data, response);
		});

		socket.on("placeAnimal", async (data, response) => {
			await this.testGameController.handlePlaceAnimal(data, response);
		});

		socket.on("changePhase", async (data, response) => {
			await this.testGameController.handleChangePhase(data, response);
		});

		socket.on("testRollDice", async (data, response) => {
			await this.testGameController.handleTestRollDice(data, response);
		});

		socket.on("poopAction", async (data, response) => {
			await this.testGameController.handlePoopAction(data, response);
		});

		socket.on("flushAction", async (data, response) => {
			await this.testGameController.handleFlushAction(data, response);
		});
	}
}
