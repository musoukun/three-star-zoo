import React, { useState, useEffect } from "react";
import { Animal, Board } from "../../types/types";
import ActionProgressBar from "../ActionProgressBar";
import LeftPanel from "./LeftPanel";
import CageArea from "./CageArea";
import { ActionState } from "../../types/ActionState";

interface BoardAreaProps {
	board: Board;
	isCurrentTurn: boolean;
	onCageClick: (cageNumber: string, animal: Animal) => void;
	phase: string;
	action: ActionState;
	diceResult: number | null;
	inventory: Animal[];
	rolling: boolean;
	handleRollDice: (diceCount: number) => void;
}

const BoardArea: React.FC<BoardAreaProps> = ({
	board,
	isCurrentTurn,
	onCageClick,
	phase,
	action,
	diceResult,
	inventory,
	rolling,
	handleRollDice,
}) => {
	const [selectedAnimal, setSelectedAnimal] = useState<string | null>(null);
	const [placedAnimals, setPlacedAnimals] = useState<{
		[key: string]: number;
	}>({});

	useEffect(() => {
		updatePlacedAnimals();
	}, [board]);

	const updatePlacedAnimals = () => {
		const newPlacedAnimals: { [key: string]: number } = {};
		Object.values(board).forEach((cage) => {
			cage.animals.forEach((animal) => {
				newPlacedAnimals[animal.id] =
					(newPlacedAnimals[animal.id] || 0) + 1;
			});
		});
		setPlacedAnimals(newPlacedAnimals);
	};

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
			action === ActionState.INIT
		) {
			const animalObject = inventory.find(
				(animal) => animal.id === selectedAnimal
			);
			if (animalObject) {
				onCageClick(cageNumber, animalObject);
				setSelectedAnimal(null);
			}
		}
	};

	return (
		<div className="flex flex-col h-full">
			<div
				className="flex flex-grow"
				style={{ height: `calc(100% - 60px)` }}
			>
				<LeftPanel
					phase={phase}
					isCurrentTurn={isCurrentTurn}
					action={action}
					inventory={inventory}
					placedAnimals={placedAnimals}
					selectedAnimal={selectedAnimal}
					handleAnimalSelect={handleAnimalSelect}
					handleCancel={handleCancel}
					diceResult={diceResult}
					rolling={rolling}
					handleRollDice={handleRollDice}
				/>
				<CageArea
					board={board}
					isCurrentTurn={isCurrentTurn}
					selectedAnimal={selectedAnimal}
					phase={phase}
					handleCageClick={handleCageClick}
				/>
			</div>
			<div className="h-[60px]">
				<ActionProgressBar currentAction={action} />
			</div>
		</div>
	);
};

export default BoardArea;
