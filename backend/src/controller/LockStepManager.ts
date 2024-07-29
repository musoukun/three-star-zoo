import { Server, Socket } from "socket.io";
import { GameState, ActionState } from "../types/types";

export class LockStepManager {
	private io: Server;
	private gameStates: Map<string, GameState> = new Map();
	private clientReadyStates: Map<string, Set<string>> = new Map();

	constructor(io: Server) {
		this.io = io;
	}

	public setupLockStep(): void {
		this.io.on("connection", (socket) => {
			this.handleClientReady(socket);
		});
	}

	private handleClientReady(socket: Socket): void {
		socket.on("clientReady", (roomId: string, actionType: string) => {
			const clients = this.clientReadyStates.get(roomId) || new Set();
			clients.add(socket.id);
			this.clientReadyStates.set(roomId, clients);

			if (this.areAllClientsReady(roomId)) {
				this.proceedToNextStep(roomId, actionType);
			}
		});
	}

	private areAllClientsReady(roomId: string): boolean {
		const readyClients = this.clientReadyStates.get(roomId);
		const roomSize = this.io.sockets.adapter.rooms.get(roomId)?.size || 0;
		return readyClients?.size === roomSize;
	}

	private proceedToNextStep(roomId: string, actionType: string): void {
		const gameState = this.gameStates.get(roomId);
		if (!gameState) return;

		switch (actionType) {
			case "initAnimation":
				this.handleInitAnimationComplete(roomId, gameState);
				break;
			case "poopAnimation":
				this.handlePoopAnimationComplete(roomId, gameState);
				break;
			case "diceAnimation":
				this.handleDiceAnimationComplete(roomId, gameState);
				break;
		}

		this.clientReadyStates.delete(roomId);
	}

	private handleInitAnimationComplete(
		roomId: string,
		gameState: GameState
	): void {
		// const currentPlayer = gameState.players.find((p) => p.current);
		// if (currentPlayer) {
		// 	currentPlayer.action = ActionState.ROLL;
		// }
		this.io.to(roomId).emit("initAnimationComplete", {
			playerSynchronized: true,
		});
	}

	private handlePoopAnimationComplete(
		roomId: string,
		gameState: GameState
	): void {
		// const currentPlayer = gameState.players.find((p) => p.current);
		// if (currentPlayer) {
		// 	currentPlayer.action = ActionState.ROLL;
		// }
		this.io
			.to(roomId)
			.emit("poopAnimationComplete", { playerSynchronized: true });
	}

	private handleDiceAnimationComplete(
		roomId: string,
		gameState: GameState
	): void {
		// const currentPlayer = gameState.players.find((p) => p.current);
		// if (currentPlayer) {
		// 	currentPlayer.action = ActionState.INCOME;
		// }
		this.io
			.to(roomId)
			.emit("diceAnimationComplete", { playerSynchronized: true });
	}

	public setGameState(roomId: string, gameState: GameState): void {
		this.gameStates.set(roomId, gameState);
	}
}
