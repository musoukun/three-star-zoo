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
import AnimalCardsSection from "./AnimalCardSection";
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
	const {
		gameState,
		updateGameState,
		playerId,
		myPlayer,
		getCurrentPlayer,
		setRolling,
	} = useGameState();
	const {
		emitCageClick,
		emitRollDice,
		emitPoopAction,
		listenForGameStateUpdate,
	} = useSocketIO(socket, roomId, playerId);

	const [showPoopResults, setShowPoopResults] = useState(false);
	const [poopResults, setPoopResults] = useState<ResultPoops[]>([]);
	const [diceResult, setDiceResult] = useState<number>(0);
	const [showDiceResult, setShowDiceResult] = useState<boolean>(false);

	useEffect(() => {
		const unsubscribe = listenForGameStateUpdate(updateGameState);
		return unsubscribe;
	}, [listenForGameStateUpdate, updateGameState]);

	useEffect(() => {
		if (gameState.poopsResult) {
			setPoopResults(gameState.poopsResult);
		}
	}, [gameState.poopsResult]);

	useEffect(() => {
		if (poopResults.length > 0) {
			setShowPoopResults(true);
		}
	}, [poopResults]);

	const handleRollDice = useCallback(
		(diceCount: number) => {
			setRolling(true);
			emitRollDice(diceCount, (success: boolean) => {
				if (success) {
					console.log("Dice roll successful");
				} else {
					console.error("Dice roll failed");
				}
				setRolling(false);
			});
		},
		[emitRollDice, setRolling]
	);

	useEffect(() => {
		if (
			gameState.phase === "main" &&
			myPlayer?.action === "POOP" &&
			myPlayer.current
		) {
			emitPoopAction();
		}
	}, [gameState.phase, myPlayer, emitPoopAction]);

	if (!gameState || !gameState.players) {
		return <div>Loading...</div>;
	}

	const currentPlayer = getCurrentPlayer(gameState.players);
	const otherPlayers = gameState.players.filter(
		(player) => player.id !== playerId
	);

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
