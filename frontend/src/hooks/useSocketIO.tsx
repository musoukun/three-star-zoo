import { useCallback } from "react";
import { Socket } from "socket.io-client";
import {
	GameState,
	Animal,
	Player,
	EmitGameState,
	ResultPoops,
} from "../types/types";
import { ActionState } from "../types/ActionState";
import {
	diceResultAtom,
	poopResultsAtom,
	showPoopResultsAtom,
} from "../atoms/atoms";
import { useSetRecoilState } from "recoil";

export const useSocketIO = (
	socket: Socket,
	roomId: string,
	playerId: string
) => {
	const setShowPoopResults = useSetRecoilState<boolean>(showPoopResultsAtom);
	const setShowDiceResult = useSetRecoilState<boolean>(showPoopResultsAtom);
	const setPoopResults = useSetRecoilState<ResultPoops[] | null>(
		poopResultsAtom
	);
	const setDiceResult = useSetRecoilState<number[] | null>(diceResultAtom);

	/**
	 * ケージをクリックしたときの処理
	 */
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

	/**
	 * サイコロを振る
	 */
	const emitRollDice = useCallback(
		(diceCount: number, callback: (success: boolean) => void) => {
			try {
				socket.emit(
					"rollDice",
					{ roomId, playerId, diceCount },
					callback
				);
			} catch (e) {
				console.error(e);
			} finally {
				socket.off("rollDice");
			}
		},
		[socket, roomId, playerId]
	);

	/**
	 * うんちアクションを実行
	 */
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

	/**
	 *  ゲームの状態が更新されたときの処理
	 */
	const handleGameEvent = (updatedGameState: GameState) => {
		const players = updatedGameState?.players as Player[];
		const myplayerData: Player | undefined = players.find(
			(player) => player.id === playerId
		);
		const currentPlayer = players.find((player) => player.current);

		// Poopアクションの結果を計算
		if (
			updatedGameState.phase === "main" &&
			myplayerData?.action === ActionState.POOP &&
			myplayerData?.current
		) {
			console.log("caluculating poop result");
			// ここでPOOPの結果を計算するイベントを発火
			emitPoopAction();
		}

		// Poopアクションの結果を受け取ったらshowPoopResultsを実行
		if (
			updatedGameState.phase === "main" &&
			currentPlayer?.action === ActionState.ROLL
		) {
			console.log("show poop result");
			// ここでPOOPの結果を計算するイベントを発火
			setPoopResults(updatedGameState.poopsResult as ResultPoops[]);
			setShowPoopResults(true);
			// アニメーション開始時にサーバーに通知
			socket.emit("clientReady", roomId, "poopAnimation");
		}

		// サイコロの結果を受け取ったら
		if (
			updatedGameState.phase === "main" &&
			currentPlayer?.action === ActionState.INCOME
		) {
			console.log("show dice result");
			// ここでPOOPの結果を計算するイベントを発火
			setDiceResult(updatedGameState.diceResult as number[]);
			setShowDiceResult(true);
			// アニメーション開始時にサーバーに通知
			socket.emit("clientReady", roomId, "diceAnimation");
		}

		return {
			notifyAnimationComplete,
		};
	};

	const notifyAnimationComplete = (actionType: string) => {
		socket.emit("clientReady", roomId, actionType);
	};

	const listenForGameStateUpdate = useCallback(
		(callback: (newGameState: GameState) => void) => {
			const handleGameStateUpdate = (emitGameState: EmitGameState) => {
				console.log("Received updatedGameState", emitGameState);
				callback(emitGameState.emitGameState);
				// ゲームの状態が更新されたときの処理
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
		notifyAnimationComplete,
	};
};
