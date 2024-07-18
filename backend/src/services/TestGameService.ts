import { PrismaClient } from "@prisma/client";
import { Player, GameState, Animal, Room } from "../types/types";
import { ActionState } from "../types/ActionState";
import { initialBoard } from "../utils/initialBoard";
import { RessaPanda } from "../types/Animal/RessaPanda";
import { Penguin } from "../types/Animal/Penguin";
import { v4 as uuidv4 } from "uuid";
import { io } from "../server";

export class TestGameService {
	private prisma: PrismaClient;

	constructor(prisma: PrismaClient) {
		this.prisma = prisma;
	}

	async startTestGame(roomId: string, playerId: string): Promise<GameState> {
		const room = await this.prisma.room.findUnique({
			where: { id: roomId },
		});
		if (!room) throw new Error("Room not found");

		const initialGameState: GameState = {
			players: [],
			phase: "waiting",
			roundNumber: 1,
			isTestMode: true,
		};

		room.data = JSON.stringify(initialGameState);
		await this.prisma.room.update({
			where: { id: roomId },
			data: { data: room.data },
		});

		io.to(roomId).emit("gameStateUpdate", initialGameState);
		return initialGameState;
	}

	async addTestPlayer(
		roomId: string,
		playerName: string
	): Promise<GameState> {
		const room = await this.prisma.room.findUnique({
			where: { id: roomId },
		});
		if (!room) throw new Error("Room not found");
		if (!room.data) throw new Error("Room data not found");

		const gameState: GameState = room.data as unknown as GameState;
		if (gameState.phase !== "waiting" || gameState.players.length >= 3) {
			throw new Error("Cannot add player at this time");
		}

		const newPlayer: Player = {
			id: uuidv4(),
			name: playerName,
			action: ActionState.INIT,
			turnCount: 0,
			poops: 0,
			money: 4,
			star: 0,
			inventory: [RessaPanda, Penguin],
			board: JSON.parse(JSON.stringify(initialBoard)),
			current: gameState.players.length === 0,
			turnOrder: gameState.players.length,
			startPlayer: gameState.players.length === 0,
		};

		gameState.players.push(newPlayer);
		room.data = JSON.stringify(gameState);
		await this.prisma.room.update({
			where: { id: roomId },
			data: { data: room.data },
		});

		io.to(roomId).emit("gameStateUpdate", gameState);
		return gameState;
	}

	async setCurrentPlayer(
		roomId: string,
		playerId: string
	): Promise<GameState> {
		const room = await this.prisma.room.findUnique({
			where: { id: roomId },
		});
		if (!room) throw new Error("Room not found");

		const gameState: GameState = room.data as unknown as GameState;
		gameState.players = gameState.players.map((player) => ({
			...player,
			current: player.id === playerId,
		}));

		room.data = JSON.stringify(gameState);
		await this.prisma.room.update({
			where: { id: roomId },
			data: { data: room.data },
		});

		io.to(roomId).emit("gameStateUpdate", gameState);
		return gameState;
	}

	async addCoins(roomId: string, amount: number): Promise<GameState> {
		const room = await this.prisma.room.findUnique({
			where: { id: roomId },
		});
		if (!room) throw new Error("Room not found");

		const gameState: GameState = room.data as unknown as GameState;
		const currentPlayer = gameState.players.find(
			(player) => player.current
		);
		if (currentPlayer) {
			currentPlayer.money += amount;
		}

		room.data = JSON.stringify(gameState);
		await this.prisma.room.update({
			where: { id: roomId },
			data: { data: room.data },
		});

		io.to(roomId).emit("gameStateUpdate", gameState);
		return gameState;
	}

