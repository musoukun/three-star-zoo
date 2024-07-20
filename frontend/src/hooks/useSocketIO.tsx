import { useCallback } from "react";
import { Socket } from "socket.io-client";
import { GameState, Animal } from "../types/types";

export const useSocketIO = (
	socket: Socket,
	roomId: string,
	playerId: string
) => {
	const emitCageClick = useCallback(
		(cageNumber: string, animal: Animal) => {
			try {
				console.log("Emitting cageClick:", {
					cageNumber,
					animal,
					playerId,
					roomId,
				});
				socket.emit("cageClick", {
					roomId,
					cageNumber,
					animal,
					playerId,
				});
			} catch (e) {
				console.error(e);
			}
		},
		[socket, roomId, playerId]
	);

	const emitRollDice = useCallback(
		(diceCount: number, callback: (success: boolean) => void) => {
			socket.emit("rollDice", { roomId, playerId, diceCount }, callback);
		},
		[socket, roomId, playerId]
	);

	const emitPoopAction = useCallback(() => {
		try {
			console.log("Emitting poop action");
			socket.emit("poopAction", { roomId, playerId });
		} catch (e) {
			console.error(e);
		}
	}, [socket, roomId, playerId]);

	const listenForGameStateUpdate = useCallback(
		(callback: (newGameState: GameState) => void) => {
			socket.on("gameStateUpdate", callback);
			return () => {
				socket.off("gameStateUpdate", callback);
			};
		},
		[socket]
	);

	return {
		emitCageClick,
		emitRollDice,
		emitPoopAction,
		listenForGameStateUpdate,
	};
};
