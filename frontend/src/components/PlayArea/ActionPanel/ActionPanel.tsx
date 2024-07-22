import React from "react";
import { Animal } from "../../../types/types";
import DiceRoll from "./DiceRoll";
import AnimalButton from "./AnimalButton";
import { ActionState } from "../../../types/ActionState";
import { useGameState } from "../../../hooks/useGameState";
import { useRecoilValue } from "recoil";
import { showDicePanelAtom } from "../../../atoms/atoms";

interface ActionPanelProps {
	selectedAnimal: string | null;
	handleCancel: () => void;
	handleAnimalSelect: (animal: string) => void;
	handleRollDice: (diceCount: number) => void;
	placedAnimals: { [key: string]: number };
}

const ActionPanel: React.FC<ActionPanelProps> = ({
	selectedAnimal,
	handleCancel,
	handleAnimalSelect,
	handleRollDice,
	placedAnimals,
}) => {
	const {
		myPlayerAction,
		phase,
		myPlayerDiceResult,
		myPlayerInventory,
		isCurrentTurn,
		rolling,
	} = useGameState();

	const showDicePanel = useRecoilValue(showDicePanelAtom);
	const action = myPlayerAction;
	const diceResult = myPlayerDiceResult;
	const inventory = myPlayerInventory;

	console.log(
		" phase " +
			phase +
			" isCurrentTurn " +
			isCurrentTurn +
			" action " +
			action
	);
	console.log("showDicePanel " + showDicePanel);

	return (
		<div className="w-1/3">
			<div className="h-full bg-pink-100 border-2 border-[#8b4513] rounded-lg p-4 flex flex-col">
				{phase === "init" &&
					isCurrentTurn &&
					action === ActionState.INIT && (
						<div className="flex-grow">
							{inventory.map((animal: Animal) => (
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
					action === ActionState.ROLL &&
					showDicePanel && (
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

export default ActionPanel;
