import React from "react";
import { Player, GameState } from "../types/types";

interface GameInfoProps {
	currentPlayer: Player | null | undefined;
	gameState: GameState;
}

const GameInfo: React.FC<GameInfoProps> = ({ currentPlayer, gameState }) => (
	<div>
		<h3 className="text-sm font-bold mb-1">
			現在のプレイヤー: {currentPlayer?.name}
		</h3>
		<p className="text-xs mb-1">ターンの状態: {gameState?.phase}</p>
		<p className="text-xs mb-1">ラウンド: {gameState?.roundNumber}</p>
		<p className="text-xs mb-1">うんち: {currentPlayer?.poops || 0}</p>
		{currentPlayer?.diceResult !== undefined && (
			<p className="text-xs">ダイスの結果: {currentPlayer.diceResult}</p>
		)}
	</div>
);

export default GameInfo;
