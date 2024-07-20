import React from "react";
import { Animal } from "../../types/types";
import BoardArea from "./BoardArea";
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
				<BoardArea
					onCageClick={handleCageClick}
					handleRollDice={handleRollDice}
				/>
			)}
		</div>
	);
};

export default PlayerAreaBoard;
