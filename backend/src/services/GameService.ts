import { Prisma, PrismaClient } from "@prisma/client";
import { Player, GameState, Animal, Room } from "../types/types";
import {
	getRoomFromDatabase,
	saveRoomToDatabase,
} from "../repository/roomRepository";
import { initialBoard } from "../utils/initialBoard";
import { io } from "../server";

import { animalMap } from "../types/Animal/index";
import {
	canCompleteAction,
	gameProgressMiddleware,
	getNextPlayer,
} from "../middleware/GameFlowMonitor";
import { ActionState } from "../types/ActionState";
import { AnimalEffectProcessor } from "./AnimalEffectProcessor";
import { RessaPanda } from "../types/Animal/RessaPanda";
import { Penguin } from "../types/Animal/Penguin";
import { c } from "vite/dist/node/types.d-aGj9QkWt";

export class GameService {
	constructor(private prisma: PrismaClient) {}

	async handleStartGame(
		roomId: string,
		playerId: string,
		players: Player[]
	): Promise<{ success: boolean; gameState: GameState | null }> {
		const room = await getRoomFromDatabase(this.prisma, roomId);
		if (!room || room.ownerId !== playerId || !players) {
			console.error("Failed to start game: invalid room or owner");
			return { success: false, gameState: null };
		}

		const initializedPlayers = players.map((player, index) => ({
			...player,
			action: ActionState.INIT,
			board: initialBoard,
			poops: 0,
			money: 4,
			star: 0,
			turnCount: 0,
			turnOrder: index + 1,
			startPlayer: index === 0,
			current: index === 0,
			inventory: [RessaPanda, Penguin],
		}));

		const getStartplayer = (players: Player[]) => {
			return players.find((player) => player.startPlayer) || players[0];
		};

		const updatedGameState: GameState = {
			players: initializedPlayers,
			currentPlayer: getStartplayer(initializedPlayers),
			phase: "init",
			roundNumber: 1,
		};

		room.gameState = updatedGameState;
		await saveRoomToDatabase(this.prisma, room);

		io.to(roomId).emit("gameStarted", updatedGameState);

		console.log("Game started with initial state:", updatedGameState);
		return { success: true, gameState: updatedGameState };
	}

	async handleCageClick(
		roomId: string,
		cageNumber: string,
		animalId: string,
		playerId: string,
		callback: (success: boolean, gameState: GameState | null) => void
	): Promise<void> {
		// prismaのtimeout時間を設定したい↓
		try {
			this.prisma.$transaction(
				async (transactionPrisma) => {
					const room = await getRoomFromDatabase(
						transactionPrisma as PrismaClient,
						roomId
					);
					if (!room || !room.gameState) {
						callback(false, null);
						return;
					}

					const currentPlayer = room.gameState.players.find(
						(p) => p.current
					);
					if (!currentPlayer || currentPlayer.id !== playerId) {
						callback(false, null);
						return;
					}

					const playerIndex = room.gameState.players.findIndex(
						(p) => p.id === currentPlayer.id
					);
					if (
						playerIndex === -1 ||
						!room.gameState.players[playerIndex].board
					) {
						callback(false, null);
						return;
					}

					const player = room.gameState.players[playerIndex];
					const board = player.board;
					if (!board || !(cageNumber in board)) {
						callback(false, null);
						return;
					}

					const cage = board[cageNumber];
					console.log("Received animalId:", animalId);
					const animalObject =
						animalMap[animalId as keyof typeof animalMap];
					if (!animalObject) {
						callback(false, null);
						return;
					}

					if (
						!cage.animals.some(
							(animal) => animal.id === animalObject.id
						)
					) {
						const animalIndex = player.inventory.findIndex(
							(animal) => animal.id === animalId
						);
						if (animalIndex !== -1) {
							player.inventory.splice(animalIndex, 1);
							cage.animals.push(animalObject as Animal);

							room.gameState = gameProgressMiddleware(
								room.gameState
							);
							room.version = (room.version || 0) + 1;
							await saveRoomToDatabase(
								transactionPrisma as PrismaClient,
								room
							);
							io.to(roomId).emit(
								"gameStateUpdate",
								room.gameState,
								room.version
							);
							callback(true, room.gameState);
						} else {
							callback(false, null);
						}
					} else {
						callback(false, null);
					}
				},
				{
					timeout: 400000, // Set timeout to 10 seconds (10000 ms)
					maxWait: 15000, // Optional: Set maximum wait time to 15 seconds
					// isolationLevel: Prisma.TransactionIsolationLevel.Serializable, // Optional: Set isolation level
				}
			);
		} catch (error) {
			console.error("database transaction failed:", error);
			callback(false, null);
		}
	}

	async handleTurnComplete(roomId: string, playerId: string): Promise<void> {
		return this.prisma.$transaction(async (transactionPrisma) => {
			const room = await getRoomFromDatabase(
				transactionPrisma as PrismaClient,
				roomId
			);
			if (!room || !room.gameState) return;

			// プレイヤーのアクションが完了可能か確認
			if (!canCompleteAction(room.gameState, playerId)) {
				throw new Error("Player action cannot be completed");
			}

			// ゲームの状態を更新
			room.gameState = gameProgressMiddleware(room.gameState);

			// // 次のプレイヤーを設定
			// room.gameState.currentPlayer = getNextPlayer(room.gameState);

			room.version = (room.version || 0) + 1;
			await saveRoomToDatabase(transactionPrisma as PrismaClient, room);

			// 更新された状態をクライアントに送信
			io.to(roomId).emit("gameStateUpdate", room.gameState, room.version);
		});
	}

	async handleDiceRoll(
		roomId: string,
		playerId: string,
		diceCount: number,
		callback: (success: boolean) => void
	): Promise<void> {
		try {
			await this.prisma.$transaction(async (transactionPrisma) => {
				const room = await getRoomFromDatabase(
					transactionPrisma as PrismaClient,
					roomId
				);
				if (!room || !room.gameState) {
					callback(false);
					return;
				}

				const currentPlayer = room.gameState.players.find(
					(p) => p.current
				);
				if (
					!currentPlayer ||
					currentPlayer.id !== playerId ||
					currentPlayer.action !== ActionState.ROLL
				) {
					callback(false);
					return;
				}

				const diceResult = this.rollDice(diceCount);
				currentPlayer.diceResult = diceResult;

				// ここで動物の効果を処理します（後で実装）
				const effectProcessor = new AnimalEffectProcessor(
					room.gameState
				);
				room.gameState = effectProcessor.processEffects(
					diceResult,
					playerId
				);

				room.gameState = gameProgressMiddleware(room.gameState);
				room.version = (room.version || 0) + 1;
				await saveRoomToDatabase(
					transactionPrisma as PrismaClient,
					room
				);

				io.to(roomId).emit(
					"gameStateUpdate",
					room.gameState,
					room.version
				);
				callback(true);
			});
		} catch (error) {
			console.error("Dice roll failed:", error);
			callback(false);
		}
	}

	private rollDice(count: number): number {
		if (count === 1) {
			return Math.floor(Math.random() * 6) + 1;
		} else {
			return Math.floor(Math.random() * 11) + 2;
		}
	}

	// 動物の効果を処理するメソッド（後で実装）
	// private processAnimalEffects(gameState: GameState): void {
	//   // 他のプレイヤーの動物の効果を処理
	//   // 現在のプレイヤーの動物の効果を処理
	// }
}
