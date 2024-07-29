// src/components/PlayerSelectionButton.tsx
import React from "react";

interface PlayerSelectionButtonProps {
	playerId: string;
	playerName: string;
	action: string;
	onSelect: (playerId: string) => void;
}

const PlayerSelectionButton: React.FC<PlayerSelectionButtonProps> = ({
	playerId,
	playerName,
	action,
	onSelect,
}) => {
	return (
		<button
			className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
			onClick={() => onSelect(playerId)}
		>
			{playerName}から{action}
		</button>
	);
};

export default PlayerSelectionButton;
