import React, { useEffect, useState, useCallback } from "react";
import { Socket } from "socket.io-client";
import { useRecoilState } from "recoil";
import { gameStateAtom } from "../atoms/atoms";
import { getOrCreatePlayerId } from "../utils/uuid";
import {
	Animal,
	AnimalCard as AnimalCardType,
	Board,
	GameState,
	Player,
	ResultItem,
} from "../types/types";
import AreaBoard from "./AreaBoard";
import OtherPlayer from "./OtherPlayer";
import AnimalCardList from "./AnimalCardList";
import { ActionState } from "../types/ActionState";
import ResultDisplay from "./ResultDisplay";

interface GameBoardProps {
	socket: Socket;
	roomId: string;
	animalCards: AnimalCardType[];
}

const GameBoard: React.FC<GameBoardProps> = ({
	socket,
	roomId,
	animalCards,
}) => {
	const [gameState, setGameState] = useRecoilState<GameState>(gameStateAtom);
	const [playerId, setPlayerId] = useState<string>(getOrCreatePlayerId());
	const [myPlayerData, setMyPlayerData] = useState<Player | undefined>();
	const [isCurrentTurn, setIsCurrentTurn] = useState<boolean>(false);
	// 結果画面用
	const [showResults, setShowResults] = useState(false);
	const [results, setResults] = useState<ResultItem[]>([]);

	// 現在のプレイヤーを取得
	const getCurrentPlayer = useCallback((players: Player[]) => {
		return players.find((player) => player.current) || null;
	}, []);

	// 画面表示時に、プレイヤーIDを取得または作成
	useEffect(() => {
		const id = getOrCreatePlayerId();
		setPlayerId(id);
	}, []);

	// ゲームの状態を更新
	const updateGameState = useCallback(
		(newGameState: GameState) => {
			console.log("Updating game state:", newGameState);
			setGameState(newGameState);
			updateMyPlayerData(newGameState);
		},
		[setGameState]
	);

	// プレイヤーのデータを更新
	const updateMyPlayerData = useCallback(
		(newGameState: GameState) => {
			// 自身のプレイヤーデータを取得
			const updatedMyPlayer = newGameState.players.find(
				(player) => player.id === playerId
			);
			if (updatedMyPlayer) {
				console.log("Updating my player data:", updatedMyPlayer);
				setMyPlayerData(updatedMyPlayer);
				// 自身のターンかどうかを判定
				setIsCurrentTurn(updatedMyPlayer.current || false);
			}
		},
		[playerId]
	);

	// ゲームの状態を更新
	useEffect(() => {
		if (gameState && playerId) {
			updateMyPlayerData(gameState);
		}
		// gameStateか、自身のプレイヤーIDやデータが変更された場合に再実行
	}, [gameState, playerId, updateMyPlayerData]);

	useEffect(() => {
		const handleGameStateUpdate = (newGameStateData: GameState) => {
			console.log("Received new game state:", newGameStateData);
			updateGameState(newGameStateData);
		};

		const handleGameError = (error: { message: string }) => {
			console.error("Game error:", error.message);
			// ここでエラーメッセージを表示するなどの処理を追加できます
		};

		socket.on("gameStateUpdate", handleGameStateUpdate);
		socket.on("gameError", handleGameError);

		return () => {
			socket.off("gameStateUpdate", handleGameStateUpdate);
			socket.off("gameError", handleGameError);
		};
		// backendからのデータを受信した場合に再実行
	}, [socket, updateGameState]);

	const handleCageClick = useCallback(
		(cageNumber: string, animal: Animal) => {
			try {
				console.log("Emitting cageClick:", {
					cageNumber,
					animal,
					playerId,
					roomId,
				});
				socket.emit("cageClick", {
					roomId,
					cageNumber,
					animal,
					playerId,
				});
			} catch (e) {
				console.error(e);
			}
		},
		[socket, roomId, playerId]
	);

	if (!gameState || !gameState.players) {
		return <div>Loading...</div>;
	}

	const currentPlayer = getCurrentPlayer(gameState.players);
	const otherPlayers = gameState.players.filter(
		(player) => player.id !== playerId
	);

	const handleShowResults = (newResults: ResultItem[]) => {
		setResults(newResults);
		setShowResults(true);
	};

	// 例: うんち計算の結果を表示する関数
	const showPoopCalculationResults = () => {
		const calculationResults: ResultItem[] = [
			{
				animalId: "RessaPanda",
				animalCount: 2,
				poopIcon: "💩",
				poopCost: 3,
				subtotal: 6,
			},
			{
				animalId: "Penguin",
				animalCount: 1,
				poopIcon: "💩",
				poopCost: 2,
				subtotal: 2,
			},
		];
		handleShowResults(calculationResults);
	};
	return (
		<div className="flex h-screen bg-[#f0e6d2] font-crimson-text">
			<div className="flex flex-col w-5/6">
				<h2 className="text-xl font-bold p-2 bg-indigo-300">
					ゲームボード
				</h2>
				<div className="flex flex-1 overflow-hidden">
					<div className="w-3/5 p-2 overflow-y-auto">
						<OtherPlayersSection
							players={otherPlayers}
							currentPlayerId={gameState?.currentPlayer?.id}
						/>
					</div>
					<div className="w-2/5 p-2 bg-gray-100 overflow-y-auto">
						<AnimalCardsSection animalCards={animalCards} />
					</div>
				</div>
				<div className=" bg-white shadow-lg">
					<PlayerAreaBoard
						myPlayerData={myPlayerData}
						isCurrentTurn={isCurrentTurn}
						handleCageClick={handleCageClick}
						gameState={gameState}
						socket={socket}
						roomId={roomId}
						playerId={playerId}
					/>
				</div>
				{/* テスト用ボタン */}
				<button onClick={showPoopCalculationResults}>
					うんち計算結果を表示
				</button>
			</div>
			<div className="w-1/6 p-2 bg-[#e1f3cb] overflow-y-auto">
				<GameInfo currentPlayer={currentPlayer} gameState={gameState} />
			</div>

			{showResults && (
				<ResultDisplay
					results={results}
					duration={5000}
					onClose={() => setShowResults(false)}
				/>
			)}
		</div>
	);
};

