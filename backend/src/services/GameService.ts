import { Prisma, PrismaClient } from "@prisma/client";
import { Player, GameState, Animal, Room as GameRoom } from "../types/types";
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
} from "../middleware/GameFlowMonitor";
import { ActionState } from "../types/ActionState";
import { AnimalEffectProcessor } from "./AnimalEffectProcessor";
import { RessaPanda } from "../types/Animal/RessaPanda";
import { Penguin } from "../types/Animal/Penguin";

/**
 * ゲームのロジックを管理するサービスクラス
 * @class
 * @classdesc ゲームのロジックを管理するサービスクラス
 * @exports
 * @constructor
 * @param prisma - Prismaクライアントのインスタンス
 * @method handleStartGame - ゲームを開始する
 * @method handleCageClick - ケージクリックを処理する
 * @method handleTurnComplete - ターン完了を処理する
 * @method handleDiceRoll - サイコロを振る処理を行う
 * @private
 * @method getRoom - ルームを取得する
 * @method isValidGameStart - ゲーム開始の妥当性をチェックする
 * @method initializeGameState - ゲーム状態を初期化する
 * @method getStartPlayer - 開始プレイヤーを取得する
 * @method saveAndEmitGameState - ゲーム状態を保存し、クライアントに送信する
 * @method isValidCageClick - ケージクリックの妥当性をチェックする
 * @method updateGameStateOnCageClick - ケージクリック時のゲーム状態を更新する
 * @method isValidDiceRoll - サイコロを振る処理の妥当性をチェックする
 * @method processDiceRoll - サイコロを振る処理を行う
 * @method rollDice - サイコロを振る
 * @method getTransactionOptions - トランザクションのオプションを取得する
 */
export class GameService {
	private gameState: GameState | null = null;

	/**
	 * @param prisma - Prismaクライアントのインスタンス
	 */
	constructor(private prisma: PrismaClient) {}

	/**
	 * ゲームを開始する
	 * @param roomId - ルームID
	 * @param playerId - 開始プレイヤーのID
	 * @param players - プレイヤーリスト
	 * @returns ゲーム開始の成功状態とゲーム状態
	 */
	async handleStartGame(
		roomId: string,
		playerId: string,
		players: Player[]
	): Promise<{ success: boolean; gameState: GameState | null }> {
		const room = await this.getRoom(roomId);
		if (!this.isValidGameStart(room, playerId, players)) {
			return { success: false, gameState: null };
		}

		this.gameState = this.initializeGameState(players);
		if (room) await this.saveAndEmitGameState(room, roomId);

		return { success: true, gameState: this.gameState };
	}

	/**
	 * ケージクリックを処理する
	 * @param roomId - ルームID
	 * @param cageNumber - クリックされたケージの番号
	 * @param animalId - 配置する動物のID
	 * @param playerId - プレイヤーID
	 * @param callback - 処理結果を返すコールバック関数
	 */
	async handleCageClick(
		roomId: string,
		cageNumber: string,
		animalId: string,
		playerId: string,
		callback: (success: boolean, gameState: GameState | null) => void
	): Promise<void> {
		try {
			await this.prisma.$transaction(async (prisma) => {
				const room = await this.getRoom(roomId, prisma as PrismaClient);
				if (!room || !room.gameState) {
					callback(false, null);
					return;
				}
				this.gameState = room.gameState;

				if (!this.isValidCageClick(playerId, cageNumber, animalId)) {
					callback(false, null);
					return;
				}

				this.updateGameStateOnCageClick(cageNumber, animalId);
				await this.saveAndEmitGameState(
					room,
					roomId,
					prisma as PrismaClient
				);
				callback(true, this.gameState);
			}, this.getTransactionOptions());
		} catch (error) {
			console.error("Database transaction failed:", error);
			callback(false, null);
		}
	}

	/**
	 * ターン完了を処理する
	 * @param roomId - ルームID
	 * @param playerId - プレイヤーID
	 */
	async handleTurnComplete(roomId: string, playerId: string): Promise<void> {
		await this.prisma.$transaction(async (prisma) => {
			const room = await this.getRoom(roomId, prisma as PrismaClient);
			if (!room || !room.gameState) {
				throw new Error("Room or game state not found");
			}
			this.gameState = room.gameState;

			if (!canCompleteAction(this.gameState, playerId)) {
				throw new Error("Player action cannot be completed");
			}

			this.gameState = gameProgressMiddleware(this.gameState);
			await this.saveAndEmitGameState(
				room,
				roomId,
				prisma as PrismaClient
			);
		});
	}

