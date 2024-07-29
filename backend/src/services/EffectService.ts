// EffectService.ts

import { PrismaClient } from "@prisma/client";
import { Server } from "socket.io";
import {
	GameState,
	Player,
	Animal,
	Effect,
	EffectResults,
	PlayerEffectResult,
	ActionState,
} from "../types/types";
import { GameService } from "./GameService";

export class EffectService {
	private socketId: string = "";
	private roomId: string = "";
	constructor(
		private prisma: PrismaClient,
		private io: Server,
		private gameService: GameService
	) {
		this.prisma = prisma;
		this.io = io;
		this.gameService = new GameService(prisma);
	}

	/**
	 * ダイスの結果に応じてプレイヤーの効果を処理します。
	 */
	public async processEffects(
		gameState: GameState,
		rollingPlayerId: string,
		socketId: string,
		roomId: string,
		diceResult: number
	): Promise<GameState> {
		this.socketId = socketId;
		this.roomId = roomId;
		console.log(
			`Starting processEffects for player ${rollingPlayerId} with dice result ${diceResult}`
		);
		try {
			const updatedGameState = { ...gameState };
			const players = updatedGameState.players;
			const playerOrder = this.getPlayerOrder(players, rollingPlayerId);
			const effectResults: PlayerEffectResult[] = [];

			for (const playerId of playerOrder) {
				const player = players.find((p) => p.id === playerId);
				if (player) {
					console.log(`Processing effects for player ${player.name}`);
					const playerEffectResult = await this.processPlayerEffects(
						player,
						diceResult,
						updatedGameState
					);
					effectResults.push(playerEffectResult);
				}
			}

			this.processEndEffects(updatedGameState, diceResult);
			updatedGameState.effectResults = effectResults;

			console.log("Effect processing completed successfully");
			return updatedGameState;
		} catch (error) {
			console.error("Error in processEffects:", error);
			throw error;
		}
	}

	private getPlayerOrder(
		players: Player[],
		rollingPlayerId: string
	): string[] {
		try {
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
		} catch (error) {
			console.error("Error in getPlayerOrder:", error);
			throw error;
		}
	}

	private async processPlayerEffects(
		player: Player,
		diceResult: number,
		gameState: GameState
	): Promise<PlayerEffectResult> {
		console.log(
			`Processing effects for player ${player.name} with dice result ${diceResult}`
		);
		try {
			const initialCoins = player.money;
			const initialStars = player.star;
			const effects: { animalId: string; description: string }[] = [];

			const cage = player.board[`cage${diceResult}`];
			if (cage) {
				for (const animal of cage.animals) {
					console.log(`Processing effect for animal ${animal.id}`);
					const effectDescription = await this.processAnimalEffect(
						animal,
						player,
						gameState
					);
					if (effectDescription) {
						effects.push({
							animalId: animal.id,
							description: effectDescription,
						});
					}
				}
			}

			return {
				playerId: player.id as string,
				playerName: player.name,
				effects,
				initialCoins,
				finalCoins: player.money,
				coinDifference: player.money - initialCoins,
				initialStars,
				finalStars: player.star,
				starDifference: player.star - initialStars,
			};
		} catch (error) {
			console.error(
				`Error in processPlayerEffects for player ${player.name}:`,
				error
			);
			throw error;
		}
	}

	private async processAnimalEffect(
		animal: Animal,
		player: Player,
		gameState: GameState
	): Promise<string | null> {
		console.log(
			`Processing effect for animal ${animal.id} of player ${player.name}`
		);
		try {
			const effect = animal.effect;
			if (!effect) return null;

			if (effect.timing === "first" || effect.global) {
				return await this.executeEffect(effect, player, gameState);
			}
			return null;
		} catch (error) {
			console.error(
				`Error in processAnimalEffect for animal ${animal.id}:`,
				error
			);
			throw error;
		}
	}

	private processEndEffects(gameState: GameState, diceResult: number): void {
		console.log(`Processing end effects for dice result ${diceResult}`);
		try {
			for (const player of gameState.players) {
				const cage = player.board[`cage${diceResult}`];
				if (cage) {
					for (const animal of cage.animals) {
						if (animal.effect && animal.effect.timing === "end") {
							this.executeEffect(
								animal.effect,
								player,
								gameState
							);
						}
					}
				}
			}
		} catch (error) {
			console.error("Error in processEndEffects:", error);
			throw error;
		}
	}

