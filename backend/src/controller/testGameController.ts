import { PrismaClient } from "@prisma/client";
import { TestGameService } from "../services/TestGameService";
import { GameState } from "../types/types";

export class TestGameController {
	private testGameService: TestGameService;

	constructor(prisma: PrismaClient) {
		this.testGameService = new TestGameService(prisma);
	}

	async handleStartTestGame(
		data: { roomId: string; playerId: string },
		response: (success: boolean, gameState: GameState | null) => void
	): Promise<void> {
		const gameState = await this.testGameService.startTestGame(
			data.roomId,
			data.playerId
		);
		response(true, gameState as unknown as GameState);
	}

	async handleAddTestPlayer(
		data: { roomId: string; playerName: string },
		response: (success: boolean, gameState: GameState | null) => void
	): Promise<void> {
		const gameState = await this.testGameService.addTestPlayer(
			data.roomId,
			data.playerName
		);
		response(true, gameState as unknown as GameState);
	}

	async handleSetCurrentPlayer(
		data: { roomId: string; playerId: string },
		response: (success: boolean, gameState: GameState | null) => void
	): Promise<void> {
		const gameState = await this.testGameService.setCurrentPlayer(
			data.roomId,
			data.playerId
		);
		response(true, gameState as unknown as GameState);
	}

	async handleAddCoins(
		data: { roomId: string; amount: number },
		response: (success: boolean, gameState: GameState | null) => void
	): Promise<void> {
		const gameState = await this.testGameService.addCoins(
			data.roomId,
			data.amount
		);
		response(true, gameState as unknown as GameState);
	}

	async handlePlaceAnimal(
		data: { roomId: string; cageNumber: string; animalId: string },
		response: (success: boolean, gameState: GameState | null) => void
	): Promise<void> {
		const gameState = await this.testGameService.placeAnimal(
			data.roomId,
			data.cageNumber,
			data.animalId
		);
		response(true, gameState as unknown as GameState);
	}

	async handleChangePhase(
		data: { roomId: string; phase: string },
		response: (success: boolean, gameState: GameState | null) => void
	): Promise<void> {
		const gameState = await this.testGameService.changePhase(
			data.roomId,
			data.phase
		);
		response(true, gameState as unknown as GameState);
	}

	async handleTestRollDice(
		data: { roomId: string },
		response: (success: boolean, gameState: GameState | null) => void
	): Promise<void> {
		const gameState = await this.testGameService.rollDice(data.roomId);
		response(true, gameState as unknown as GameState);
	}

	async handlePoopAction(
		data: { roomId: string },
		response: (success: boolean, gameState: GameState | null) => void
	): Promise<void> {
		const gameState = await this.testGameService.poopAction(data.roomId);
		response(true, gameState as unknown as GameState);
	}

	async handleFlushAction(
		data: { roomId: string },
		response: (success: boolean, gameState: GameState | null) => void
	): Promise<void> {
		const gameState = await this.testGameService.flushAction(data.roomId);
		response(true, gameState as unknown as GameState);
	}
}
