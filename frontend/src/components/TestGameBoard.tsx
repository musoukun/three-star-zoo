import React, { useState, useEffect, useCallback } from "react";
import { Socket } from "socket.io-client";
import { GameState, Animal } from "../types/types";

interface TestGameBoardProps {
	socket: Socket;
	roomId: string;
	animalCards: Animal[];
}

const TestGameBoard: React.FC<TestGameBoardProps> = ({
	socket,
	roomId,
	animalCards,
}) => {
	const [gameState, setGameState] = useState<GameState | null>(null);
	const [newPlayerName, setNewPlayerName] = useState("");
	const [selectedPlayerId, setSelectedPlayerId] = useState("");
	const [selectedAnimalId, setSelectedAnimalId] = useState("");
	const [selectedCage, setSelectedCage] = useState("");
	const [coinAmount, setCoinAmount] = useState(0);

	useEffect(() => {
		socket.on("gameStateUpdate", (updatedGameState: GameState) => {
			setGameState(updatedGameState);
		});

		return () => {
			socket.off("gameStateUpdate");
		};
	}, [socket]);

	const startTestGame = useCallback(() => {
		socket.emit(
			"startTestGame",
			{ roomId },
			(response: { success: boolean; gameState: GameState }) => {
				if (response.success) {
					setGameState(response.gameState);
				}
			}
		);
	}, [socket, roomId]);

	const addTestPlayer = useCallback(() => {
		if (newPlayerName) {
			socket.emit(
				"addTestPlayer",
				{ roomId, playerName: newPlayerName },
				(response: { success: boolean; gameState: GameState }) => {
					if (response.success) {
						setGameState(response.gameState);
						setNewPlayerName("");
					}
				}
			);
		}
	}, [socket, roomId, newPlayerName]);

	const setCurrentPlayer = useCallback(() => {
		if (selectedPlayerId) {
			socket.emit(
				"setCurrentPlayer",
				{ roomId, playerId: selectedPlayerId },
				(response: { success: boolean; gameState: GameState }) => {
					if (response.success) {
						setGameState(response.gameState);
					}
				}
			);
		}
	}, [socket, roomId, selectedPlayerId]);

	const addCoins = useCallback(() => {
		socket.emit(
			"addCoins",
			{ roomId, amount: coinAmount },
			(response: { success: boolean; gameState: GameState }) => {
				if (response.success) {
					setGameState(response.gameState);
					setCoinAmount(0);
				}
			}
		);
	}, [socket, roomId, coinAmount]);

	const placeAnimal = useCallback(() => {
		if (selectedAnimalId && selectedCage) {
			socket.emit(
				"placeAnimal",
				{
					roomId,
					cageNumber: selectedCage,
					animalId: selectedAnimalId,
				},
				(response: { success: boolean; gameState: GameState }) => {
					if (response.success) {
						setGameState(response.gameState);
						setSelectedAnimalId("");
						setSelectedCage("");
					}
				}
			);
		}
	}, [socket, roomId, selectedAnimalId, selectedCage]);

	const changePhase = useCallback(
		(phase: string) => {
			socket.emit(
				"changePhase",
				{ roomId, phase },
				(response: { success: boolean; gameState: GameState }) => {
					if (response.success) {
						setGameState(response.gameState);
					}
				}
			);
		},
		[socket, roomId]
	);

	const rollDice = useCallback(() => {
		socket.emit(
			"rollDice",
			{ roomId },
			(response: { success: boolean; gameState: GameState }) => {
				if (response.success) {
					setGameState(response.gameState);
				}
			}
		);
	}, [socket, roomId]);

	const poopAction = useCallback(() => {
		socket.emit(
			"poopAction",
			{ roomId },
			(response: { success: boolean; gameState: GameState }) => {
				if (response.success) {
					setGameState(response.gameState);
				}
			}
		);
	}, [socket, roomId]);

	const flushAction = useCallback(() => {
		socket.emit(
			"flushAction",
			{ roomId },
			(response: { success: boolean; gameState: GameState }) => {
				if (response.success) {
					setGameState(response.gameState);
				}
			}
		);
	}, [socket, roomId]);

	if (!gameState) {
		return <div>Loading...</div>;
	}

	return (
		<div className="flex">
			<div className="w-1/4 p-4 bg-gray-100 overflow-y-auto h-screen">
				<h2 className="text-xl font-bold mb-4">テストコントロール</h2>
				<button
					onClick={startTestGame}
					className="w-full bg-green-500 text-white p-2 rounded mb-4"
				>
					テストゲーム開始
				</button>
				<div className="mb-4">
					<input
						type="text"
						value={newPlayerName}
						onChange={(e) => setNewPlayerName(e.target.value)}
						placeholder="新しいプレイヤー名"
						className="w-full p-2 mb-2 border rounded"
					/>
					<button
						onClick={addTestPlayer}
						className="w-full bg-blue-500 text-white p-2 rounded"
					>
						プレイヤー追加
					</button>
				</div>
				<div className="mb-4">
					<select
						value={selectedPlayerId}
						onChange={(e) => setSelectedPlayerId(e.target.value)}
						className="w-full p-2 border rounded mb-2"
					>
						<option value="">プレイヤーを選択</option>
						{gameState.players.map((player) => (
							<option key={player.id} value={player.id}>
								{player.name}
							</option>
						))}
					</select>
					<button
						onClick={setCurrentPlayer}
						className="w-full bg-yellow-500 text-white p-2 rounded"
					>
						現在のプレイヤーに設定
					</button>
				</div>
				<div className="mb-4">
					<input
						type="number"
						value={coinAmount}
						onChange={(e) => setCoinAmount(Number(e.target.value))}
						placeholder="コインの枚数"
						className="w-full p-2 mb-2 border rounded"
					/>
					<button
						onClick={addCoins}
						className="w-full bg-yellow-500 text-white p-2 rounded"
					>
						コインを追加
					</button>
				</div>
				<div className="mb-4">
					<select
						value={selectedAnimalId}
						onChange={(e) => setSelectedAnimalId(e.target.value)}
						className="w-full p-2 border rounded mb-2"
					>
						<option value="">動物を選択</option>
						{animalCards.map((animal) => (
							<option key={animal.id} value={animal.id}>
								{animal.name}
							</option>
						))}
					</select>
					<select
						value={selectedCage}
						onChange={(e) => setSelectedCage(e.target.value)}
						className="w-full p-2 border rounded mb-2"
					>
						<option value="">ケージを選択</option>
						{Array.from({ length: 12 }, (_, i) => i + 1).map(
							(num) => (
								<option key={num} value={`cage${num}`}>
									ケージ {num}
								</option>
							)
						)}
					</select>
					<button
						onClick={placeAnimal}
						className="w-full bg-purple-500 text-white p-2 rounded"
					>
						動物を配置
					</button>
				</div>
				<div className="mb-4">
					<select
						onChange={(e) => changePhase(e.target.value)}
						className="w-full p-2 border rounded"
					>
						<option value="">フェーズを選択</option>
						<option value="waiting">待機中</option>
						<option value="init">初期化</option>
						<option value="main">メイン</option>
						<option value="end">終了</option>
					</select>
				</div>
				<div className="mb-4">
					<button
						onClick={rollDice}
						className="w-full bg-blue-500 text-white p-2 rounded mb-2"
					>
						サイコロを振る
					</button>
					<button
						onClick={poopAction}
						className="w-full bg-red-500 text-white p-2 rounded mb-2"
					>
						うんちをもらう
					</button>
					<button
						onClick={flushAction}
						className="w-full bg-green-500 text-white p-2 rounded"
					>
						うんちを掃除する
					</button>
				</div>
			</div>
			<div className="w-3/4 p-4">
				<h2 className="text-2xl font-bold mb-4">ゲーム状態</h2>
				<pre className="bg-gray-200 p-4 rounded overflow-auto">
					{JSON.stringify(gameState, null, 2)}
				</pre>
			</div>
		</div>
	);
};

export default TestGameBoard;
