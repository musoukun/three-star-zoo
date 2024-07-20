import React from "react";
import { Animal } from "../../types/types";
import BoardPanel from "./BoardPanel";
import { useGameState } from "../../hooks/useGameState";
import { ErrorBoundary } from "react-error-boundary";

interface PlayerAreaBoardProps {
	handleCageClick: (cageNumber: string, animal: Animal) => void;
	handleRollDice: (diceCount: number) => void;
}

const PlayerAreaBoard: React.FC<PlayerAreaBoardProps> = ({
	handleCageClick,
	handleRollDice,
}) => {
	const { myPlayer } = useGameState();

	return (
		<div className="">
			<ErrorBoundary fallback={<div>エラーが発生しました</div>}>
				{myPlayer && (
					<BoardPanel
						onCageClick={handleCageClick}
						handleRollDice={handleRollDice}
					/>
				)}
			</ErrorBoundary>
		</div>
	);
};

export default PlayerAreaBoard;
