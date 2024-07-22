import React, { useState, useEffect } from "react";
import { Socket } from "socket.io-client";
// import { useSocketIO } from "../hooks/useSocketIO";
import { useGameState } from "../hooks/useGameState";
import { GameState, Player, Animal, Cage } from "../types/types";
import { ActionState } from "../types/ActionState"; // ActionStateが定義されているファイルへのパスを指定

import { animalMap } from "../types/Animal";
import { initialBoard } from "../utils/initialBoard";
import { myPlayerAtom } from "../atoms/atoms";
import { useSetRecoilState } from "recoil";

interface TestPanelProps {
	socket: Socket;
	roomId: string;
}

const TestPanel: React.FC<TestPanelProps> = ({ socket, roomId }) => {
	const { gameState, updateGameState } = useGameState();
	// const { emitCageClick } = useSocketIO(socket, roomId, playerId);
	const [localGameState, setLocalGameState] = useState<GameState | null>(
		null
	);
	const [diceValue, setDiceValue] = useState<number>(1);
	const [selectedAnimal, setSelectedAnimal] = useState<string>("");
	const [selectedCage, setSelectedCage] = useState<string>("");
	const [selectedPhase, setSelectedPhase] = useState<string>("");
	const [selectedPlayer, setSelectedPlayer] = useState<string>("");
	const [selectedAction, setSelectedAction] = useState<string>("");
	const [newPlayerName, setNewPlayerName] = useState<string>("");
	const setMyPlayer = useSetRecoilState<Player | null>(myPlayerAtom);

	useEffect(() => {
		if (gameState) {
			setLocalGameState({ ...gameState });
		}
	}, [gameState]);

	const updateLocalGameState = (
		updater: (prevState: GameState) => GameState
	) => {
		setLocalGameState((prevState) => {
			if (!prevState) return gameState ? updater({ ...gameState }) : null;
			return updater(prevState);
		});
	};

	const handleSetDice = () => {
		updateLocalGameState((prevState) => ({
			...prevState,
			diceResult: [diceValue],
		}));
	};

	const handlePlaceAnimal = () => {
		if (selectedAnimal && selectedCage && localGameState) {
			const animal: Animal =
				animalMap[selectedAnimal as keyof typeof animalMap];
			const updatedPlayers = localGameState.players.map((player) => {
				if (player.id === selectedPlayer) {
					const updatedBoard = { ...player.board };
					const cage = updatedBoard[selectedCage] as Cage;
					if (cage && cage.animals.length < cage.max) {
						cage.animals.push(animal);
					}
					return { ...player, board: updatedBoard };
				}
				return player;
			});
			updateLocalGameState((prevState) => ({
				...prevState,
				players: updatedPlayers,
			}));
		}
	};

	const handleChangePhase = () => {
		updateLocalGameState((prevState) => ({
			...prevState,
			phase: selectedPhase as GameState["phase"],
		}));
	};

	const handleChangePlayerAction = () => {
		updateLocalGameState((prevState) => ({
			...prevState,
			players: prevState.players.map((player) =>
				player.id === selectedPlayer
					? { ...player, action: selectedAction as ActionState }
					: player
			),
		}));
	};

	const handleSwitchPlayer = () => {
		// ローカルストレージのPlayerIdを更新
		localStorage.setItem("playerId", selectedPlayer);
		// myPlayerAtomを更新
		setMyPlayer(
			localGameState?.players.find(
				(player) => player.id === selectedPlayer
			) || null
		);
		updateLocalGameState((prevState) => ({
			...prevState,
			players: prevState.players.map((player) => ({
				...player,
				current: player.id === selectedPlayer,
			})),
			currentPlayer: prevState.players.find(
				(player) => player.id === selectedPlayer
			),
		}));
	};

	const createEmptyBoard = (): Record<string, Cage> => {
		return initialBoard;
	};

	const handleAddPlayer = () => {
		const newPlayer: Player = {
			id: `test_${Math.random().toString(36).substr(2, 9)}`,
			name:
				newPlayerName ||
				`test_${Math.random().toString(36).substr(2, 9)}`,
			inventory: Object.values(animalMap).slice(0, 2), // Just taking first two animals for inventory
			board: createEmptyBoard(),
			action: ActionState.INIT,
			current: false,
			poops: 0,
			money: 4,
			star: 0,
			diceResult: undefined,
			owner: false,
			startPlayer: false,
			turnCount: 0,
			turnOrder: 0,
		};

		updateLocalGameState((prevState) => ({
			...prevState,
			players: [...prevState.players, newPlayer],
		}));
	};

	const handleApplyChanges = () => {
		if (localGameState) {
			socket.emit(
				"updateTestGameState",
				{ roomId, gameState: localGameState },
				(success: boolean) => {
					if (success) {
						updateGameState(localGameState);
					} else {
						console.error("Failed to update game state");
					}
				}
			);
		}
	};

	if (!localGameState) {
		return <div>Loading...</div>;
	}

	return (
		<div className="bg-gray-100 p-4 rounded-lg">
			<h3 className="text-lg font-bold mb-4">Test Panel</h3>

			<div className="space-y-4">
				<div>
					<label className="block mb-1">Set Dice Value:</label>
					<input
						type="number"
						min="1"
						max="6"
						value={diceValue}
						onChange={(e) => setDiceValue(parseInt(e.target.value))}
						className="w-full p-2 border rounded"
					/>
					<button
						onClick={handleSetDice}
						className="mt-2 bg-blue-500 text-white px-4 py-2 rounded"
					>
						Set Dice
					</button>
				</div>

				<div>
					<label className="block mb-1">Place Animal:</label>
					<select
						value={selectedAnimal}
						onChange={(e) => setSelectedAnimal(e.target.value)}
						className="w-full p-2 border rounded mb-2"
					>
						<option value="">Select Animal</option>
						{Object.keys(animalMap).map((animalKey) => (
							<option key={animalKey} value={animalKey}>
								{animalKey}
							</option>
						))}
					</select>
					<select
						value={selectedCage}
						onChange={(e) => setSelectedCage(e.target.value)}
						className="w-full p-2 border rounded mb-2"
					>
						<option value="">Select Cage</option>
						{Object.keys(
							localGameState.players[0]?.board || {}
						).map((cage) => (
							<option key={cage} value={cage}>
								{cage}
							</option>
						))}
					</select>
					<select
						value={selectedPlayer}
						onChange={(e) => setSelectedPlayer(e.target.value)}
						className="w-full p-2 border rounded mb-2"
					>
						<option value="">Select Player</option>
						{localGameState.players.map((player) => (
							<option key={player.id} value={player.id}>
								{player.name}
							</option>
						))}
					</select>
					<button
						onClick={handlePlaceAnimal}
						className="bg-green-500 text-white px-4 py-2 rounded"
					>
						Place Animal
					</button>
				</div>

				<div>
					<label className="block mb-1">Change Phase:</label>
					<select
						value={selectedPhase}
						onChange={(e) => setSelectedPhase(e.target.value)}
						className="w-full p-2 border rounded mb-2"
					>
						<option value="">Select Phase</option>
						<option value="waiting">Waiting</option>
						<option value="init">Init</option>
						<option value="main">Main</option>
						<option value="end">End</option>
					</select>
					<button
						onClick={handleChangePhase}
						className="bg-yellow-500 text-white px-4 py-2 rounded"
					>
						Change Phase
					</button>
				</div>

				<div>
					<label className="block mb-1">Change Player Action:</label>
					<select
						value={selectedPlayer}
						onChange={(e) => setSelectedPlayer(e.target.value)}
						className="w-full p-2 border rounded mb-2"
					>
						<option value="">Select Player</option>
						{localGameState.players.map((player) => (
							<option key={player.id} value={player.id}>
								{player.name}
							</option>
						))}
					</select>
					<select
						value={selectedAction}
						onChange={(e) => setSelectedAction(e.target.value)}
						className="w-full p-2 border rounded mb-2"
					>
						<option value="">Select Action</option>
						{Object.values(ActionState).map((action) => (
							<option key={action} value={action}>
								{action}
							</option>
						))}
					</select>
					<button
						onClick={handleChangePlayerAction}
						className="bg-purple-500 text-white px-4 py-2 rounded"
					>
						Change Action
					</button>
				</div>

				<div>
					<label className="block mb-1">Switch Current Player:</label>
					<select
						value={selectedPlayer}
						onChange={(e) => setSelectedPlayer(e.target.value)}
						className="w-full p-2 border rounded mb-2"
					>
						<option value="">Select Player</option>
						{localGameState.players.map((player) => (
							<option key={player.id} value={player.id}>
								{player.name}
							</option>
						))}
					</select>
					<button
						onClick={handleSwitchPlayer}
						className="bg-indigo-500 text-white px-4 py-2 rounded"
					>
						Switch Player
					</button>
				</div>

				<div>
					<label className="block mb-1">Add Player:</label>
					<input
						type="text"
						value={newPlayerName}
						onChange={(e) => setNewPlayerName(e.target.value)}
						placeholder="New Player Name"
						className="w-full p-2 border rounded mb-2"
					/>
					<button
						onClick={handleAddPlayer}
						className="bg-indigo-500 text-white px-4 py-2 rounded"
					>
						Add Player
					</button>
				</div>

				<div>
					<button
						onClick={handleApplyChanges}
						className="bg-red-500 text-white px-4 py-2 rounded"
					>
						Apply Changes
					</button>
				</div>

				<div>
					<label className="block mb-1">Current Game State:</label>
					<textarea
						value={JSON.stringify(localGameState, null, 2)}
						readOnly
						className="w-full h-48 p-2 border rounded"
					/>
				</div>
			</div>
		</div>
	);
};

export default TestPanel;
