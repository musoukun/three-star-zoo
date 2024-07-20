import React from "react";
import { Animal } from "../../types/types";
import BoardPanel from "./BoardPanel";
import { useGameState } from "../../hooks/useGameState";

interface PlayerAreaBoardProps {
	handleCageClick: (cageNumber: string, animal: Animal) => void;
	handleRollDice: (diceCount: number) => void;
}

const PlayerAreaBoard: React.FC<PlayerAreaBoardProps> = ({
	handleCageClick,
	handleRollDice,
}) => {
	const myPlayerData = useGameState().getMyPlayer();

	return (
		<div className="">
			{myPlayerData && (
				<BoardPanel
					onCageClick={handleCageClick}
					handleRollDice={handleRollDice}
				/>
			)}
		</div>
	);
};

export default PlayerAreaBoard;