const GameInfo: React.FC<{
	currentPlayer: Player | null;
	gameState: GameState;
}> = ({ currentPlayer, gameState }) => (
	<div>
		<h3 className="text-sm font-bold mb-1">
			現在のプレイヤー: {currentPlayer?.name}
		</h3>
		<p className="text-xs mb-1">ターンの状態: {gameState?.phase}</p>
		<p className="text-xs mb-1">ラウンド: {gameState?.roundNumber}</p>
		<p className="text-xs mb-1">うんち: {currentPlayer?.poops || 0}</p>
		{currentPlayer?.diceResult !== undefined && (
			<p className="text-xs">ダイスの結果: {currentPlayer.diceResult}</p>
		)}
	</div>
);

const OtherPlayersSection: React.FC<{
	players: Player[];
	currentPlayerId: string | undefined;
}> = ({ players, currentPlayerId }) => (
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

const AnimalCardsSection: React.FC<{ animalCards: AnimalCardType[] }> = ({
	animalCards,
}) => (
	<div>
		<AnimalCardList AnimalCards={animalCards} />
	</div>
);

const PlayerAreaBoard: React.FC<{
	myPlayerData: Player | undefined;
	isCurrentTurn: boolean;
	handleCageClick: (cageNumber: string, animal: Animal) => void;
	gameState: GameState;
	socket: Socket;
	roomId: string;
	playerId: string;
}> = ({
	myPlayerData,
	isCurrentTurn,
	handleCageClick,
	gameState,
	socket,
	roomId,
	playerId,
}) => (
	<div className="">
		{myPlayerData && (
			<AreaBoard
				board={myPlayerData.board as Board}
				isCurrentTurn={isCurrentTurn}
				onCageClick={handleCageClick}
				phase={gameState.phase}
				action={myPlayerData.action as ActionState}
				socket={socket}
				roomId={roomId}
				playerId={playerId}
				diceResult={myPlayerData.diceResult || null}
				inventory={myPlayerData.inventory as Animal[]}
			/>
		)}
	</div>
);

export default GameBoard;
