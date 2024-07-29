// src/components/ChoiceModal.tsx
import React from "react";

interface ChoiceModalProps {
	choices: string[];
	onSelect: (choice: string) => void;
}

const ChoiceModal: React.FC<ChoiceModalProps> = ({ choices, onSelect }) => {
	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
			<div className="bg-white p-4 rounded-lg shadow-lg">
				<h2 className="text-xl font-bold mb-4">
					効果を選択してください
				</h2>
				<div className="flex flex-col space-y-2">
					{choices.map((choice, index) => (
						<button
							key={index}
							className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
							onClick={() => onSelect(choice)}
						>
							{choice}
						</button>
					))}
				</div>
			</div>
		</div>
	);
};

export default ChoiceModal;
