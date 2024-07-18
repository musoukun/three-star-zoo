import { GameState, Player, Animal, Board } from "../types/types";
import { Effect } from "../types/AnimalEffect";
import { animalMap } from "../types/Animal/index";

/**
 * AnimalEffectProcessor class
 * 動物カードの効果を処理するクラス
 * @param {GameState} gameState - ゲームの状態
 * @returns {GameState} - 更新されたゲーム状態
 * @constructor	- ゲームの状態を初期化する
 * @method processEffects - 動物カードの効果を処理する
 * @method processPlayerEffects - プレイヤーの動物カードの効果を処理する
 * @method applyEffect - 動物カードの効果を適用する
 * @method evaluateCreationIf - 動物カードの効果を評価する
 * @method calculateBuffAmount - 動物カードの効果を計算する
 * @method countAnimalInBoard - ボード上の動物カードを数える
 */
export class AnimalEffectProcessor {
	constructor(private gameState: GameState) {}

	/**
	 * 動物カードの効果を処理する
	 * @param diceResult
	 * @param currentPlayerId
	 * @returns
	 */
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

	/**
	 * プレイヤーの動物カードの効果を処理する
	 * @param player
	 * @param diceResult
	 * @param isOtherPlayer
	 * @param isEndTiming
	 * @returns
	 */
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

			// 他のプレイヤーの効果を処理するか、効果のタイミングが一致しない場合はスキップ
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

	/**
	 * 動物カードの効果を適用する
	 * @param player
	 * @param effect
	 */
	private applyEffect(player: Player, effect: Effect) {
		// コインを増やす
		if (effect.creation) {
			player.money += effect.creation;
		}

		// 条件に応じてコインを増やす
		if (effect.creationIf) {
			const creationAmount = this.evaluateCreationIf(
				player,
				effect.creationIf
			);
			player.money += creationAmount;
		}

		// 動物カードの効果によってコインを増やす
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

		// 追加で動物カードの効果によってコインを増やす
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

	/**
	 * 条件式に応じて効果を処理する
	 * @param player
	 * @param condition
	 * @returns
	 */
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

	/**
	 * 動物カードの効果を計算する
	 * @param player
	 * @param animalId
	 * @param amount
	 * @param type
	 * @returns
	 */
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

	/**
	 * ボード上の動物カードを数える
	 * @param board
	 * @param animalId
	 * @returns
	 */
	private countAnimalInBoard(board: Board, animalId: string): number {
		return Object.values(board).reduce((count, cage) => {
			return (
				count +
				cage.animals.filter((animal) => animal.id === animalId).length
			);
		}, 0);
	}
}
