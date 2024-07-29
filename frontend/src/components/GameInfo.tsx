import React from "react";
import { Player, GameState } from "../types/types";
// import TestPanel from "./TestPanel";
// import { Socket } from "socket.io-client";

interface GameInfoProps {
	currentPlayer: Player | null | undefined;
	gameState: GameState;
}

const GameInfo: React.FC<GameInfoProps> = ({ currentPlayer, gameState }) => {
	const sumDiceResult = (diceResult: number[] | undefined): number => {
		if (!diceResult) return 0;
		console.log("diceResult @ sum", diceResult);
		return diceResult.reduce((acc, cur) => acc + cur, 0);
	};
	console.log("currentPlayer @ GameInfo", currentPlayer);
	return (
		<div>
			<h3 className="text-sm font-bold mb-1">
				現在のプレイヤー: {currentPlayer?.name}
			</h3>
			<p className="text-xs mb-1">ターンの状態: {gameState?.phase}</p>
			<p className="text-xs mb-1">ラウンド: {gameState?.roundNumber}</p>
			<p className="text-xs mb-1">うんち: {currentPlayer?.poops || 0}</p>
			{currentPlayer?.diceResult !== undefined && (
				<p className="text-xs">
					ダイスの結果: {sumDiceResult(currentPlayer.diceResult)}
				</p>
			)}
			{/* <TestPanel socket={socket} roomId={roomId} /> */}
		</div>
	);
};
export default GameInfo;
