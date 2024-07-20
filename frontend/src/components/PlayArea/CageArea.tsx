import React from "react";
import { Board } from "../../types/types";
import CageCell from "./CageCell";

interface CageAreaProps {
	board: Board;
	isCurrentTurn: boolean;
	selectedAnimal: string | null;
	phase: string;
	handleCageClick: (cageNumber: string) => void;
}

const CageArea: React.FC<CageAreaProps> = ({
	board,
	isCurrentTurn,
	selectedAnimal,
	phase,
	handleCageClick,
}) => (
	<div className="w-2/3">
		<div className="bg-[#e6f3d9] border-4 border-[#056df5] p-4 rounded-lg flex flex-col">
			<div className="flex-grow grid grid-cols-6 gap-2">
				{Object.entries(board).map(([cageNumber, cage]) => (
					<CageCell
						key={cageNumber}
						cageNumber={cageNumber}
						cage={cage}
						isCurrentTurn={isCurrentTurn}
						selectedAnimal={selectedAnimal}
						phase={phase}
						handleCageClick={handleCageClick}
					/>
				))}
			</div>
		</div>
	</div>
);

export default CageArea;
