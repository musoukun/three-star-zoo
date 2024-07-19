// GameController.ts
import { PrismaClient, Room } from "@prisma/client";
import { GameService } from "../services/GameService";
import { RoomService } from "../services/RoomService";
import { GameState, Player, Animal, ActionState } from "../types/types";
import { count } from "console";

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
		console.log("プレイヤー一覧", players);

		// プレイヤーの一覧をセットする
		const initialGameState: GameState =
			this.gameService.initializeGameState(players, playerId); //第2引数で、最初のプレイヤーを指定

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
		if (!room || !room.gameState) {
			throw new Error("Room or game state not found");
		}

		// ゲームの状態が正しいかどうかを確認
		this.gameService.validateGameStateIntegrity(
			room.gameState as unknown as GameState,
			room.prevGameState as unknown as GameState
		);

		// 動物を配置する
		console.log("配置する動物", animal);
		let updatedGameState = this.gameService.placeAnimal(
			room.gameState as unknown as GameState,
			playerId,
			cageNumber,
			animal
		);

		// プレイヤー初期配置が終わっていたら、アクションを更新
		console.log("プレイヤーのアクションを更新", playerId);
		if (
			this.gameService.isInitialPlacement(
				updatedGameState.players.find(
					(player) => playerId === player.id
				) as Player
			)
		) {
			updatedGameState = this.gameService.updatePlayerAction(
				updatedGameState,
				playerId,
				ActionState.POOP
			);
		}

		// プレイヤー全員の初期配置が完了している場合、ゲームフェーズを更新
		if (this.gameService.isInitialPlacementComplete(updatedGameState)) {
			updatedGameState = this.gameService.updateGamePhase(
				updatedGameState,
				"main"
			);
		}

		// ゲームの状態を更新
		return await this.roomService.updateRoomWithGameState(
			room.id,
			updatedGameState
		);
	}

	async handleDiceRoll(roomId: string, playerId: string): Promise<GameState> {
		const room: Room | null = await this.roomService.getRoomById(roomId);
		if (!room || !room.gameState) {
			throw new Error("Room or game state not found");
		}

		this.gameService.validateGameStateIntegrity(
			room.gameState as unknown as GameState,
			room.prevGameState as unknown as GameState
		);

		let updatedGameState = this.gameService.rollDice(
			room.gameState as unknown as GameState,
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
