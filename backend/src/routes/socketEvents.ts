import { Server, Socket } from "socket.io";
import { PrismaClient } from "@prisma/client";
import { GameService } from "../services/GameService";
import { RoomService } from "../services/RoomService";
import { Player, GameState, Animal, ResultPoops } from "../types/types";

import { GameController } from "../controller/GameController";
import { RoomRepository } from "../repository/RoomRepository";
import { EffectService } from "../services/EffectService";
import { LockStepManager } from "../controller/LockStepManager";

export class SocketEventHandler {
	private io: Server;
	private prisma: PrismaClient;
	private gameService: GameService;
	private roomService: RoomService;

	private gameController: GameController;
	private roomReposiotry: RoomRepository;
	private lockStepManager: LockStepManager;

	constructor(io: Server, prisma: PrismaClient) {
		this.io = io;
		this.prisma = prisma;
		this.gameService = new GameService(prisma);
		this.roomService = new RoomService(prisma);
		this.roomReposiotry = new RoomRepository(prisma);

		this.gameController = new GameController(
			this.gameService,
			this.roomService,
			io
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
						socket.id
					);
				this.emitGameState(
					true,
					updatedGameState,
					socket.id,
					data.roomId
				);

				// 効果処理の結果を全プレイヤーに送信
				this.io
					.to(data.roomId)
					.emit(
						"effectProcessingComplete",
						updatedGameState.effectResults
					);
			} catch (error) {
				console.error("Error in processEffects:", error);
				socket.emit("gameError", {
					message: "Failed to process effects",
				});
			}
		});

		socket.on("playerSelection", async (data) => {
			const { roomId, playerId, selectedPlayerId } = data;
			this.io
				.to(roomId)
				.emit("playerSelectionResult", { selectedPlayerId });
		});

		socket.on("choiceSelection", async (data) => {
			const { roomId, playerId, selectedChoice } = data;
			console.log(
				`Received choiceSelection: ${selectedChoice} from player ${playerId}`
			);
			try {
				const updatedGameState =
					await this.gameController.handleChoiceSelection(
						roomId,
						playerId,
						selectedChoice
					);
				this.emitGameState(true, updatedGameState, socket.id, roomId);
			} catch (error) {
				console.error("Error in choiceSelection:", error);
				socket.emit("gameError", {
					message: "Failed to process choice selection",
				});
			}
		});

		// 新しいイベントハンドラを追加
		socket.on("waitingForPlayerSelection", (data) => {
			const { roomId, playerId } = data;
			this.io.to(roomId).emit("waitForPlayerSelection", { playerId });
		});

		socket.on("waitingForPlayerChoice", (data) => {
			const { roomId, playerId } = data;
			this.io.to(roomId).emit("waitForPlayerChoice", { playerId });
		});

		socket.on("playerSelectionComplete", (data) => {
			const { roomId } = data;
			this.io.to(roomId).emit("playerSelectionComplete");
		});

		socket.on("playerChoiceComplete", (data) => {
			const { roomId } = data;
			this.io.to(roomId).emit("playerChoiceComplete");
		});
	}

	private configureTestGameEvents(socket: Socket): void {
		socket.on("updateTestGameState", async (data, callback) => {
			try {
				const { roomId, gameState } = data;
				const room = await this.roomService.getRoomById(roomId);

				if (!room) {
					throw new Error("Room not found");
				}

				room.gameState = gameState;
				await this.roomReposiotry.saveRoomToDatabase(room);

				this.emitGameState(true, gameState, socket.id, roomId);
				callback(true);
			} catch (error) {
				console.error("Error in updateGameState:", error);
				callback(false);
			}
		});
	}
}
