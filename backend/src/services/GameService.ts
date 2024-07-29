// GameService.ts
import { Prisma, PrismaClient, Room } from "@prisma/client";
import { Penguin } from "../types/Animal/Penguin";
import { RessaPanda } from "../types/Animal/RessaPanda";
import {
	GameState,
	Player,
	Animal,
	Board,
	ActionState,
	Phase,
	ResultPoops,
	Cage,
} from "../types/types";
import { initialBoard } from "../utils/initialBoard";
import { error } from "console";
import { RoomRepository } from "../repository/RoomRepository";

export class GameService {
	constructor(
		private prisma: PrismaClient,
		private repo: RoomRepository = new RoomRepository(prisma)
	) {}
	/*
	 * プレイヤーを初期化します。
	 * @param {Player[]} players - プレイヤー
	 * @returns {GameState} - ゲームの状態
	 */
	initializeGameState(players: Player[], playerId: string): GameState {
		return {
			players: players.map((player) => ({
				...player,
				inventory: [RessaPanda, Penguin],
				board: this.createEmptyBoard(),
				action: ActionState.INIT,
				current: playerId === player.id,
				poops: 0,
				money: 4,
				star: 0,
			})),
			phase: "init",
			roundNumber: 1,
			currentPlayer: players.find((player) => playerId === player.id),
			version: 0, // room作成時が0
		};
	}

	/**
	 * ゲームの状態の整合性を検証します。
	 * @param {GameState} gameState - ゲームの状態
	 * @param {GameState | null} prevData - 以前のゲームの状態
	 * @throws {Error} - ゲームの状態が不正に変更された場合
	 */
	validateGameStateIntegrity(
		gameState: GameState | Prisma.JsonObject,
		prevData: GameState | Prisma.JsonObject | null
	): void {
		if (
			prevData &&
			JSON.stringify(gameState) !== JSON.stringify(prevData)
		) {
			throw new Error("ゲームの状態が不正に変更されました");
		}
	}

	/**
	 * 動物を配置します。
	 * @param {GameState} gameState - ゲームの状態
	 * @param {string} playerId - プレイヤーID
	 * @param {string} cageNumber - ケージ番号
	 * @param {Animal} animal - 動物
	 * @returns {GameState} - ゲームの状態
	 * @throws {Error} - 動物がインベントリにない場合
	 * @throws {Error} - ケージが存在しない場合
	 * @throws {Error} - ケージが満杯の場合
	 * @throws {Error} - ケージに同じ動物がすでにいる場合
	 * @throws {Error} - ケージに異なる色の動物を配置しようとしたとき
	 */
	placeAnimal(
		gameState: GameState | Prisma.JsonObject,
		playerId: string,
		cageNumber: string,
		animal: Animal
	): GameState {
		const updatedPlayers = (gameState as GameState).players.map(
			(player) => {
				if (player.id === playerId) {
					const animalIndex = player.inventory.findIndex(
						(a) => a.id === animal.id
					);
					if (animalIndex === -1) {
						throw new Error("インベントリに動物がありません");
					}
					if (!player.board[cageNumber]) {
						throw new Error("ケージが存在しません");
					}
					if (player.board[cageNumber].animals.length >= 2) {
						throw new Error("ケージが満杯です");
					}
					if (
						player.board[cageNumber].animals.some(
							(a) => a.id === animal.id
						)
					) {
						throw new Error("ケージに同じ動物は配置できません");
					}
					if (
						player.board[cageNumber].animals.length > 0 &&
						player.board[cageNumber].animals[0].color !==
							animal.color
					) {
						throw new Error(
							"ケージに異なる色の動物を配置できません"
						);
					}

					const updatedInventory = [...player.inventory]; // インベントリを更新
					updatedInventory.splice(animalIndex, 1); // 動物をインベントリから削除
					const updatedBoard = { ...player.board }; // ボードを更新

					// if (!updatedBoard[cageNumber]) { // todo : error設計いる
					// 	updatedBoard[cageNumber] = { animals: [] };
					// }

					updatedBoard[cageNumber].animals.push(animal);
					// 変更後のプレイヤー情報を返す
					return {
						...player,
						inventory: updatedInventory,
						board: updatedBoard,
					};
				}
				return player;
			}
		);
		// gameStateのplayersを更新して返す
		return {
			...(gameState as GameState),
			players: updatedPlayers as Player[],
		};
	}

	/**
	 * ボードを初期化します。
	 * @returns
	 */
	private createEmptyBoard(): Board {
		const board: Board = initialBoard;
		return board;
	}

	/**
	 * プレイヤーのアクションを更新します。
	 * @param {GameState} gameState - ゲームの状態
	 * @param {string} playerId - プレイヤーID
	 * @param {string} action - アクション
	 * @returns {GameState} - ゲームの状態
	 */
	updatePlayerAction(
		gameState: GameState,
		playerId: string,
		action: string
	): GameState {
		const updatedPlayers = gameState.players.map((player) =>
			player.id === playerId
				? { ...player, action: action as ActionState }
				: player
		);
		// gameStateのplayersを更新して返す
		return { ...gameState, players: updatedPlayers };
	}