	async placeAnimal(
		roomId: string,
		cageNumber: string,
		animalId: string
	): Promise<GameState> {
		const room = await this.prisma.room.findUnique({
			where: { id: roomId },
		});
		if (!room) throw new Error("Room not found");

		const gameState: GameState = room.data as unknown as GameState;
		const currentPlayer = gameState.players.find(
			(player) => player.current
		);
		if (currentPlayer && currentPlayer.board) {
			const animal = { id: animalId };
			if (!currentPlayer.board[cageNumber]) {
				currentPlayer.board[cageNumber] = { animals: [], max: 2 };
			}
			currentPlayer.board[cageNumber].animals.push(animal);
		}

		room.data = JSON.stringify(gameState);
		await this.prisma.room.update({
			where: { id: roomId },
			data: { data: room.data },
		});

		io.to(roomId).emit("gameStateUpdate", gameState);
		return gameState;
	}

	async changePhase(roomId: string, phase: string): Promise<GameState> {
		const room = await this.prisma.room.findUnique({
			where: { id: roomId },
		});
		if (!room) throw new Error("Room not found");

		const gameState: GameState = room.data as unknown as GameState;
		gameState.phase = phase as any;

		room.data = JSON.stringify(gameState);
		await this.prisma.room.update({
			where: { id: roomId },
			data: { data: room.data },
		});

		io.to(roomId).emit("gameStateUpdate", gameState);
		return gameState;
	}

	async rollDice(roomId: string): Promise<GameState> {
		const room = await this.prisma.room.findUnique({
			where: { id: roomId },
		});
		if (!room) throw new Error("Room not found");

		const gameState: GameState = room.data as unknown as GameState;
		const currentPlayer = gameState.players.find(
			(player) => player.current
		);
		if (currentPlayer) {
			currentPlayer.diceResult = Math.floor(Math.random() * 6) + 1;
			currentPlayer.action = ActionState.TRADE;
		}

		room.data = JSON.stringify(gameState);
		await this.prisma.room.update({
			where: { id: roomId },
			data: { data: room.data },
		});

		io.to(roomId).emit("gameStateUpdate", gameState);
		return gameState;
	}

	async poopAction(roomId: string): Promise<GameState> {
		const room = await this.prisma.room.findUnique({
			where: { id: roomId },
		});
		if (!room) throw new Error("Room not found");

		const gameState: GameState = room.data as unknown as GameState;
		const currentPlayer = gameState.players.find(
			(player) => player.current
		);
		if (currentPlayer) {
			currentPlayer.poops += 1;
		}

		room.data = JSON.stringify(gameState);
		await this.prisma.room.update({
			where: { id: roomId },
			data: { data: room.data },
		});

		io.to(roomId).emit("gameStateUpdate", gameState);
		return gameState;
	}

	async incomeAction(roomId: string): Promise<GameState> {
		// 効果処理を行う（仮実装）
		return this.getGameState(roomId);
	}

	async tradeAction(roomId: string): Promise<GameState> {
		// 動物を買う/星を買う処理（仮実装）
		return this.getGameState(roomId);
	}

	async flushAction(roomId: string): Promise<GameState> {
		const room = await this.prisma.room.findUnique({
			where: { id: roomId },
		});
		if (!room) throw new Error("Room not found");

		const gameState: GameState = room.data as unknown as GameState;
		const currentPlayer = gameState.players.find(
			(player) => player.current
		);
		if (currentPlayer) {
			currentPlayer.poops = 0;
		}

		room.data = JSON.stringify(gameState);
		await this.prisma.room.update({
			where: { id: roomId },
			data: { data: room.data },
		});

		io.to(roomId).emit("gameStateUpdate", gameState);
		return gameState;
	}

	async checkVictoryCondition(roomId: string): Promise<GameState> {
		// 勝利条件をチェックする処理（仮実装）
		return this.getGameState(roomId);
	}

	private async getGameState(roomId: string): Promise<GameState> {
		const room = await this.prisma.room.findUnique({
			where: { id: roomId },
		});
		if (!room) throw new Error("Room not found");
		return room.data as unknown as GameState;
	}
}
