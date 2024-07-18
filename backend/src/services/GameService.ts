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

	validateGameStateIntegrity(
		gameState: Room["data"],
		prevData: Room["prevData"]
	): void {
		if (
			prevData &&
			JSON.stringify(gameState) !== JSON.stringify(prevData)
		) {
			throw new Error("Game state integrity violation");
		}
	}

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
					throw new Error("Animal not found in player inventory");
				}
				const updatedInventory = [...player.inventory];
				updatedInventory.splice(animalIndex, 1);
				const updatedBoard = { ...player.board };
				// if (!updatedBoard[cageNumber]) { // ここは不要
				// 	updatedBoard[cageNumber] = { animals: [] };
				// }
				updatedBoard[cageNumber].animals.push(animal);
				return {
					...player,
					inventory: updatedInventory,
					board: updatedBoard,
				};
			}
			return player;
		});
		return { ...gameState, players: updatedPlayers };
	}

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
		return { ...gameState, players: updatedPlayers };
	}

	isInitialPlacementComplete(gameState: GameState): boolean {
		return gameState.players.every(
			(player) =>
				player.action === ActionState.POOP &&
				player.inventory.length === 0 &&
				this.countAnimalsOnBoard(player.board) === 2
		);
	}

	updateGamePhase(gameState: GameState, phase: Phase): GameState {
		return { ...gameState, phase };
	}

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
