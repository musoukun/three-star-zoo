import { useCallback } from "react";
import { Socket } from "socket.io-client";
import { GameState, Animal, Player, EmitGameState } from "../types/types";
import { ActionState } from "../types/ActionState";

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
		} finally {
			socket.off("poopAction");
		}
	}, [socket, roomId, playerId]);

	/**
	 *  ゲームの状態が更新されたときの処理
	 */
	const handleGameEvent = (updatedGameState: GameState) => {
		const players = updatedGameState?.players as Player[];
		const myplayerData: Player | undefined = players.find(
			(player) => player.id === playerId
		);

		if (
			updatedGameState.phase === "main" &&
			myplayerData?.action === ActionState.POOP &&
			myplayerData?.current
		) {
			console.log("caluculating poop result");
			// ここでPOOPの結果を計算するイベントを発火
			emitPoopAction();
		}
	};

	/**
	 *  他プレイヤーからコイン/スターを盗む
	 */
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const emitExecuteSteal = useCallback(
		(targetPlayerIds: string[], amount: number, type: "coin" | "star") => {
			socket.emit("executeSteal", {
				roomId,
				playerId,
				targetPlayerIds,
				amount,
				type,
			});
		},
		[socket, roomId, playerId]
	);

	const listenForGameStateUpdate = useCallback(
		(callback: (newGameState: GameState) => void) => {
			const handleGameStateUpdate = (emitGameState: EmitGameState) => {
				console.log("Received updatedGameState", emitGameState);
				callback(emitGameState.emitGameState);
				handleGameEvent(emitGameState.emitGameState);
			};

			socket.on("gameStateUpdate", handleGameStateUpdate);

			return () => {
				socket.off("gameStateUpdate", handleGameStateUpdate);
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