	/**
	 * サイコロを振る処理を行う
	 * @param roomId - ルームID
	 * @param playerId - プレイヤーID
	 * @param diceCount - 振るサイコロの数
	 * @param callback - 処理結果を返すコールバック関数
	 */
	async handleDiceRoll(
		roomId: string,
		playerId: string,
		diceCount: number,
		callback: (success: boolean) => void
	): Promise<void> {
		try {
			await this.prisma.$transaction(async (prisma) => {
				const room = await this.getRoom(roomId, prisma as PrismaClient);
				if (!room || !room.gameState) {
					callback(false);
					return;
				}
				this.gameState = room.gameState;

				if (!this.isValidDiceRoll(playerId)) {
					callback(false);
					return;
				}

				this.processDiceRoll(diceCount, playerId);
				await this.saveAndEmitGameState(
					room,
					roomId,
					prisma as PrismaClient
				);
				callback(true);
			});
		} catch (error) {
			console.error("Dice roll failed:", error);
			callback(false);
		}
	}

	async handleStartTestGame(
		roomId: string,
		playerId: string
	): Promise<{ success: boolean; gameState: GameState | null }> {
		try {
			const result = await this.prisma.$transaction(async (prisma) => {
				const room = await this.getRoom(roomId, prisma as PrismaClient);
				if (!room || room.ownerId !== playerId) {
					return { success: false, gameState: null };
				}

				// ルームのゲーム状態を完全にリセット
				room.gameState = null;
				await saveRoomToDatabase(prisma as PrismaClient, room);

				const testPlayer: Player = {
					id: playerId,
					name: "Test Player",
					action: ActionState.INIT,
					turnCount: 0,
					poops: 0,
					money: 4,
					star: 0,
					inventory: [RessaPanda, Penguin],
					board: JSON.parse(JSON.stringify(initialBoard)), // ディープコピーを作成
					current: true,
					turnOrder: 0,
					startPlayer: true,
				};

				const testGameState: GameState = {
					players: [testPlayer],
					currentPlayer: testPlayer,
					phase: "init",
					roundNumber: 1,
				};

				room.gameState = testGameState;
				await this.saveAndEmitGameState(
					room,
					roomId,
					prisma as PrismaClient
				);

				return { success: true, gameState: testGameState };
			});

			return result; // トランザクションの結果を返す
		} catch (error) {
			console.error("Failed to start test game:", error);
			return { success: false, gameState: null };
		}
	}

	// 以下、プライベートメソッド

	/**
	 * ルームを取得する
	 * @param roomId - ルームID
	 * @param prisma - Prismaクライアントのインスタンス（オプション）
	 * @returns GameRoom | null
	 */
	private async getRoom(
		roomId: string,
		prisma?: PrismaClient
	): Promise<GameRoom | null> {
		return await getRoomFromDatabase(prisma || this.prisma, roomId);
	}

	/**
	 * ゲーム開始の妥当性をチェックする
	 * @param room - ゲームルーム
	 * @param playerId - 開始プレイヤーのID
	 * @param players - プレイヤーリスト
	 * @returns boolean
	 */
	private isValidGameStart(
		room: GameRoom | null,
		playerId: string,
		players: Player[]
	): boolean {
		return room !== null && room.ownerId === playerId && players !== null;
	}

	/**
	 * ゲーム状態を初期化する
	 * @param players - プレイヤーリスト
	 * @returns GameState
	 */
	private initializeGameState(players: Player[]): GameState {
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

		return {
			players: initializedPlayers,
			currentPlayer: this.getStartPlayer(initializedPlayers),
			phase: "init",
			roundNumber: 1,
		};
	}

	/**
	 * 開始プレイヤーを取得する
	 * @param players - プレイヤーリスト
	 * @returns Player
	 */
	private getStartPlayer(players: Player[]): Player {
		return players.find((player) => player.startPlayer) || players[0];
	}

