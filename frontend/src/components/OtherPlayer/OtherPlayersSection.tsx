import React from "react";
import { Player } from "../../types/types";
import OtherPlayer from "./OtherPlayer";

interface OtherPlayersSectionProps {
	players: Player[];
	currentPlayerId: string | undefined;
	onPlayerSelect?: (selectedPlayerId: string) => void;
	actionText?: string;
}

const OtherPlayersSection: React.FC<OtherPlayersSectionProps> = ({
	players,
	currentPlayerId,
	onPlayerSelect,
	actionText,
}) => (
	<div className="space-y-2">
		{players.map((player: Player) => (
			<OtherPlayer
				key={player.id}
				player={player}
				isCurrentTurn={player.id === currentPlayerId}
				onPlayerSelect={onPlayerSelect}
				actionText={actionText}
			/>
		))}
	</div>
);

export default OtherPlayersSection;
