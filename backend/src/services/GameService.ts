// GameService.ts
import { Room } from "@prisma/client";
import { Penguin } from "../types/Animal/Penguin";
import { RessaPanda } from "../types/Animal/RessaPanda";
import {
	GameState,
	Player,
	Animal,
	Board,
	ActionState,
	Phase,
} from "../types/types";
import { initialBoard } from "../utils/initialBoard";

export class GameService {
	/*
	 * プレイヤーを初期化します。
	 * @param {Player[]} players - プレイヤー
	 * @returns {GameState} - ゲームの状態
	 */
	initializeGameState(players: Player[]): GameState {
		return {
			players: players.map((player, index) => ({
				...player,
				inventory: [RessaPanda, Penguin],
				board: this.createEmptyBoard(),
				action: ActionState.INIT,
				current: index === 0,
				poops: 0,
				money: 4,
				star: 0,
			})),
			phase: "init",
			roundNumber: 1,
		};
	}

	/**
	 * ゲームの状態の整合性を検証します。
	 * @param {GameState} gameState - ゲームの状態
	 * @param {GameState | null} prevData - 以前のゲームの状態
	 * @throws {Error} - ゲームの状態が不正に変更された場合
	 */
	validateGameStateIntegrity(
		gameState: GameState,
		prevData: GameState | null
	): void {
		if (
			prevData &&
			JSON.stringify(gameState) !== JSON.stringify(prevData)
		) {
			throw new Error("Game state integrity violation");
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
		gameState: GameState,
		playerId: string,
		cageNumber: string,
		animal: Animal
	): GameState {
		const updatedPlayers = gameState.players.map((player) => {
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
					player.board[cageNumber].animals[0].color !== animal.color
				) {
					throw new Error("ケージに異なる色の動物を配置できません");
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
		});
		// gameStateのplayersを更新して返す
		return { ...gameState, players: updatedPlayers };
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
	 * 初期配置が完了しているかどうかを確認します。
	 * @param {GameState} gameState - ゲームの状態
	 * @param {string} playerId - プレイヤーID
	 * @param {Animal} animal - 動物
	 * @returns {GameState} - ゲームの状態
	 */
	isInitialPlacementComplete(gameState: GameState): boolean {
		return gameState.players.every(
			(player) =>
				player.action === ActionState.POOP && // poopアクションに移行している
				player.inventory.length === 0 && // インベントリが空
				this.countAnimalsOnBoard(player.board) === 2 // ボード上の動物が2匹
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
		const nextPlayerIndex =
			(currentPlayerIndex + 1) % gameState.players.length;
		const updatedPlayers = gameState.players.map((player, index) => ({
			...player,
			current: index === nextPlayerIndex,
		}));
		return { ...gameState, players: updatedPlayers };
	}

	/**
	 * ダイスを振ります。
	 * @param gameState
	 * @param playerId
	 * @returns
	 */
	rollDice(gameState: GameState, playerId: string): GameState {
		const diceResult = Math.floor(Math.random() * 6) + 1;
		const updatedPlayers = gameState.players.map((player) =>
			player.id === playerId ? { ...player, diceResult } : player
		);
		return { ...gameState, players: updatedPlayers };
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
}
