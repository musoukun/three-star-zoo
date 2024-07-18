import React, { useState, useEffect } from "react";
import { Animal, Board, Cage } from "../types/types";
import { ActionState } from "../types/ActionState";
import DiceRoll from "./DiceRoll";
import { Socket } from "socket.io-client";
import { getAnimalImage } from "../utils/importAnimalImages";

interface AreaBoardProps {
	board: Board;
	isCurrentTurn: boolean;
	onCageClick: (cageNumber: string, animal: Animal) => void;
	phase: string;
	action: ActionState;
	socket: Socket;
	roomId: string;
	playerId: string;
	diceResult: number | null;
	inventory: Animal[];
}

const AreaBoard: React.FC<AreaBoardProps> = ({
	board,
	isCurrentTurn,
	onCageClick,
	phase,
	action,
	socket,
	roomId,
	playerId,
	diceResult,
	inventory,
}) => {
	const [selectedAnimal, setSelectedAnimal] = useState<string | null>(null);
	const [placedAnimals, setPlacedAnimals] = useState<{
		[key: string]: number;
	}>({
		RessaPanda: 0,
		Penguin: 0,
	});

	useEffect(() => {
		const newPlacedAnimals: { [key: string]: number } = {};
		Object.values(board).forEach((cage) => {
			cage.animals.forEach((animal) => {
				newPlacedAnimals[animal.id] =
					(newPlacedAnimals[animal.id] || 0) + 1;
			});
		});
		setPlacedAnimals(newPlacedAnimals);
	}, [board]);

	const renderCage = (cageNumber: string, cage: Cage) => (
		<div
			key={cageNumber}
			className={`bg-white border-2 border-[#8b4513] h-20 rounded-lg flex items-center justify-center text-2xl font-bold ${
				cageNumber === "cage11-12" ? "col-span-2" : ""
			} cursor-pointer relative ${
				isCurrentTurn && selectedAnimal && phase === "init"
					? "hover:bg-blue-100"
					: ""
			}`}
			onClick={() => handleCageClick(cageNumber)}
		>
			{cageNumber.replace("cage", "")}
			<div className="absolute top-0 right-0 flex">
				{cage.animals.map((animal, index) => (
					<div
						key={`${cageNumber}-${animal}-${index}`}
						className="w-8 h-8 rounded-full overflow-hidden ml-1"
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
			const animalObject: Animal = {
				id: selectedAnimal,
			};
			onCageClick(cageNumber, animalObject);
			setSelectedAnimal(null);
		}
	};

	const renderLeftPanel = () => {
		if (phase === "init" && isCurrentTurn && action === ActionState.INIT) {
			return (
				<div className="w-1/3 pr-4">
					{inventory.map((animal) => (
						<button
							key={animal.id}
							className={`w-full mb-2 py-2 px-4 rounded ${
								selectedAnimal === animal.id
									? "bg-blue-500 text-white"
									: "bg-gray-200"
							}`}
							onClick={() => handleAnimalSelect(animal.id)}
							disabled={placedAnimals[animal.id] > 0}
						>
							{animal.name}
						</button>
					))}
					{selectedAnimal && (
						<button
							className="w-full py-2 px-4 bg-red-500 text-white rounded"
							onClick={handleCancel}
						>
							キャンセル
						</button>
					)}
				</div>
			);
		} else if (
			phase === "main" &&
			isCurrentTurn &&
			action === ActionState.ROLL
		) {
			return (
				<div className="w-1/3 pr-4">
					<DiceRoll
						socket={socket}
						roomId={roomId}
						playerId={playerId}
						onRollComplete={() => {}}
					/>
					{diceResult !== null && (
						<div className="mt-4 p-4 bg-yellow-100 rounded-lg">
							<h3 className="text-lg font-bold">ダイスの結果</h3>
							<p>結果: {diceResult}</p>
						</div>
					)}
				</div>
			);
		}
		return null;
	};

	return (
		<div className="flex">
			{renderLeftPanel()}
			<div
				className={`${
					renderLeftPanel() ? "w-2/3" : "w-full"
				} bg-[#e6f3d9] border-4 ${
					isCurrentTurn ? "border-blue-500" : "border-[#8b4513]"
				} p-4 rounded-lg`}
			>
				<div className="grid grid-cols-6 gap-2">
					{Object.entries(board).map(([cageNumber, cage]) =>
						renderCage(cageNumber, cage)
					)}
				</div>
				<div className="mt-4 flex justify-between items-center">
					<div className="text-xl font-bold">エリアボード</div>
					<div className="flex space-x-4">
						<div className="flex items-center">
							<span>
								{isCurrentTurn
									? phase === "init"
										? "動物を配置してください"
										: "あなたのターンです"
									: "他のプレイヤーのターンです"}
							</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default AreaBoard;
