// GameController.ts
import { PrismaClient, Room } from "@prisma/client";
import { GameService } from "../services/GameService";
import { RoomService } from "../services/RoomService";
import { GameState, Player, Animal } from "../types/types";

const prisma = new PrismaClient();

export class GameController {
	constructor(
		private gameService: GameService = new GameService(),
		private roomService: RoomService = new RoomService(prisma)
	) {}

	async handleStartGame(
		roomId: string,
		playerId: string,
		players: Player[],
		response: (success: boolean, gameState: GameState | null) => void
	): Promise<void> {
		const room = await this.roomService.getRoomById(roomId);
		if (!room) {
			throw new Error("Room not found");
		}
		//todo 後でチェック処理に使用するかも
		console.log("ゲーム開始した人", playerId);
		const initialGameState: GameState =
			this.gameService.initializeGameState(players);
		const updatedGameState: GameState =
			await this.roomService.updateRoomWithGameState(
				room.id,
				initialGameState
			);

		response(true, updatedGameState as unknown as GameState);
	}

	async handleCageClick(
		roomId: string,
		playerId: string,
		cageNumber: string,
		animal: Animal
	): Promise<GameState> {
		const room: Room | null = await this.roomService.getRoomById(roomId);
		if (!room || !room.data) {
			throw new Error("Room or game state not found");
		}

		this.gameService.validateGameStateIntegrity(room.data, room.prevData);

		let updatedGameState = this.gameService.placeAnimal(
			room.data as unknown as GameState,
			playerId,
			cageNumber,
			animal
		);
		updatedGameState = this.gameService.updatePlayerAction(
			updatedGameState,
			playerId,
			"poop"
		);

		if (this.gameService.isInitialPlacementComplete(updatedGameState)) {
			updatedGameState = this.gameService.updateGamePhase(
				updatedGameState,
				"main"
			);
		}

		updatedGameState = this.gameService.moveToNextPlayer(updatedGameState);

		return await this.roomService.updateRoomWithGameState(
			room.id,
			updatedGameState
		);
	}

	async handleDiceRoll(roomId: string, playerId: string): Promise<GameState> {
		const room: Room | null = await this.roomService.getRoomById(roomId);
		if (!room || !room.data) {
			throw new Error("Room or game state not found");
		}

		this.gameService.validateGameStateIntegrity(room.data, room.prevData);

		let updatedGameState = this.gameService.rollDice(
			room.data as unknown as GameState,
			playerId
		);
		updatedGameState = this.gameService.updatePlayerAction(
			updatedGameState,
			playerId,
			"trade"
		);

		return await this.roomService.updateRoomWithGameState(
			room.id,
			updatedGameState
		);
	}

	// 他のゲームアクションハンドラーをここに追加...
}