	private async executeEffect(
		effect: Effect,
		player: Player,
		gameState: GameState
	): Promise<string> {
		console.log(`Executing effect for player ${player.name}`);
		try {
			let description = "";

			if (effect.creation) {
				const creationAmount = this.handleCreation(
					effect.creation,
					player
				);
				description += `コイン+${creationAmount} `;
			}

			if (effect.creationIf) {
				const creationAmount = this.handleCreationIf(
					effect.creationIf,
					player
				);
				description += `コイン${creationAmount >= 0 ? "+" : ""}${creationAmount} `;
			}

			if (effect.buff) {
				const buffAmount = this.handleBuff(effect.buff, player);
				description += `コイン+${buffAmount} `;
			}

			if (effect.bonusbuff) {
				const bonusBuffAmount = this.handleBonusBuff(
					effect.bonusbuff,
					player
				);
				description += `ボーナスコイン+${bonusBuffAmount} `;
			}

			if (effect.steal) {
				const stealDescription = await this.handleSteal(
					effect.steal,
					player,
					gameState
				);
				description += stealDescription;
			}

			if (effect.choice) {
				const choiceDescription = await this.handleChoice(
					effect.choice,
					player,
					gameState
				);
				description += choiceDescription;
			}

			console.log(`Effect execution completed: ${description.trim()}`);
			return description.trim();
		} catch (error) {
			console.error(
				`Error in executeEffect for player ${player.name}:`,
				error
			);
			throw error;
		}
	}

	private handleCreation(creation: number, player: Player): number {
		console.log(
			`Handling creation effect: +${creation} coins for player ${player.name}`
		);
		player.money += creation;
		return creation;
	}

	private handleCreationIf(creationIf: string[], player: Player): number {
		console.log(
			`Handling conditional creation effect for player ${player.name}`
		);
		try {
			const [animalId, operator, count, , trueValue, , falseValue] =
				creationIf;
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
			console.log(`Conditional creation result: ${creationAmount} coins`);
			return creationAmount;
		} catch (error) {
			console.error("Error in handleCreationIf:", error);
			throw error;
		}
	}

	private handleBuff(buff: [number, string, string], player: Player): number {
		console.log(`Handling buff effect for player ${player.name}`);
		try {
			const [amount, animalId, type] = buff;
			const animalCount = this.countAnimalOnBoard(player.board, animalId);

			let buffAmount = 0;
			if (type === "each") {
				buffAmount = amount * animalCount;
			} else if (type === "once" && animalCount > 0) {
				buffAmount = amount;
			}

			player.money += buffAmount;
			console.log(`Buff effect result: +${buffAmount} coins`);
			return buffAmount;
		} catch (error) {
			console.error("Error in handleBuff:", error);
			throw error;
		}
	}

	private handleBonusBuff(
		bonusbuff: [number, string, string],
		player: Player
	): number {
		console.log(`Handling bonus buff effect for player ${player.name}`);
		return this.handleBuff(bonusbuff, player);
	}

	private async handleSteal(
		steal: [number, string, number?, string?],
		player: Player,
		gameState: GameState
	): Promise<string> {
		console.log(`Handling steal effect for player ${player.name}`);
		try {
			const [amount, target, count, type] = steal;
			const targetPlayers = gameState.players.filter(
				(p) => p.id !== player.id
			);

			let stealDescription = "";

			if (target === "anyone" && targetPlayers.length > 0) {
				this.io.emit("waitingForPlayerSelection", {
					playerId: player.id,
					roomId: this.roomId,
				});
				const selectedPlayerId = await this.requestPlayerSelection(
					player.id as string,
					targetPlayers.map((p) => p.id as string)
				);
				this.io.emit("playerSelectionComplete", {
					roomId: this.roomId,
				});
				const selectedPlayer = gameState.players.find(
					(p) => p.id === selectedPlayerId
				);
				if (selectedPlayer) {
					const stolenAmount = this.executeSteal(
						player,
						selectedPlayer,
						amount,
						type as "coin" | "star"
					);
					stealDescription = `${
						type === "coin" ? "コイン" : "スター"
					}を${stolenAmount}個奪う `;
				}
			} else if (target === "all") {
				let totalStolen = 0;
				targetPlayers.forEach((targetPlayer) => {
					totalStolen += this.executeSteal(
						player,
						targetPlayer,
						amount,
						type as "coin" | "star"
					);
				});
				stealDescription = `全プレイヤーから${
					type === "coin" ? "コイン" : "スター"
				}を合計${totalStolen}個奪う `;
			}

			console.log(`Steal effect completed: ${stealDescription}`);
			return stealDescription;
		} catch (error) {
			console.error("Error in handleSteal:", error);
			throw error;
		}
	}

	private async handleChoice(
		choice: string[],
		player: Player,
		gameState: GameState
	): Promise<string> {
		console.log(`Handling choice effect for player ${player.name}`);
		try {
			this.io.emit("waitingForPlayerChoice", {
				playerId: player.id,
				roomId: this.roomId,
			});
			const selectedChoice = await this.requestChoiceSelection(
				player.id as string,
				choice
			);
			this.io.emit("playerChoiceComplete", { roomId: this.roomId });
			const choiceDescription = this.executeChoice(
				player,
				selectedChoice,
				gameState
			);
			console.log(`Choice effect completed: ${choiceDescription}`);
			return choiceDescription;
		} catch (error) {
			console.error("Error in handleChoice:", error);
			throw error;
		}
	}

