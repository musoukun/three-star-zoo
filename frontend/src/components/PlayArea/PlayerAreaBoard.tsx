import React from "react";
import { Player, GameState, Animal, Board } from "../../types/types";
import AreaBoard from "./BoardArea";
import { ActionState } from "../../types/ActionState";

interface PlayerAreaBoardProps {
	myPlayerData: Player | undefined;
	isCurrentTurn: boolean;
	handleCageClick: (cageNumber: string, animal: Animal) => void;
	gameState: GameState;
	rolling: boolean;
	handleRollDice: (diceCount: number) => void;
}

const PlayerAreaBoard: React.FC<PlayerAreaBoardProps> = ({
	myPlayerData,
	isCurrentTurn,
	handleCageClick,
	gameState,
	rolling,
	handleRollDice,
}) => (
	<div className="">
		{myPlayerData && (
			<AreaBoard
				board={myPlayerData.board as Board}
				isCurrentTurn={isCurrentTurn}
				onCageClick={handleCageClick}
				phase={gameState.phase}
				action={myPlayerData.action as ActionState}
				diceResult={myPlayerData.diceResult || null}
				inventory={myPlayerData.inventory as Animal[]}
				rolling={rolling}
				handleRollDice={handleRollDice}
			/>
		)}
	</div>
);

export default PlayerAreaBoard;
