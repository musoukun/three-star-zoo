import React from "react";
import { Player } from "../../types/types";
import OtherPlayer from "./OtherPlayer";

interface OtherPlayersSectionProps {
	players: Player[];
	currentPlayerId: string | undefined;
}

const OtherPlayersSection: React.FC<OtherPlayersSectionProps> = ({
	players,
	currentPlayerId,
}) => (
	<div className="space-y-2">
		{players.map((player: Player) => (
			<OtherPlayer
				key={player.id}
				player={player}
				isCurrentTurn={player.id === currentPlayerId}
			/>
		))}
	</div>
);

export default OtherPlayersSection;
