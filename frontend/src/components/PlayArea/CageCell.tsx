import React from "react";
import { Cage } from "../../types/types";
import { getAnimalImage } from "../../utils/importAnimalImages";

interface CageCellProps {
	cageNumber: string;
	cage: Cage;
	isCurrentTurn: boolean;
	selectedAnimal: string | null;
	phase: string;
	handleCageClick: (cageNumber: string) => void;
}

const CageCell: React.FC<CageCellProps> = ({
	cageNumber,
	cage,
	isCurrentTurn,
	selectedAnimal,
	phase,
	handleCageClick,
}) => {
	const animalPositions = [
		"top-0 left-0",
		"top-0 right-0",
		"bottom-0 left-0",
		"bottom-0 right-0",
	];

	return (
		<div
			className={`bg-white border-2 border-[#8b4513] h-28 text-gray-300 rounded-lg flex items-center justify-center text-2xl font-bold ${
				cageNumber === "cage11-12" ? "col-span-2" : ""
			} cursor-pointer relative ${
				isCurrentTurn && selectedAnimal && phase === "init"
					? "hover:bg-blue-100"
					: ""
			}`}
			onClick={() => handleCageClick(cageNumber)}
		>
			{cageNumber.replace("cage", "")}
			<div className="absolute inset-0">
				{cage.animals.slice(0, 4).map((animal, index) => (
					<div
						key={`${cageNumber}-${animal.id}-${index}`}
						className={`absolute ${animalPositions[index]} w-12 h-12 rounded-full overflow-hidden`}
					>
						<img
							src={getAnimalImage(animal.id)}
							alt={animal.id}
							className="w-full h-full object-cover"
						/>
					</div>
				))}
			</div>
		</div>
	);
};

export default CageCell;
