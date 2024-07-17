import { GameState, Player, Animal, Board } from "../types/types";
import { Effect } from "../types/AnimalEffect";
import { animalMap } from "../types/Animal/index";

export class AnimalEffectProcessor {
	constructor(private gameState: GameState) {}

	processEffects(diceResult: number, currentPlayerId: string): GameState {
		const updatedGameState = { ...this.gameState };
		const currentPlayerIndex = updatedGameState.players.findIndex(
			(p) => p.id === currentPlayerId
		);

		// First, process effects for other players
		for (let i = 1; i <= updatedGameState.players.length - 1; i++) {
			const playerIndex =
				(currentPlayerIndex + i) % updatedGameState.players.length;
			this.processPlayerEffects(
				updatedGameState.players[playerIndex],
				diceResult,
				true
			);
		}

		// Then, process effects for the current player
		this.processPlayerEffects(
			updatedGameState.players[currentPlayerIndex],
			diceResult,
			false
		);

		// Process end timing effects
		updatedGameState.players.forEach((player) => {
			this.processPlayerEffects(player, diceResult, false, true);
		});

		return updatedGameState;
	}

	private processPlayerEffects(
		player: Player,
		diceResult: number,
		isOtherPlayer: boolean,
		isEndTiming: boolean = false
	) {
		const cage = player.board[`cage${diceResult}`];
		if (!cage) return;

		cage.animals.forEach((animal) => {
			const animalData = animalMap[animal.id as keyof typeof animalMap];
			if (!animalData || !animalData.effect) return;

			if (
				(isOtherPlayer && !animalData.effect.global) ||
				(isEndTiming && animalData.effect.timing !== "end") ||
				(!isEndTiming && animalData.effect.timing === "end")
			) {
				return;
			}

			this.applyEffect(player, animalData.effect);
		});
	}

	private applyEffect(player: Player, effect: Effect) {
		if (effect.creation) {
			player.money += effect.creation;
		}

		if (effect.creationIf) {
			const creationAmount = this.evaluateCreationIf(
				player,
				effect.creationIf
			);
			player.money += creationAmount;
		}

		if (effect.buff) {
			const [amount, animalId, type] = effect.buff;
			const buffAmount = this.calculateBuffAmount(
				player,
				animalId,
				amount,
				type
			);
			player.money += buffAmount;
		}

		if (effect.bonusbuff) {
			const [amount, animalId, type] = effect.bonusbuff;
			const bonusBuffAmount = this.calculateBuffAmount(
				player,
				animalId,
				amount,
				type
			);
			player.money += bonusBuffAmount;
		}

		// Note: steal and choice effects are not implemented here as they require frontend interaction
	}

	private evaluateCreationIf(player: Player, condition: string[]): number {
		const [animalId, operator, count, _, trueValue, __, falseValue] =
			condition;
		const animalCount = this.countAnimalInBoard(player.board, animalId);

		switch (operator) {
			case ">=":
				return animalCount >= parseInt(count)
					? parseInt(trueValue)
					: parseInt(falseValue);
			case "<=":
				return animalCount <= parseInt(count)
					? parseInt(trueValue)
					: parseInt(falseValue);
			case ">":
				return animalCount > parseInt(count)
					? parseInt(trueValue)
					: parseInt(falseValue);
			case "<":
				return animalCount < parseInt(count)
					? parseInt(trueValue)
					: parseInt(falseValue);
			case "==":
				return animalCount === parseInt(count)
					? parseInt(trueValue)
					: parseInt(falseValue);
			default:
				return 0;
		}
	}

	private calculateBuffAmount(
		player: Player,
		animalId: string,
		amount: number,
		type: string
	): number {
		const animalCount = this.countAnimalInBoard(player.board, animalId);
		return type === "each"
			? animalCount * amount
			: animalCount > 0
				? amount
				: 0;
	}

	private countAnimalInBoard(board: Board, animalId: string): number {
		return Object.values(board).reduce((count, cage) => {
			return (
				count +
				cage.animals.filter((animal) => animal.id === animalId).length
			);
		}, 0);
	}
}
