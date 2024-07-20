import React, { useState } from "react";

interface DiceRollProps {
	handleRollDice: (diceCount: number) => void;
	rolling: boolean;
}

const DiceRoll: React.FC<DiceRollProps> = ({ handleRollDice, rolling }) => {
	const [diceCount, setDiceCount] = useState<1 | 2>(1);

	const handleRoll = () => {
		handleRollDice(diceCount);
	};

	return (
		<div className="p-4 bg-gray-100 rounded-lg">
			<h3 className="text-lg font-bold mb-2">ダイスロール</h3>
			<div className="mb-4">
				<label className="mr-4">
					<input
						type="radio"
						value={1}
						checked={diceCount === 1}
						onChange={() => setDiceCount(1)}
						disabled={rolling}
					/>
					1つのサイコロ
				</label>
				<label>
					<input
						type="radio"
						value={2}
						checked={diceCount === 2}
						onChange={() => setDiceCount(2)}
						disabled={rolling}
					/>
					2つのサイコロ
				</label>
			</div>
			<button
				className="bg-blue-500 text-white px-4 py-2 rounded"
				onClick={handleRoll}
				disabled={rolling}
			>
				{rolling ? "ダイスを振っています..." : "ダイスを振る"}
			</button>
		</div>
	);
};

export default DiceRoll;