	/**
	 * プレイヤー全員の初期配置が完了したかどうかを確認します。
	 * @param {GameState} gameState - ゲームの状態
	 * @param {string} playerId - プレイヤーID
	 * @param {Animal} animal - 動物
	 * @returns {GameState} - ゲームの状態
	 */
	isInitialPlacementComplete(gameState: GameState): boolean {
		return gameState.players.every(
			(player) =>
				player.action === ActionState.POOP && // poopアクションに移行している
				player.inventory.length === 0 // インベントリが空
			// && this.countAnimalsOnBoard(player.board) === 2 // ボード上の動物が2匹
			//todo : 2匹にしないといけない↑テストのためコメントアウト
		);
	}

	/**
	 * プレイヤー単体の初期配置が完了したかどうかを確認します。
	 * @param {Player} player - プレイヤー
	 * @returns {boolean} - 初期配置かどうか
	 */
	isInitialPlacement(player: Player): boolean {
		return (
			player.inventory.length === 0 // インベントリが空
			// &&  this.countAnimalsOnBoard(player.board) === 2 // ボード上の動物が2匹
			//todo : 2匹にしないといけない↑テストのためコメントアウト
		);
	}

	/**
	 * ゲームのフェーズを更新します。
	 * @param gameState
	 * @param phase
	 * @returns
	 */
	updateGamePhase(gameState: GameState, phase: Phase): GameState {
		return { ...gameState, phase };
	}

	/**
	 * ゲームのラウンド数を更新します。
	 * @param gameState
	 * @param roundNumber
	 * @returns
	 */
	moveToNextPlayer(gameState: GameState): GameState {
		const currentPlayerIndex = gameState.players.findIndex(
			(player) => player.current
		);
		// todo: test用。プレイヤーが1人の場合は次のプレイヤーに移動しない
		if (gameState.players.length === 1) {
			return gameState;
		}

		const nextPlayerIndex =
			(currentPlayerIndex + 1) % gameState.players.length;
		const updatedPlayers = gameState.players.map((player, index) => ({
			...player,
			current: index === nextPlayerIndex,
		}));
		return { ...gameState, players: updatedPlayers };
	}

	/**
	 * gameStateに異常がないか確認します。
	 * @param roomId
	 * @returns
	 */
	async isValidateGameState(roomId: string): Promise<Room> {
		const room: Room | null = await this.repo.getRoomFromDatabase(roomId);
		if (!room || !room.gameState) {
			throw error("ルームまたはゲームデータがありません");
		}

		this.validateGameStateIntegrity(
			room?.gameState as Prisma.JsonObject,
			room?.prevGameState as Prisma.JsonObject
		);

		return room;
	}

	/**
	 * うんちの合計数を計算します。
	 * @param gameState
	 * @param playerId
	 * @returns
	 */
	calculateTotalPoops(board: Record<string, { animals: Animal[] }>): number {
		return Object.values(board).reduce(
			(total: number, cage: Record<string, Animal[]>) => {
				return (
					total +
					cage.animals.reduce(
						(cageTotal, animal) => cageTotal + (animal.poops || 0),
						0
					)
				);
			},
			0
		);
	}

	/**
	 * うんちの結果画面用のデータを生成します。
	 * @param board
	 * @returns
	 */
	calculatePoopResults(
		board: Record<string, { animals: Animal[] }>
	): ResultPoops[] {
		const animalCounts: Record<string, number> = {};
		const animalPoopCosts: Record<string, number> = {};

		// ボード上の動物の数とうんちコストを集計
		Object.values(board).forEach((cage) => {
			cage.animals.forEach((animal) => {
				animalCounts[animal.id] = (animalCounts[animal.id] || 0) + 1;
				animalPoopCosts[animal.id] = animal.poops || 0;
			});
		});

		// 結果を ResultPoops 形式で生成
		const results: ResultPoops[] = Object.entries(animalCounts).map(
			([animalId, count]) => ({
				animalId,
				animalCount: count,
				poopIcon: "💩",
				poopCost: animalPoopCosts[animalId],
				subtotal: count * animalPoopCosts[animalId],
			})
		);

		return results;
	}
	/**
	 * ボード上の動物の数を数えます。
	 * @param {Board} board - ボード
	 * @returns {number} - ボード上の動物の数
	 */
	private countAnimalsOnBoard(board: Board): number {
		return Object.values(board).reduce(
			(count, cage) => count + cage.animals.length,
			0
		);
	}

	/**
	 * ダイスを振ります。
	 * @param gameState
	 * @param playerId
	 * @returns
	 */
	rollDice(
		gameState: GameState,
		playerId: string,
		diceCount: number
	): { updatedGameState: GameState; diceResult: number[] } {
		// diceCount の数だけサイコロを振る。結果は配列でサイコロごとの目を格納する
		// const diceResult: number[] = Array.from(
		// 	{ length: diceCount },
		// 	() => Math.floor(Math.random() * 6) + 1
		// );

		// todo : テストのため固定値を返す。テスト後に上記の処理に変更する
		const diceResult: number[] = [3, 3];

		const updatedPlayers: Player[] = gameState.players.map((player) =>
			player.id === playerId ? { ...player, diceResult } : player
		);

		// gameStateのplayersを更新して返す
		return {
			updatedGameState: {
				...gameState,
				players: updatedPlayers,
			} as GameState,
			diceResult: diceResult as number[],
		};
	}
}
