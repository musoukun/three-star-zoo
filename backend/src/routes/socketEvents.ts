import { Server, Socket } from "socket.io";
import { PrismaClient } from "@prisma/client";
import { GameService } from "../services/GameService";
import { RoomService } from "../services/RoomService";
import { TestGameService } from "../services/TestGameService";
import { Player, GameState, Animal, ResultPoops } from "../types/types";
import { TestGameController } from "../controller/TestGameController";
import { GameController } from "../controller/GameController";
import { RoomRepository } from "../repository/RoomRepository";
import { EffectService } from "../services/EffectService";
import { LockStepManager } from "../controller/LockStepManager";

export class SocketEventHandler {
	private io: Server;
	private prisma: PrismaClient;
	private gameService: GameService;
	private roomService: RoomService;
	private effectService: EffectService;
	private testGameController: TestGameController;
	private gameController: GameController;
	private roomReposiotry: RoomRepository;
	private lockStepManager: LockStepManager;

	constructor(io: Server, prisma: PrismaClient) {
		this.io = io;
		this.prisma = prisma;
		this.gameService = new GameService(prisma);
		this.roomService = new RoomService(prisma);
		this.testGameController = new TestGameController(prisma);
		this.roomReposiotry = new RoomRepository(prisma);
		this.effectService = new EffectService(prisma);
		this.gameController = new GameController(
			this.gameService,
			this.roomService,
			this.effectService
		);

		this.lockStepManager = new LockStepManager(io);
		this.lockStepManager.setupLockStep();
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

	private emitGameState(
		success: boolean,
		gameState: GameState,
		socketId: string,
		roomId: string
	): void {
		this.io
			.to(socketId)
			.emit("gameStateUpdate", { success, emitGameState: gameState });

		// LockStepManagerにGameStateを設定
		this.lockStepManager.setGameState(roomId, gameState);
	}
	/**
	 * ルーム関連のイベントを設定
	 * @note この画面の処理はcallback関数で結果を返している。
	 * @note 切り替わりが多いのと、responseの内容を工夫したいので。
	 * @param socket
	 */
	private configureRoomEvents(socket: Socket): void {
		socket.on("getRoomInfo", async ({ roomId }, callback) => {
			const roomInfo = await this.roomReposiotry.getRoomInfo(roomId);
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

	/**
	 * ゲーム関連のイベントを設定
	 * @note ゲーム開始後は共通のイベントリスナーに結果を返しています。
	 * @note 1つの画面に何度も同じ形式のデータを送っているから共通にした。
	 * @param socket
	 */
	private configureGameEvents(socket: Socket): void {
		socket.on("startGame", async (data, response) => {
			try {
				const result: {
					updatedGameState: GameState;
					roomId: string;
				} = await this.gameController.handleStartGame(
					data.roomId,
					data.playerId,
					data.players,
					response // このコールバック関数だけでは、開始ボタンを押した人にしか結果を返さない。
					// そのほかのプレイヤーには通知されない
				);
				// 全プレイヤーにゲーム開始を通知;
				this.io
					.to(data.roomId)
					.emit("gameStarted", result.updatedGameState);

				socket.join(result.roomId);
			} catch (error) {
				console.error("Error in startGame:", error);
				response(false, null);
			}
		});

		socket.on("cageClick", async (data) => {
			try {
				const updatedGameState =
					await this.gameController.handleCageClick(
						data.roomId,
						data.playerId,
						data.cageNumber,
						data.animal as Animal
					);
				// イベントリスナーに結果を返す
				this.emitGameState(
					true,
					updatedGameState,
					socket.id,
					data.roomId
				);
			} catch (error) {
				console.error("Error in cageClick:", error);
				socket.emit("gameError", {
					message: "Failed to process cage click",
				});
			}
		});

		socket.on("poopAction", async (data) => {
			try {
				const updateGameState: GameState =
					await this.gameController.handlePoopAction(
						data.roomId,
						data.playerId
					);
				// イベントリスナーに結果を返す
				this.emitGameState(
					true,
					updateGameState,
					socket.id,
					data.roomId
				);
			} catch (error) {
				console.error("Error in poopAction:", error);
				socket.emit("gameError", {
					message: "Failed to process poop action",
				});
			}
		});

		// 同様に rollDice イベントハンドラも修正する必要があります
		socket.on("rollDice", async (data, callback) => {
			try {
				const updateGameState =
					await this.gameController.handleDiceRoll(
						data.roomId,
						data.playerId,
						data.diceCount
					);

				callback(true); // ダイスロールの処理が成功したことをクライアントに通知
				this.emitGameState(
					true,
					updateGameState,
					socket.id,
					data.roomId
				);
			} catch (error) {
				console.error("Error in rollDice:", error);
				socket.emit("gameError", {
					message: "ダイスロールの処理に失敗しました",
				});
			}
		});

		// 効果処理開始イベントハンドラを追加
		socket.on("processEffects", async (data) => {
			try {
				const updatedGameState =
					await this.gameController.handleProcessEffects(
						data.roomId,
						data.playerId,
						data.diceResult
					);
				this.emitGameState(
					true,
					updatedGameState,
					socket.id,
					data.roomId
				);
			} catch (error) {
				console.error("Error in processEffects:", error);
				socket.emit("gameError", {
					message: "Failed to process effects",
				});
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

		socket.on("testPoopAction", async (data, response) => {
			await this.testGameController.handlePoopAction(data, response);
		});

		socket.on("flushAction", async (data, response) => {
			await this.testGameController.handleFlushAction(data, response);
		});
	}
}
