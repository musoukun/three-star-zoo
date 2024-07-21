// EffectService.ts

import { PrismaClient } from "@prisma/client";
import { GameState, Player, Animal, Effect } from "../types/types";

export class EffectService {
	constructor(private prisma: PrismaClient) {}

	async processEffects(
		gameState: GameState,
		rollingPlayerId: string,
		diceResult: number
	): Promise<GameState> {
		const updatedGameState = { ...gameState };
		const players = updatedGameState.players;
		const playerOrder = this.getPlayerOrder(players, rollingPlayerId);

		for (const playerId of playerOrder) {
			const player = players.find((p) => p.id === playerId);
			if (player) {
				this.processPlayerEffects(player, diceResult, updatedGameState);
			}
		}

		this.processEndEffects(updatedGameState, diceResult);

		return updatedGameState;
	}

	private getPlayerOrder(
		players: Player[],
		rollingPlayerId: string
	): string[] {
		const playerIds = players.map((p: Player) => p.id as string);
		const rollingPlayerIndex = playerIds.indexOf(rollingPlayerId);
		if (rollingPlayerIndex === -1) {
			throw new Error("Rolling player not found");
		}
		return [
			...playerIds.slice(rollingPlayerIndex + 1),
			...playerIds.slice(0, rollingPlayerIndex),
			rollingPlayerId,
		];
	}

	private processPlayerEffects(
		player: Player,
		diceResult: number,
		gameState: GameState
	): void {
		const cage = player.board[`cage${diceResult}`];
		if (cage) {
			for (const animal of cage.animals) {
				this.processAnimalEffect(animal, player, gameState);
			}
		}
	}

	private processAnimalEffect(
		animal: Animal,
		player: Player,
		gameState: GameState
	): void {
		const effect = animal.effect;
		if (!effect) return;

		if (effect.timing === "first" || effect.global) {
			this.executeEffect(effect, player, gameState);
		}
	}

	private processEndEffects(gameState: GameState, diceResult: number): void {
		for (const player of gameState.players) {
			const cage = player.board[`cage${diceResult}`];
			if (cage) {
				for (const animal of cage.animals) {
					if (animal.effect && animal.effect.timing === "end") {
						this.executeEffect(animal.effect, player, gameState);
					}
				}
			}
		}
	}

	private executeEffect(
		effect: Effect,
		player: Player,
		gameState: GameState
	): void {
		if (effect.creation) {
			this.handleCreation(effect.creation, player);
		}

		if (effect.creationIf) {
			this.handleCreationIf(effect.creationIf, player);
		}

		if (effect.buff) {
			this.handleBuff(effect.buff, player);
		}

		if (effect.bonusbuff) {
			this.handleBonusBuff(effect.bonusbuff, player);
		}

		if (effect.steal) {
			this.handleSteal(effect.steal, player, gameState);
		}

		if (effect.choice) {
			this.handleChoice(effect.choice, player, gameState);
		}
	}

	private handleCreation(creation: number, player: Player): void {
		player.money += creation;
	}

	private handleCreationIf(creationIf: string[], player: Player): void {
		const [
			animalId,
			operator,
			count,
			questionMark,
			trueValue,
			colon,
			falseValue,
		] = creationIf;
		const animalCount = this.countAnimalOnBoard(player.board, animalId);

		const condition = this.evaluateCondition(
			animalCount,
			operator,
			parseInt(count)
		);
		const creationAmount = condition
			? parseInt(trueValue)
			: parseInt(falseValue);

		player.money += creationAmount;
	}

	private handleBuff(buff: [number, string, string], player: Player): void {
		const [amount, animalId, type] = buff;
		const animalCount = this.countAnimalOnBoard(player.board, animalId);

		if (type === "each") {
			player.money += amount * animalCount;
		} else if (type === "once" && animalCount > 0) {
			player.money += amount;
		}
	}

	private handleBonusBuff(
		bonusbuff: [number, string, string],
		player: Player
	): void {
		this.handleBuff(bonusbuff, player);
	}

	private handleSteal(
		steal: [number, string, number?, string?],
		player: Player,
		gameState: GameState
	): void {
		const [amount, target, count, type] = steal;
		// ここでは、フロントエンドとの通信が必要なため、実際の処理は保留します
		// フロントエンドにemitして、ユーザー選択のイベントを発生させる必要があります
	}

	private handleChoice(
		choice: string[],
		player: Player,
		gameState: GameState
	): void {
		// ここでも、フロントエンドとの通信が必要なため、実際の処理は保留します
		// フロントエンドにemitして、選択肢を選択させるイベントを発生させる必要があります
	}

	private countAnimalOnBoard(
		board: Record<string, { animals: Animal[] }>,
		animalId: string
	): number {
		return Object.values(board).reduce((count, cage) => {
			return (
				count +
				cage.animals.filter((animal) => animal.id === animalId).length
			);
		}, 0);
	}

	private evaluateCondition(
		value: number,
		operator: string,
		threshold: number
	): boolean {
		switch (operator) {
			case ">=":
				return value >= threshold;
			case "<=":
				return value <= threshold;
			case ">":
				return value > threshold;
			case "<":
				return value < threshold;
			case "==":
				return value === threshold;
			default:
				return false;
		}
	}
}
