import React from "react";
import CageCell from "./CageCell";
import { useGameState } from "../../hooks/useGameState";

interface CageAreaProps {
	selectedAnimal: string | null;
	handleCageClick: (cageNumber: string) => void;
}

const CageArea: React.FC<CageAreaProps> = ({
	selectedAnimal,
	handleCageClick,
}) => {
	const { isCurrentTurn, myPlayerBoard, phase } = useGameState();

	if (!myPlayerBoard || Object.keys(myPlayerBoard).length === 0) {
		return <div>ボードデータがありません</div>;
	}
	return (
		<div className="w-2/3">
			<div className="bg-[#e6f3d9] border-4 border-[#056df5] p-4 rounded-lg flex flex-col">
				<div className="flex-grow grid grid-cols-6 gap-2">
					{myPlayerBoard &&
						Object.entries(myPlayerBoard).map(
							([cageNumber, cage]) => (
								<CageCell
									key={cageNumber}
									cageNumber={cageNumber}
									cage={cage}
									isCurrentTurn={isCurrentTurn}
									selectedAnimal={selectedAnimal}
									phase={phase}
									handleCageClick={handleCageClick}
								/>
							)
						)}
				</div>
			</div>
		</div>
	);
};

export default CageArea;
