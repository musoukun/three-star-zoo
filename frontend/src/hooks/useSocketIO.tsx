import { useCallback, useEffect } from "react";
import { Socket } from "socket.io-client";
import {
	GameState,
	Animal,
	Player,
	EmitGameState,
	ResultPoops,
	EffectResults,
} from "../types/types";
import { ActionState } from "../types/ActionState";
import {
	choicesAtom,
	currentEffectIndexAtom,
	diceResultAtom,
	effectResultsAtom,
	loadingMessageAtom,
	poopResultsAtom,
	showActionAtom,
	showChoiceModalAtom,
	showDicePanelAtom,
	showDiceResultAtom,
	showEffectResultsAtom,
	showLoadingAtom,
	showPlayerSelectionAtom,
	showPoopResultsAtom,
} from "../atoms/atoms";
import { useRecoilState, useSetRecoilState } from "recoil";

export const useSocketIO = (
	socket: Socket,
	roomId: string,
	playerId: string
) => {
	const setShowPoopResults = useSetRecoilState<boolean>(showPoopResultsAtom);
	const setShowDiceResult = useSetRecoilState<boolean>(showDiceResultAtom);
	const setPoopResults = useSetRecoilState<ResultPoops[] | null>(
		poopResultsAtom
	);
	const [diceResult, setDiceResult] = useRecoilState<number[] | null>(
		diceResultAtom
	);
	const setShowDicePanel = useSetRecoilState<boolean>(showDicePanelAtom);
	const setShowAction = useSetRecoilState<{ flg: boolean; message: string }>(
		showActionAtom
	);

	const setShowLoading = useSetRecoilState<boolean>(showLoadingAtom);
	const setLoadingMessage = useSetRecoilState<string>(loadingMessageAtom);
	const setShowPlayerSelection = useSetRecoilState<boolean>(
		showPlayerSelectionAtom
	);
	const setShowChoiceModal = useSetRecoilState<boolean>(showChoiceModalAtom);
	const setChoices = useSetRecoilState<string[]>(choicesAtom);
	const setEffectResults =
		useSetRecoilState<EffectResults>(effectResultsAtom);

	const setShowEffectResult = useSetRecoilState(showEffectResultsAtom);
	const setCurrentEffectIndex = useSetRecoilState(currentEffectIndexAtom);

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
	 * 効果処理を開始する
	 */
	const emitProcessEffects = useCallback(() => {
		//todo:ここのdiceResultはGameStateのモノを使うのか、それともRecoilのモノを使うのか
		// 統一するべきだし、正しく判断しないとRecoilの値はレンダリング時にnullになる可能性がある
		try {
			console.log("Emitting processEffects", {
				roomId,
				playerId,
			});
			socket.emit("processEffects", { roomId, playerId });
			setShowLoading(true);
			setLoadingMessage("効果処理中...");
		} catch (e) {
			console.error("Error in emitProcessEffects:", e);
		}
	}, [
		socket,
		roomId,
		playerId,
		diceResult,
		setShowLoading,
		setLoadingMessage,
	]);

	/**
	 *  ゲームの状態が更新されたときの処理
	 * todo:いずれは全てbackendからのemitでこの関数の中の処理を行うようにしたい
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
			setShowAction({ flg: true, message: "うんち発生" });
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
			console.log("show dice result" + updatedGameState.diceResult);
			setDiceResult(updatedGameState.diceResult as number[]);
			setShowDiceResult(true);
		}

		// 効果処理の結果を受け取ったら
		if (
			updatedGameState.phase === "main" &&
			currentPlayer?.action === ActionState.TRADE
		) {
			console.log("show effect result");
			setEffectResults(updatedGameState.effectResults as EffectResults);
			setCurrentEffectIndex(0);
			setShowEffectResult(true);
		}
	};

	useEffect(() => {
		socket.on("initAnimationComplete", ({ playerSynchronized }) => {
			if (playerSynchronized) {
				// ここでPOOPの結果を計算するイベントを発火
				// setShowAction({ flg: false, message: "" });
				emitPoopAction();
			}
		});

		socket.on("poopAnimationComplete", ({ playerSynchronized }) => {
			if (playerSynchronized) {
				setShowDicePanel(true);
			}
		});

		socket.on("diceAnimationComplete", ({ playerSynchronized }) => {
			if (playerSynchronized) {
				// ここで収入フェーズの処理を開始する
				setShowAction({ flg: true, message: "動物の効果発動" });
				// emit
				emitProcessEffects();
			}
		});

		return () => {
			socket.off("initAnimationComplete");
			socket.off("poopAnimationComplete");
			socket.off("diceAnimationComplete");
		};
	}, [socket]);

	const notifyAnimationComplete = useCallback(
		(actionType: string) => {
			console.log(`Notifying animation complete: ${actionType}`);
			socket.emit("clientReady", roomId, actionType);
		},
		[socket, roomId]
	);

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

	const emitPlayerSelection = useCallback(
		(selectedPlayerId: string) => {
			socket.emit("playerSelection", {
				roomId,
				playerId,
				selectedPlayerId,
			});
			setShowPlayerSelection(false);
			setShowLoading(true);
			setLoadingMessage("他のプレイヤーの選択を待っています...");
		},
		[
			socket,
			roomId,
			playerId,
			setShowPlayerSelection,
			setShowLoading,
			setLoadingMessage,
		]
	);

	const emitChoiceSelection = useCallback(
		(selectedChoice: string) => {
			socket.emit("choiceSelection", {
				roomId,
				playerId,
				selectedChoice,
			});
			setShowChoiceModal(false);
		},
		[socket, roomId, playerId, setShowChoiceModal]
	);

	useEffect(() => {
		socket.on("requestPlayerSelection", (targetPlayerIds: string[]) => {
			setShowPlayerSelection(true);
			setChoices(targetPlayerIds);
		});

		socket.on("requestChoiceSelection", (choices: string[]) => {
			setChoices(choices);
			setShowChoiceModal(true);
		});

		socket.on("effectProcessingComplete", (results: EffectResults) => {
			setEffectResults(results);
			setShowLoading(false);
			setShowEffectResult(true);
		});

		socket.on(
			"waitForPlayerSelection",
			({ playerId: selectingPlayerId }) => {
				if (playerId !== selectingPlayerId) {
					setShowLoading(true);
					setLoadingMessage(
						`プレイヤー ${selectingPlayerId} の選択を待っています...`
					);
				}
			}
		);

		socket.on("waitForPlayerChoice", ({ playerId: choosingPlayerId }) => {
			if (playerId !== choosingPlayerId) {
				setShowLoading(true);
				setLoadingMessage(
					`プレイヤー ${choosingPlayerId} の選択を待っています...`
				);
			}
		});

		socket.on("playerSelectionComplete", () => {
			setShowLoading(false);
		});

		socket.on("playerChoiceComplete", () => {
			setShowLoading(false);
		});

		return () => {
			socket.off("requestPlayerSelection");
			socket.off("requestChoiceSelection");
			socket.off("effectProcessingComplete");
			socket.off("waitForPlayerSelection");
			socket.off("waitForPlayerChoice");
			socket.off("playerSelectionComplete");
			socket.off("playerChoiceComplete");
		};
	}, [
		socket,
		playerId,
		setShowPlayerSelection,
		setChoices,
		setShowChoiceModal,
		setEffectResults,
		setShowLoading,
		setLoadingMessage,
		setShowEffectResult,
	]);

	return {
		emitCageClick,
		emitRollDice,
		emitPoopAction,
		listenForGameStateUpdate,
		notifyAnimationComplete,
		emitPlayerSelection,
		emitChoiceSelection,
		diceResult,
		setDiceResult,
	};
};
