/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect } from "react";
import { Animal, Board, Cage } from "../types/types";
import { ActionState } from "../types/ActionState";
import DiceRoll from "./DiceRoll";
import { Socket } from "socket.io-client";
import { getAnimalImage } from "../utils/importAnimalImages";
import ActionProgressBar from "./ActionProgressBar";

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
	rolling: boolean;
	handleRollDice: (diceCount: number) => void;
}

/**
 * エリアボードコンポーネント
 * プレイヤーの個人ボードを表示し、動物の配置やサイコロの操作を行います
 */
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
	rolling,
}) => {
	const [selectedAnimal, setSelectedAnimal] = useState<string | null>(null);
	const [placedAnimals, setPlacedAnimals] = useState<{
		[key: string]: number;
	}>({
		RessaPanda: 0,
		Penguin: 0,
	});

	useEffect(() => {
		updatePlacedAnimals();
	}, [board]);

	/**
	 * 配置された動物の数を更新する
	 */
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

	/**
	 * 動物を選択する
	 */
	const handleAnimalSelect = (animal: string) => {
		setSelectedAnimal(animal);
	};

	/**
	 * 選択をキャンセルする
	 */
	const handleCancel = () => {
		setSelectedAnimal(null);
	};

	/**
	 * ケージクリックを処理する
	 */
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
					socket={socket}
					roomId={roomId}
					playerId={playerId}
					diceResult={diceResult}
					rollring={rolling}
				/>
				<BoardArea
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

/**
 * 左パネルコンポーネント
 * 動物の選択やサイコロ操作のUIを表示します
 */
const LeftPanel: React.FC<{
	phase: string;
	isCurrentTurn: boolean;
	action: ActionState;
	inventory: Animal[];
	placedAnimals: { [key: string]: number };
	selectedAnimal: string | null;
	handleAnimalSelect: (animal: string) => void;
	handleCancel: () => void;
	socket: Socket;
	roomId: string;
	playerId: string;
	diceResult: number | null;
	rolling: boolean;
}> = ({
	phase,
	isCurrentTurn,
	action,
	inventory,
	placedAnimals,
	selectedAnimal,
	handleAnimalSelect,
	handleCancel,
	socket,
	roomId,
	playerId,
	diceResult,
	rolling,
}) => {
	return (
		<div className="w-1/3 ">
			<div
				className={`h-full bg-pink-100 border-2 border-[#8b4513] rounded-lg  p-4 flex flex-col`}
			>
				{phase === "init" &&
					isCurrentTurn &&
					action === ActionState.INIT && (
						<div className="flex-grow ">
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
								<DiceResult result={diceResult} />
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

/**
 * 動物選択ボタンコンポーネント
 */
const AnimalButton: React.FC<{
	animal: Animal;
	selectedAnimal: string | null;
	placedAnimals: { [key: string]: number };
	handleAnimalSelect: (animal: string) => void;
}> = ({ animal, selectedAnimal, placedAnimals, handleAnimalSelect }) => (
	<button
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
);

/**
 * サイコロの結果表示コンポーネント
 */
const DiceResult: React.FC<{ result: number }> = ({ result }) => (
	<div className="mt-4 p-4 bg-yellow-100 rounded-lg">
		<h3 className="text-lg font-bold">ダイスの結果</h3>
		<p>結果: {result}</p>
	</div>
);

/**
 * ボードエリアコンポーネント
 * ケージの配置を表示します
 */
const BoardArea: React.FC<{
	board: Board;
	isCurrentTurn: boolean;
	selectedAnimal: string | null;
	phase: string;
	handleCageClick: (cageNumber: string) => void;
}> = ({ board, isCurrentTurn, selectedAnimal, phase, handleCageClick }) => (
	<div className={`w-2/3`}>
		<div
			className={`bg-[#e6f3d9] border-4 border-[#056df5] p-4 rounded-lg flex flex-col`}
		>
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
			{/* <BoardFooter isCurrentTurn={isCurrentTurn} phase={phase} /> */}
		</div>
	</div>
);

/**
 * ケージセルコンポーネント
 * 個々のケージを表示します
 */
const CageCell: React.FC<{
	cageNumber: string;
	cage: Cage;
	isCurrentTurn: boolean;
	selectedAnimal: string | null;
	phase: string;
	handleCageClick: (cageNumber: string) => void;
}> = ({
	cageNumber,
	cage,
	isCurrentTurn,
	selectedAnimal,
	phase,
	handleCageClick,
}) => {
	const animalPositions = [
		"top-0 left-0", // 左上
		"top-0 right-0", // 右上
		"bottom-0 left-0", // 左下
		"bottom-0 right-0", // 右下
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
// const BoardFooter: React.FC<{
// 	isCurrentTurn: boolean;
// 	phase: string;
// }> = ({ isCurrentTurn, phase }) => (
// 	<div className="mt-4 flex justify-between items-center">
// 		<div className="text-xl font-bold">エリアボード</div>
// 		<div className="flex space-x-4">
// 			<div className="flex items-center">
// 				<span>
// 					{!isCurrentTurn
// 						? phase === "init"
// 							? "動物を配置してください"
// 							: "あなたのターンです"
// 						: "他のプレイヤーのターンです"}
// 				</span>
// 			</div>
// 		</div>
// 	</div>
// );

export default AreaBoard;
