/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect, useCallback, useState } from "react";
import { Socket } from "socket.io-client";
import {
	AnimalCard as AnimalCardType,
	EffectResults,
	ResultPoops,
} from "../types/types";
import { useGameState } from "../hooks/useGameState";
import { useSocketIO } from "../hooks/useSocketIO";
import OtherPlayersSection from "./OtherPlayer/OtherPlayersSection";

import GameInfo from "./GameInfo";
import AnimalCardsSection from "./AnimalShop/AnimalCardSection";

import { useRecoilState, useRecoilValue, useSetRecoilState } from "recoil";
import {
	choicesAtom,
	currentEffectIndexAtom,
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
import { ErrorBoundary } from "react-error-boundary";
import BoardPanel from "./PlayArea/BoardPanel";
import ActionPhaseNotifier from "./ActionPhaseNotifier";
import DiceAnimation from "./Dice/DiceAnimation";
import PoopResults from "./PoopResults";
import EffectResult from "./EffectResult";
import LoadingOverlay from "./LoadingOverlay";
import ChoiceModal from "./ChoiceModal";

interface GameBoardProps {
	socket: Socket;
	roomId: string;
	animalCards: AnimalCardType[];
}

const GameBoard: React.FC<GameBoardProps> = ({
	socket,
	roomId,
	animalCards,
}) => {
	// Recoilから管理されているゲーム状態とその更新関数を取得
	const {
		gameState,
		myPlayer,
		updateGameState,
		playerId,
		currentPlayer,
		setRolling,
		otherPlayers,
	} = useGameState();

	// ソケット通信に関する関数を取得
	const {
		setDiceResult,
		diceResult,
		emitCageClick,
		emitRollDice,
		listenForGameStateUpdate,
		notifyAnimationComplete,
		emitPlayerSelection,
		emitPoopAction,
		emitChoiceSelection,
	} = useSocketIO(socket, roomId, playerId);

	// ローカルの状態管理
	const [showPoopResults, setShowPoopResults] =
		useRecoilState<boolean>(showPoopResultsAtom);
	const [poopResults, setPoopResults] = useRecoilState<ResultPoops[] | null>(
		poopResultsAtom
	);

	const [showDiceResult, setShowDiceResult] =
		useRecoilState<boolean>(showDiceResultAtom);
	const setShowDicePanel = useSetRecoilState<boolean>(showDicePanelAtom);
	const showAction = useRecoilValue<{ flg: boolean; message: string }>(
		showActionAtom
	);
	const showPlayerSelection = useRecoilValue<boolean>(
		showPlayerSelectionAtom
	);

	const [showLoading, setShowLoading] =
		useRecoilState<boolean>(showLoadingAtom);
	const [loadingMessage, setLoadingMessage] =
		useRecoilState(loadingMessageAtom);

	const [showEffectResult, setShowEffectResult] = useRecoilState<boolean>(
		showEffectResultsAtom
	);
	const [currentEffectIndex, setCurrentEffectIndex] = useRecoilState<number>(
		currentEffectIndexAtom
	);

	const effectResults = useRecoilValue(effectResultsAtom);

	const [showChoiceModal, setShowChoiceModal] =
		useRecoilState(showChoiceModalAtom);
	const [choices, setChoices] = useRecoilState<string[]>(choicesAtom);

	// ゲーム状態の更新をリッスンするEffect
	useEffect(() => {
		// ゲーム状態の更新をリッスンし、更新があればupdateGameStateを呼び出す
		const unsubscribe = listenForGameStateUpdate(updateGameState);
		return unsubscribe; // コンポーネントのアンマウント時にリスナーを解除（socket.offをreturnしてる）
	}, [listenForGameStateUpdate]);

	// サイコロを振る処理
	const handleRollDice = useCallback(
		(diceCount: number) => {
			setRolling(true);
			setShowDicePanel(false);
			setShowDiceResult(true); // アニメーション開始時にtrueに設定

			emitRollDice(diceCount, (success: boolean) => {
				if (success) {
					console.log("Dice roll successful");
				} else {
					console.error("Dice roll failed");
				}
				setRolling(false);
			});
		},
		[emitRollDice, setRolling, setShowDicePanel, setShowDiceResult]
	);

	// クライアントごとのAnimationが完了したときの処理
	const handleClosePoopResults = useCallback(() => {
		setShowPoopResults(false);
		setPoopResults(null);
		notifyAnimationComplete("poopAnimation");
	}, [setShowPoopResults, setPoopResults, notifyAnimationComplete]);

	const handleDiceAnimationComplete = useCallback(() => {
		// console.log("Animation complete. Dice results:", resultsRef);
		// todo:この時点でRecoilのdiceResultがnullになっているのはなぜ？→useEffectの中でsetDiceResultを使っているため
		setShowDiceResult(false); // アニメーション完了時にfalseに設定
		notifyAnimationComplete("diceAnimation");
	}, [notifyAnimationComplete, setDiceResult]);

	// ゲーム状態がロードされていない場合のローディング表示
	if (!gameState || !gameState.players) {
		return <div>Loading...</div>;
	}

	const handlePlayerSelect = useCallback(
		(selectedPlayerId: string) => {
			if (!showPlayerSelection) return;
			emitPlayerSelection(selectedPlayerId);
			setShowLoading(true);
			setLoadingMessage("他のプレイヤーの選択を待っています...");
		},
		[
			showPlayerSelection,
			emitPlayerSelection,
			setShowLoading,
			setLoadingMessage,
		]
	);

	const handleEffectComplete = useCallback(() => {
		if (currentEffectIndex < (effectResults?.length ?? 0) - 1) {
			setCurrentEffectIndex((prev) => prev + 1);
		} else {
			setShowEffectResult(false);
			setCurrentEffectIndex(0);
			handleEffectResultsComplete();
		}
	}, [
		currentEffectIndex,
		effectResults,
		setCurrentEffectIndex,
		setShowEffectResult,
	]);

	const handleEffectResultsComplete = useCallback(() => {
		// 効果処理の結果表示が終わったときの処理をここに記述
		console.log("Effect results display completed");
		// 例: 次のフェーズに進む
		// moveToNextPhase();
	}, []);

	const handleChoiceSelect = useCallback(
		(selectedChoice: string) => {
			if (!showChoiceModal) return;
			emitChoiceSelection(selectedChoice);
		},
		[showChoiceModal, emitChoiceSelection]
	);

	console.log("diceResult@GameBoard", diceResult);

	return (
		<div className="flex h-screen bg-[#f0e6d2] font-crimson-text">
			<div className="flex flex-col w-5/6">
				<h2 className="text-xl font-bold p-2 bg-indigo-300">
					ゲームボード
				</h2>
				<div className="flex flex-1 overflow-hidden">
					<div className="w-3/5 p-2 overflow-y-auto">
						<OtherPlayersSection
							players={otherPlayers}
							currentPlayerId={gameState?.currentPlayer?.id}
							onPlayerSelect={
								showPlayerSelection
									? handlePlayerSelect
									: undefined
							}
							actionText={
								showPlayerSelection ? "選択" : undefined
							}
						/>
					</div>
					{showDiceResult && diceResult && (
						<DiceAnimation
							diceResults={diceResult}
							onAnimationComplete={handleDiceAnimationComplete}
							animationDuration={1.4} // z秒間のアニメーション
							rollingSpeed={2} // 1秒あたりx回転
						/>
					)}

					<div className="w-2/5 bg-gray-100 overflow-hidden">
						<AnimalCardsSection animalCards={animalCards} />
					</div>
				</div>

				<div className="bg-white shadow-lg">
					<ErrorBoundary fallback={<div>エラーが発生しました</div>}>
						{myPlayer && (
							<BoardPanel
								onCageClick={emitCageClick}
								handleRollDice={handleRollDice}
							/>
						)}
					</ErrorBoundary>
				</div>
			</div>
			<div className="w-1/6 p-2 bg-[#e8f1d3] overflow-y-auto">
				<GameInfo currentPlayer={currentPlayer} gameState={gameState} />
			</div>
			{showPoopResults && poopResults && (
				<PoopResults
					results={poopResults}
					duration={500}
					onClose={handleClosePoopResults}
					onAnimationComplete={() =>
						notifyAnimationComplete("poopAnimation")
					}
				/>
			)}
			{showLoading && <LoadingOverlay message={loadingMessage} />}
			{showChoiceModal && (
				<ChoiceModal choices={choices} onSelect={handleChoiceSelect} />
			)}
			{showEffectResult && effectResults && (
				<EffectResult
					result={effectResults[currentEffectIndex]}
					onComplete={handleEffectComplete}
					displayInterval={600} // 0.3秒ごとに表示
					nextPlayerDelay={2300} // 2秒後に次のプレイヤーの結果を表示
				/>
			)}
			{showAction.flg && (
				<ActionPhaseNotifier
					text={showAction.message}
					backgroundColor="rgba(128, 0, 128, 0.7)"
					textColor="#FFD700"
					isBold={true}
					isItalic={false}
					opacity={0.8}
					speed={0.5}
					fontSize="70px"
					fontFamily="Roboto"
					duration={1} // 何秒で消えるか
					onAnimationComplete={() =>
						notifyAnimationComplete("initAnimation")
					}
				/>
			)}
		</div>
	);
};

export default GameBoard;
