/* eslint-disable @typescript-eslint/no-unused-vars */
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
	ResultPoops,
} from "../types/types";
import AreaBoard from "./AreaBoard";
import OtherPlayer from "./OtherPlayer";
import { ActionState } from "../types/ActionState";
import ResultDisplay from "./ResultDisplay";
import AnimalCardsSection from "./AnimalCardSection";
import DiceRollAnimation from "./DiceRollAnimation";

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
	const [showPoopResults, setShowPoopResults] = useState(false);
	const [poopResults, setPoopResults] = useState<ResultPoops[]>([]);
	const [diceResult, setDiceResult] = useState<number>(0);
	const [showDiceResult, setShowDiceResult] = useState<boolean>(false);
	const [rolling, setRolling] = useState(false);

	// 例: うんち計算の結果を表示する関数
	const showPoopCalculationResults = useCallback(() => {
		console.log("Showing poop calculation poopResults:", poopResults);
		if (poopResults.length > 0) {
			console.log("poopResults is not empty");
			setShowPoopResults(true);
		}
	}, [poopResults]);

	useEffect(() => {
		if (poopResults.length > 0) {
			showPoopCalculationResults();
		}
	}, [poopResults]);

	// ダイスの結果を取得
	const handleShowDiceResults = useCallback(() => {
		console.log("Showing dice result:", diceResult);
		if (diceResult) {
			console.log("diceResult is not empty");
			setShowDiceResult(true);
		}
	}, [diceResult]);

	// 現在のプレイヤーを取得
	const getCurrentPlayer = useCallback((players: Player[]) => {
		return players.find((player) => player.current) || null;
	}, []);

	// 画面表示時に、プレイヤーIDを取得または作成
	useEffect(() => {
		const id = getOrCreatePlayerId();
		setPlayerId(id);
	}, []);

	// サーバーからのゲーム状態の更新を受け取る
	const handleGameStateUpdate = async (newGameStateData: GameState) => {
		console.log("Received new game state:", newGameStateData);
		await updateGameAndPlayerState(newGameStateData);
	};

	useEffect(() => {
		handleGameStateUpdate(gameState);
		socket.on("gameStateUpdate", handleGameStateUpdate);

		return () => {
			socket.off("gameStateUpdate", handleGameStateUpdate);
		};
	}, [socket, handleGameStateUpdate]);

	// ゲームの状態とプレイヤーのデータを更新する関数
	const updateGameAndPlayerState = useCallback(
		(newGameState: GameState) => {
			console.log("Updating game state:", newGameState);
			setGameState(newGameState);

			if (newGameState.poopsResult) {
				setPoopResults(newGameState.poopsResult);
			}

			const updatedMyPlayer = newGameState.players.find(
				(player) => player.id === playerId
			);
			if (updatedMyPlayer) {
				console.log("Updating my player data:", updatedMyPlayer);
				setMyPlayerData(updatedMyPlayer);
				setIsCurrentTurn(updatedMyPlayer.current as boolean);
			}
		},
		[playerId, setGameState]
	);

	useEffect(() => {
		handleGameStateChange();
	}, [gameState]);

	const handleRollDice = useCallback(
		(diceCount: number) => {
			setRolling(true);
			socket.emit(
				"rollDice",
				{ roomId, playerId, diceCount },
				(success: boolean) => {
					if (success) {
						console.log("Dice roll successful");
						// ここで必要な処理を追加（例：状態の更新など）
					} else {
						console.error("Dice roll failed");
					}
					setRolling(false);
				}
			);
		},
		[socket, roomId, playerId]
	);

	// GameStateの変更を検知し、必要なアクションを実行する
	const handleGameStateChange = useCallback(() => {
		console.log("ターンごとの自動イベントチェック");
		if (
			gameState.phase === "main" &&
			gameState.players.find((p) => p.id === playerId)?.action ===
				ActionState.POOP &&
			gameState.players.find((p) => p.id === playerId)?.current
		) {
			try {
				console.log("poop action");
				socket.emit("poopAction", { roomId, playerId });
			} catch (e) {
				console.error(e);
			}
		}

		if (
			gameState.phase === "main" &&
			gameState.players.find((p) => p.id === playerId)?.action ===
				ActionState.ROLL &&
			gameState.players.find((p) => p.id === playerId)?.current
		) {
			showPoopCalculationResults();
		}
	}, [gameState, playerId, socket, roomId]);

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
					<div className="w-2/5 bg-gray-100 overflow-hidden">
						<AnimalCardsSection animalCards={animalCards} />
					</div>
				</div>
				<div className=" bg-white shadow-lg">
					<PlayerAreaBoard
						myPlayerData={myPlayerData}
						handleCageClick={handleCageClick}
						isCurrentTurn={isCurrentTurn}
						gameState={gameState}
						socket={socket}
						roomId={roomId}
						playerId={playerId}
						rolling={rolling}
						handleRollDice={handleRollDice}
					/>
				</div>
			</div>
			<div className="w-1/6 p-2 bg-[#e8f1d3] overflow-y-auto">
				<GameInfo currentPlayer={currentPlayer} gameState={gameState} />
				{/* テスト用ボタン */}
				<button
					className="bg-red-200 rounded-xl p-1 mt-1"
					onClick={showPoopCalculationResults}
				>
					うんち計算結果を表示
				</button>
			</div>
			{showDiceResult && <DiceRollAnimation result={diceResult} />}
			{showPoopResults && (
				<ResultDisplay
					results={poopResults}
					duration={5000}
					onClose={() => setShowPoopResults(false)}
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

// const AnimalCardsSection: React.FC<{ animalCards: AnimalCardType[] }> = ({
// 	animalCards,
// }) => (
// 	<div>
// 		<AnimalCardList AnimalCards={animalCards} />
// 	</div>
// );

const PlayerAreaBoard: React.FC<{
	myPlayerData: Player | undefined;
	isCurrentTurn: boolean;
	handleCageClick: (cageNumber: string, animal: Animal) => void;
	gameState: GameState;
	socket: Socket;
	roomId: string;
	rolling: boolean;
	playerId: string;
	handleRollDice: (diceCount: number) => void;
}> = ({
	myPlayerData,
	isCurrentTurn,
	handleCageClick,
	gameState,
	socket,
	roomId,
	playerId,
	rolling,
	handleRollDice,
}) => (
	<div className="">
		{myPlayerData && (
			<AreaBoard
				onCageClick={handleCageClick}
				handleRollDice={handleRollDice}
				board={myPlayerData.board as Board}
				isCurrentTurn={isCurrentTurn}
				phase={gameState.phase}
				action={myPlayerData.action as ActionState}
				socket={socket}
				roomId={roomId}
				playerId={playerId}
				diceResult={myPlayerData.diceResult || null}
				inventory={myPlayerData.inventory as Animal[]}
				rolling={rolling}
			/>
		)}
	</div>
);

export default GameBoard;
