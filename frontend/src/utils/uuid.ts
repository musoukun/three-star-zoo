// src/utils/uuid.ts
import { v4 as uuidv4 } from "uuid";

export const getOrCreatePlayerId = (): string => {
	let playerId = localStorage.getItem("playerId");
	if (!playerId) {
		playerId = uuidv4();
		localStorage.setItem("playerId", playerId);
	}
	return playerId;
};
