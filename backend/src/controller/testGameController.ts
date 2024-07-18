import { GameState } from "../types/types";
import { TestGameService as testGameService } from "../services/TestGameService";

export async function handleAddTestPlayer(
	data: { roomId: string; playerName: string },
	response: (success: boolean, gameState: GameState | null) => void
) {
	const gameState = await testGameService.addTestPlayer(
		data.roomId,
		data.playerName
	);
	response(true, gameState as unknown as GameState);
}

export async function handleSetCurrentPlayer(
	data: { roomId: string; playerId: string },
	response: (success: boolean, gameState: GameState | null) => void
) {
	const gameState = await testGameService.setCurrentPlayer(
		data.roomId,
		data.playerId
	);
	response(true, gameState as unknown as GameState);
}

export async function handleAddCoins(
	data: { roomId: string; amount: number },
	response: (success: boolean, gameState: GameState | null) => void
) {
	const gameState = await testGameService.addCoins(data.roomId, data.amount);
	response(true, gameState as unknown as GameState);
}

export async function handlePlaceAnimal(
	data: { roomId: string; cageNumber: string; animalId: string },
	response: (success: boolean, gameState: GameState | null) => void
) {
	const gameState = await testGameService.placeAnimal(
		data.roomId,
		data.cageNumber,
		data.animalId
	);
	response(true, gameState as unknown as GameState);
}

export async function handleChangePhase(
	data: { roomId: string; phase: string },
	response: (success: boolean, gameState: GameState | null) => void
) {
	const gameState = await testGameService.changePhase(
		data.roomId,
		data.phase
	);
	response(true, gameState as unknown as GameState);
}

export async function handleTestRollDice(
	data: { roomId: string },
	response: (success: boolean, gameState: GameState | null) => void
) {
	const gameState = await testGameService.rollDice(data.roomId);
	response(true, gameState as unknown as GameState);
}

export async function handlePoopAction(
	data: { roomId: string },
	response: (success: boolean, gameState: GameState | null) => void
) {
	const gameState = await testGameService.poopAction(data.roomId);
	response(true, gameState as unknown as GameState);
}

export async function handleFlushAction(
	data: { roomId: string },
	response: (success: boolean, gameState: GameState | null) => void
) {
	const gameState = await testGameService.flushAction(data.roomId);
	response(true, gameState as unknown as GameState);
}
