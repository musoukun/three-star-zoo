import React from "react";
import { Animal } from "../../types/types";
import DiceRoll from "../DiceRoll";
import AnimalButton from "./AnimalButton";
import { ActionState } from "../../types/ActionState";

interface LeftPanelProps {
	phase: string;
	isCurrentTurn: boolean;
	action: ActionState;
	inventory: Animal[];
	placedAnimals: { [key: string]: number };
	selectedAnimal: string | null;
	handleAnimalSelect: (animal: string) => void;
	handleCancel: () => void;
	diceResult: number | null;
	rolling: boolean;
	handleRollDice: (diceCount: number) => void;
}

const LeftPanel: React.FC<LeftPanelProps> = ({
	phase,
	isCurrentTurn,
	action,
	inventory,
	placedAnimals,
	selectedAnimal,
	handleAnimalSelect,
	handleCancel,
	diceResult,
	rolling,
	handleRollDice,
}) => {
	return (
		<div className="w-1/3">
			<div className="h-full bg-pink-100 border-2 border-[#8b4513] rounded-lg p-4 flex flex-col">
				{phase === "init" &&
					isCurrentTurn &&
					action === ActionState.INIT && (
						<div className="flex-grow">
							{inventory.map((animal) => (
								<AnimalButton
									key={animal.id}
									animal={animal}
									selectedAnimal={selectedAnimal}
									placedAnimals={placedAnimals}
									handleAnimalSelect={handleAnimalSelect}
								/>
							))}
							{selectedAnimal && (
								<button
									className="w-full py-2 px-4 bg-red-500 text-white rounded mt-2"
									onClick={handleCancel}
								>
									キャンセル
								</button>
							)}
						</div>
					)}
				{phase === "main" &&
					isCurrentTurn &&
					action === ActionState.ROLL && (
						<div className="flex-grow flex flex-col justify-center">
							<DiceRoll
								handleRollDice={handleRollDice}
								rolling={rolling}
							/>
							{diceResult !== null && (
								<div className="mt-4 p-4 bg-yellow-100 rounded-lg">
									<h3 className="text-lg font-bold">
										ダイスの結果
									</h3>
									<p>結果: {diceResult}</p>
								</div>
							)}
						</div>
					)}
				<div className="flex-grow flex items-center justify-center">
					{isCurrentTurn ? (
						<p className="text-gray-600 font-semibold">
							あなたのターンです
						</p>
					) : (
						<p className="text-gray-500">
							他のプレイヤーのターンです
						</p>
					)}
				</div>
			</div>
		</div>
	);
};

export default LeftPanel;