	private async requestChoiceSelection(
		playerId: string,
		choices: string[]
	): Promise<string> {
		console.log(`Requesting choice selection for player ${playerId}`);
		return new Promise((resolve) => {
			this.io.to(this.socketId).emit("requestChoiceSelection", choices);
			this.io.once(
				"choiceSelection",
				(data: { selectedChoice: string }) => {
					console.log(
						`Player ${playerId} selected choice: ${data.selectedChoice}`
					);
					resolve(data.selectedChoice);
				}
			);
		});
	}

	private executeSteal(
		player: Player,
		targetPlayer: Player,
		amount: number,
		type: "coin" | "star"
	): number {
		console.log(
			`Executing steal: ${player.name} stealing from ${targetPlayer.name}`
		);
		if (type === "coin") {
			const stolenAmount = Math.min(targetPlayer.money, amount);
			player.money += stolenAmount;
			targetPlayer.money -= stolenAmount;
			console.log(`${stolenAmount} coins stolen`);
			return stolenAmount;
		} else if (type === "star") {
			const stolenAmount = Math.min(targetPlayer.star, amount);
			player.star += stolenAmount;
			targetPlayer.star -= stolenAmount;
			console.log(`${stolenAmount} stars stolen`);
			return stolenAmount;
		}
		return 0;
	}

	private executeChoice(
		player: Player,
		choice: string,
		gameState: GameState
	): string {
		console.log(`Executing choice for player ${player.name}: ${choice}`);
		// ここで選択された効果を実行します
		// 例: choice === 'getCoin' ? player.money += 3 : player.star += 1;
		return `${choice}を選択 `;
	}

	private countAnimalOnBoard(
		board: Record<string, { animals: Animal[] }>,
		animalId: string
	): number {
		const count = Object.values(board).reduce((count, cage) => {
			return (
				count +
				cage.animals.filter((animal) => animal.id === animalId).length
			);
		}, 0);
		console.log(`Counted ${count} ${animalId} on the board`);
		return count;
	}

	private evaluateCondition(
		value: number,
		operator: string,
		threshold: number
	): boolean {
		let result: boolean;
		switch (operator) {
			case ">=":
				result = value >= threshold;
				break;
			case "<=":
				result = value <= threshold;
				break;
			case ">":
				result = value > threshold;
				break;
			case "<":
				result = value < threshold;
				break;
			case "==":
				result = value === threshold;
				break;
			default:
				result = false;
		}
		console.log(
			`Condition evaluation: ${value} ${operator} ${threshold} = ${result}`
		);
		return result;
	}

	async processChoiceEffect(
		gameState: GameState,
		playerId: string,
		selectedChoice: string
	): Promise<GameState> {
		const player = gameState.players.find((p) => p.id === playerId);
		if (!player) throw new Error("Player not found");

		const currentAnimal = this.getCurrentAnimal(
			player,
			gameState.diceResult as number[]
		);
		if (!currentAnimal || !currentAnimal.effect)
			throw new Error("No valid animal or effect found");

		const effect = currentAnimal.effect;

		switch (selectedChoice) {
			case "steal":
				if (effect.steal) {
					const [amount, target, count] = effect.steal;
					if (target === "anyone") {
						const targetPlayerId =
							await this.requestPlayerSelection(
								playerId,
								gameState.players
									.filter((p) => p.id !== playerId)
									.map((p) => p.id as string)
							);
						const targetPlayer = gameState.players.find(
							(p) => p.id === targetPlayerId
						);
						if (targetPlayer) {
							const stolenAmount = this.executeSteal(
								player,
								targetPlayer,
								amount,
								"coin"
							);
							console.log(
								`Player ${player.name} stole ${stolenAmount} coins from ${targetPlayer.name}`
							);
						}
					}
					// Handle other steal cases if needed
				}
				break;
			case "creation":
				if (effect.creation) {
					const creationAmount = this.handleCreation(
						effect.creation,
						player
					);
					console.log(
						`Player ${player.name} gained ${creationAmount} coins`
					);
				}
				break;
			default:
				throw new Error("Invalid choice selected");
		}

		return gameState;
	}

	private getCurrentAnimal(
		player: Player,
		diceResult: number[]
	): Animal | undefined {
		const cageNumber = `cage${diceResult[0] + diceResult[1]}`;
		return player.board[cageNumber]?.animals[0];
	}

	private async requestPlayerSelection(
		playerId: string,
		targetPlayerIds: string[]
	): Promise<string> {
		return new Promise((resolve) => {
			this.io
				.to(this.socketId)
				.emit("requestPlayerSelection", targetPlayerIds);
			this.io.once("playerSelection", ({ selectedPlayerId }) => {
				console.log(
					`Player ${playerId} selected player ${selectedPlayerId}`
				);
				resolve(selectedPlayerId);
			});
		});
	}
}
