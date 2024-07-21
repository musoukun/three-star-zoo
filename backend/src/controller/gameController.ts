// GameController.ts
import { Prisma, PrismaClient, Room } from "@prisma/client";
import { GameService } from "../services/GameService";
import { RoomService } from "../services/RoomService";
import {
	GameState,
	Player,
	Animal,
	ActionState,
	ResultPoops,
} from "../types/types";
import { RoomRepository } from "../repository/RoomRepository";
import { EffectService } from "../services/EffectService";

const prisma = new PrismaClient();

export class GameController {
	constructor(
		private gameService: GameService = new GameService(prisma),
		private roomService: RoomService = new RoomService(prisma),
		private roomRepo: RoomRepository = new RoomRepository(prisma),
		private effectService: EffectService = new EffectService(prisma)
	) {}

	async handleStartGame(
		roomId: string,
		playerId: string,
		players: Player[],
		response: (success: boolean, gameState: GameState | null) => void
	): Promise<GameState> {
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

		// ownerにゲーム開始の通知を送る
		response(true, updatedGameState as unknown as GameState);

		// owner以外のプレイヤーにゲーム開始の通知を送る
		return updatedGameState;
	}

	async handleCageClick(
		roomId: string,
		playerId: string,
		cageNumber: string,
		animal: Animal
	): Promise<GameState> {
		// ゲームデータとルームデータをチェック
		const room = await this.gameService.isValidateGameState(roomId);
		// 動物を配置する
		console.log("配置する動物", animal);
		let updatedGameState = this.gameService.placeAnimal(
			room.gameState as Prisma.JsonObject,
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

	/**
	 * プレイヤーのpoopアクションを処理します。
	 * @param roomId
	 * @param playerId
	 * @returns 更新されたルームデータとpoopの結果
	 * @throws ゲームデータが不正な場合
	 */
	async handlePoopAction(
		roomId: string,
		playerId: string
	): Promise<GameState> {
		// ゲームデータとルームデータをチェック
		const room: Room = await this.gameService.isValidateGameState(roomId);

		const gameState = room.gameState as unknown as GameState;
		const currentPlayer = gameState.players.find(
			(p) => p.id === playerId && p.current
		);

		if (!currentPlayer) {
			throw new Error("Current player not found");
		}

		const totalPoops = this.gameService.calculateTotalPoops(
			currentPlayer.board
		);
		const newPlayerPoops = currentPlayer.poops + totalPoops;

		const poopsResult: ResultPoops[] =
			this.gameService.calculatePoopResults(currentPlayer.board);

		// newPlayerPoopsをGamestateに反映
		const updatePoops = {
			...gameState,
			players: gameState.players.map((p) =>
				p.id === playerId ? { ...p, poops: newPlayerPoops } : p
			),
		};

		// プレイヤーのアクションを更新
		const updateAction = this.gameService.updatePlayerAction(
			updatePoops,
			playerId,
			ActionState.ROLL
		);

		// ゲームの状態を更新
		const updateGamaStateData: GameState =
			await this.roomService.updateRoomWithGameState(
				room.id,
				updateAction
			);

		updateGamaStateData.poopsResult = poopsResult;

		return updateGamaStateData;
	}

	/**
	 * プレイヤーのサイコロを振るアクションを処理します。
	 * @param roomId
	 * @param playerId
	 * @param diceCount
	 * @returns
	 */
	async handleDiceRoll(
		roomId: string,
		playerId: string,
		diceCount: number
	): Promise<GameState> {
		// ゲームデータとルームデータをチェック
		const room = await this.gameService.isValidateGameState(roomId);

		const updatedGameStateAndDiceResult = this.gameService.rollDice(
			room.gameState as unknown as GameState,
			playerId,
			diceCount
		);

		let updatedGameState: GameState =
			updatedGameStateAndDiceResult.updatedGameState;

		const diceResult = updatedGameStateAndDiceResult.diceResult as number;

		updatedGameState = this.gameService.updatePlayerAction(
			updatedGameState,
			playerId,
			ActionState.INCOME
		);

		// ゲームの状態を更新
		const updateGamaStateData: GameState =
			await this.roomService.updateRoomWithGameState(
				room.id,
				updatedGameState
			);

		updateGamaStateData.diceResult = diceResult;

		return updateGamaStateData;
	}

	/**
	 * 動物の効果処理を行います。
	 * @param roomId
	 * @param playerId
	 * @param diceResult
	 * @returns
	 */
	async handleProcessEffects(
		roomId: string,
		playerId: string,
		diceResult: number
	): Promise<GameState> {
		const room = await this.gameService.isValidateGameState(roomId);
		let gameState = room.gameState as unknown as GameState;

		gameState = await this.effectService.processEffects(
			gameState,
			playerId,
			diceResult
		);

		return await this.roomService.updateRoomWithGameState(
			room.id,
			gameState
		);
	}
}
