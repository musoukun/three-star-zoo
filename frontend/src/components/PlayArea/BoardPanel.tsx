import React, { useState, useEffect } from "react";
import { Animal, Board } from "../../types/types";
import ActionProgressBar from "../ActionProgressBar";
import LeftPanel from "./ActionPanel";
import CageArea from "./CageArea";
import { ActionState } from "../../types/ActionState";
import { useGameState } from "../../hooks/useGameState";

interface BoardPanelProps {
	onCageClick: (cageNumber: string, animal: Animal) => void;
	handleRollDice: (diceCount: number) => void;
}

const BoardPanel: React.FC<BoardPanelProps> = ({
	onCageClick,
	handleRollDice,
}) => {
	const board: Board = useGameState().getMyPlayerBoard();
	const isCurrentTurn: boolean = useGameState().isCurrentTurn();
	const phase = useGameState().getPhase();
	const action: ActionState = useGameState().getMyPlayerAction();
	const inventory = useGameState().getMyPlayerInventory();

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
