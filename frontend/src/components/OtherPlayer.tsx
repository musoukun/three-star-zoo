// src/components/OtherPlayer.tsx
import React from "react";
import { Cage, Player } from "../types/types";
import { getAnimalImage } from "../utils/importAnimalImages";

interface OtherPlayerProps {
	player: Player;
	isCurrentTurn: boolean;
}

const OtherPlayer: React.FC<OtherPlayerProps> = ({ player, isCurrentTurn }) => {
	const renderCage = (cageNumber: string, cage: Cage) => (
		<div
			key={cageNumber}
			className={`h-12 flex items-center justify-center border rounded relative
        ${cage.animals.length > 0 ? "bg-yellow-100" : "bg-gray-100"}
        ${cageNumber === "cage11-12" ? "col-span-2" : ""}`}
		>
			<span className="text-xs font-semibold">
				{cageNumber.replace("cage", "")}
			</span>
			<div className="absolute top-0 right-0 flex">
				{cage.animals.map((animal, index) => (
					<div
						key={index}
						className="w-6 h-6 rounded-full overflow-hidden ml-1"
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

	// player.board が undefined または null の場合のエラーハンドリング
	if (!player.board) {
		console.error("Player board is undefined or null", player);
		return (
			<div className="bg-white p-2 rounded shadow w-full">
				<h5 className="text-base font-bold">{player.name}</h5>
				<p>Error: Player board data is missing</p>
			</div>
		);
	}

	return (
		<div
			className={`bg-white p-2 rounded shadow w-full ${
				isCurrentTurn ? "border-2 border-blue-500" : ""
			}`}
		>
			<div className="flex justify-between items-center mb-2">
				<h5 className="text-base font-bold">{player.name}</h5>
				<div className="flex items-center">
					{isCurrentTurn && (
						<span className="bg-blue-500 text-white px-2 py-1 rounded mr-2">
							現在のターン
						</span>
					)}
					<span className="px-2 py-1 rounded bg-gray-200">
						ターン数: {player.turnCount}
					</span>
				</div>
			</div>
			<div className="grid grid-cols-6 gap-1 mb-2">
				{Object.entries(player.board).map(([cageNumber, cage]) =>
					renderCage(cageNumber, cage)
				)}
			</div>
			<div className="flex justify-between text-sm">
				<span>ウンチ: {player.poops || 0}</span>
				<span>お金: {player.money}</span>
				<span>バッジ: {player.star}</span>
			</div>
		</div>
	);
};

export default OtherPlayer;