	/**
	 * ゲーム状態を保存し、クライアントに送信する
	 * @param room - ゲームルーム
	 * @param roomId - ルームID
	 * @param prisma - Prismaクライアントのインスタンス（オプション）
	 */
	private async saveAndEmitGameState(
		room: GameRoom,
		roomId: string,
		prisma?: PrismaClient
	): Promise<void> {
		if (this.gameState) {
			room.gameState = this.gameState;
			room.version = (room.version || 0) + 1;
			await saveRoomToDatabase(prisma || this.prisma, room);
			try {
				io.to(roomId).emit(
					"gameStateUpdate",
					this.gameState,
					room.version
				);
			} catch (error) {
				console.error("Socket emit failed:", error);
			}
		}
	}

	/**
	 * ケージクリックの妥当性をチェックする
	 * @param playerId - プレイヤーID
	 * @param cageNumber - ケージ番号
	 * @param animalId - 動物ID
	 * @returns boolean
	 */
	private isValidCageClick(
		playerId: string,
		cageNumber: string,
		animalId: string
	): boolean {
		if (!this.gameState) return false;
		const currentPlayer = this.gameState.players.find((p) => p.current);
		if (!currentPlayer || currentPlayer.id !== playerId) return false;
		const board = currentPlayer.board;
		if (!board || !(cageNumber in board)) return false;
		const animalObject = animalMap[animalId as keyof typeof animalMap];
		if (!animalObject) return false;
		return true;
	}

	/**
	 * ケージクリック時のゲーム状態を更新する
	 * @param cageNumber - ケージ番号
	 * @param animalId - 動物ID
	 */
	private updateGameStateOnCageClick(
		cageNumber: string,
		animalId: string
	): void {
		if (!this.gameState) return;
		console.log("updateGameStateOnCageClick", cageNumber, animalId);

		const currentPlayer = this.gameState.players.find((p) => p.current);
		if (!currentPlayer || !currentPlayer.board) return;

		const cage = currentPlayer.board[cageNumber];

		const animalObject = animalMap[animalId as keyof typeof animalMap];

		// 既に同じ動物がいない場合のみ配置
		if (!cage.animals.some((animal) => animal.id === animalObject.id)) {
			console.log("cage.animals set", cage.animals);
			const animalIndex = currentPlayer.inventory.findIndex(
				(animal) => animal.id === animalId
			);
			if (animalIndex !== -1) {
				currentPlayer.inventory.splice(animalIndex, 1);
				cage.animals.push(animalObject as Animal);
				this.gameState = gameProgressMiddleware(this.gameState);
			}
		}
	}

	/**
	 * サイコロを振る処理の妥当性をチェックする
	 * @param playerId - プレイヤーID
	 * @returns boolean
	 */
	private isValidDiceRoll(playerId: string): boolean {
		if (!this.gameState) return false;
		const currentPlayer = this.gameState.players.find((p) => p.current);
		return (
			currentPlayer !== undefined &&
			currentPlayer.id === playerId &&
			currentPlayer.action === ActionState.ROLL
		);
	}

	/**
	 * サイコロを振る処理を行う
	 * @param diceCount - サイコロの数
	 * @param playerId - プレイヤーID
	 */
	private processDiceRoll(diceCount: number, playerId: string): void {
		if (!this.gameState) return;
		const currentPlayer = this.gameState.players.find((p) => p.current);
		if (!currentPlayer) return;
		const diceResult = this.rollDice(diceCount);
		currentPlayer.diceResult = diceResult;
		const effectProcessor = new AnimalEffectProcessor(this.gameState);
		this.gameState = effectProcessor.processEffects(diceResult, playerId);
		this.gameState = gameProgressMiddleware(this.gameState);
	}

	/**
	 * サイコロを振る
	 * @param count - サイコロの数
	 * @returns number
	 */
	private rollDice(count: number): number {
		return count === 1
			? Math.floor(Math.random() * 6) + 1
			: Math.floor(Math.random() * 11) + 2;
	}

	/**
	 * トランザクションのオプションを取得する
	 * @returns Prisma.TransactionOptions
	 */
	private getTransactionOptions() {
		return {
			timeout: 400000,
			maxWait: 15000,
		};
	}
}
