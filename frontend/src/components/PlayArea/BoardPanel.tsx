import React, { useState, useMemo } from "react";
import { Animal } from "../../types/types";
import ActionProgressBar from "../ActionProgressBar";
import CageArea from "./CageArea";
import { ActionState } from "../../types/ActionState";
import { useGameState } from "../../hooks/useGameState";
import ActionPanel from "./ActionPanel";

interface BoardPanelProps {
	onCageClick: (cageNumber: string, animal: Animal) => void;
	handleRollDice: (diceCount: number) => void;
}

const BoardPanel: React.FC<BoardPanelProps> = ({
	onCageClick,
	handleRollDice,
}) => {
	const {
		isCurrentTurn,
		phase,
		myPlayerBoard,
		myPlayerAction,
		myPlayerInventory,
	} = useGameState();

	const [selectedAnimal, setSelectedAnimal] = useState<string | null>(null);

	// 動物を配置した数をカウント
	const placedAnimals = useMemo(() => {
		const newPlacedAnimals: { [key: string]: number } = {};
		Object.values(myPlayerBoard).forEach((cage) => {
			cage.animals.forEach((animal) => {
				newPlacedAnimals[animal.id] =
					(newPlacedAnimals[animal.id] || 0) + 1;
			});
		});
		return newPlacedAnimals;
	}, [myPlayerBoard]);

	const handleAnimalSelect = (animal: string) => {
		setSelectedAnimal(animal);
	};

	const handleCancel = () => {
		setSelectedAnimal(null);
	};

	const handleCageClick = (cageNumber: string) => {
		if (
			isCurrentTurn &&
			selectedAnimal &&
			phase === "init" &&
			myPlayerAction === ActionState.INIT
		) {
			const animalObject = myPlayerInventory.find(
				(animal) => animal.id === selectedAnimal
			);
			if (animalObject) {
				onCageClick(cageNumber, animalObject);
				setSelectedAnimal(null);
			}
		}
	};

	// // デバッグ用
	// console.log("BoardPanel rendering", {
	// 	board: myPlayerBoard,
	// 	currentTurn: isCurrentTurn,
	// 	phase: phase,
	// 	action: myPlayerAction,
	// 	inventory: myPlayerInventory,
	// });

	return (
		<div className="flex flex-col h-full">
			<div
				className="flex flex-grow"
				style={{ height: `calc(100% - 60px)` }}
			>
				<ActionPanel
					placedAnimals={placedAnimals}
					selectedAnimal={selectedAnimal}
					handleAnimalSelect={handleAnimalSelect}
					handleCancel={handleCancel}
					handleRollDice={handleRollDice}
				/>
				<CageArea
					selectedAnimal={selectedAnimal}
					handleCageClick={handleCageClick}
				/>
			</div>
			<div className="h-[60px]">
				<ActionProgressBar />
			</div>
		</div>
	);
};

export default BoardPanel;
