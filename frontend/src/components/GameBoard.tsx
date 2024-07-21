/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect, useState, useCallback } from "react";
import { Socket } from "socket.io-client";
import { AnimalCard as AnimalCardType, ResultPoops } from "../types/types";
import { useGameState } from "../hooks/useGameState";
import { useSocketIO } from "../hooks/useSocketIO";
import OtherPlayersSection from "./OtherPlayer/OtherPlayersSection";
import PlayerAreaBoard from "./PlayArea/PlayerAreaBoard";
import GameInfo from "./GameInfo";
import ResultDisplay from "./ResultDisplay";
import AnimalCardsSection from "./AnimalShop/AnimalCardSection";
import DiceRollAnimation from "./DiceRollAnimation";

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
		updateGameState,
		playerId,
		currentPlayer,
		setRolling,
		otherPlayers,
	} = useGameState();

	// ソケット通信に関する関数を取得
	const { emitCageClick, emitRollDice, listenForGameStateUpdate } =
		useSocketIO(socket, roomId, playerId);

	// ローカルの状態管理
	const [showPoopResults, setShowPoopResults] = useState(false);
	const [poopResults, setPoopResults] = useState<ResultPoops[]>([]);
	const [diceResult, setDiceResult] = useState<number>(0);
	const [showDiceResult, setShowDiceResult] = useState<boolean>(false);

	// ゲーム状態の更新をリッスンするEffect
	useEffect(() => {
		// ゲーム状態の更新をリッスンし、更新があればupdateGameStateを呼び出す
		const unsubscribe = listenForGameStateUpdate(updateGameState);
		return unsubscribe; // コンポーネントのアンマウント時にリスナーを解除（socket.offをreturnしてる）
	}, [listenForGameStateUpdate]);

	// サイコロを振る処理
	const handleRollDice = useCallback(
		(diceCount: number) => {
			setRolling(true); // サイコロを振っている状態をセット
			emitRollDice(diceCount, (success: boolean) => {
				if (success) {
					console.log("Dice roll successful");
				} else {
					console.error("Dice roll failed");
				}
				setRolling(false); // サイコロを振り終わった状態をセット
			});
		},
		[emitRollDice, setRolling]
	);

	// ゲーム状態がロードされていない場合のローディング表示
	if (!gameState || !gameState.players) {
		return <div>Loading...</div>;
	}

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
						/>
					</div>
					<div className="w-2/5 bg-gray-100 overflow-hidden">
						<AnimalCardsSection animalCards={animalCards} />
					</div>
				</div>
				<div className="bg-white shadow-lg">
					<PlayerAreaBoard
						handleCageClick={emitCageClick}
						handleRollDice={handleRollDice}
					/>
				</div>
			</div>
			<div className="w-1/6 p-2 bg-[#e8f1d3] overflow-y-auto">
				<GameInfo currentPlayer={currentPlayer} gameState={gameState} />
			</div>
			{showDiceResult && <DiceRollAnimation result={diceResult} />}
			{showPoopResults && (
				<ResultDisplay
					results={poopResults}
					duration={5000}
					onClose={() => setShowPoopResults(false)}
				/>
			)}
		</div>
	);
};

export default GameBoard;
