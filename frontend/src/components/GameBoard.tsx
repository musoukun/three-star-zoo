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
} from "../types/types";
import AreaBoard from "./AreaBoard";
import OtherPlayer from "./OtherPlayer";
import AnimalCardList from "./AnimalCardList";
import { ActionState } from "../types/ActionState";

interface GameBoardProps {
	socket: Socket;
	roomId: string;
	animalCards: AnimalCardType[];
}

/**
 * ゲームボードコンポーネント
 * ゲームの全体的な状態を管理し、他のコンポーネントを組み合わせて表示します
 */
const GameBoard: React.FC<GameBoardProps> = ({
	socket,
	roomId,
	animalCards,
}) => {
	const [gameState, setGameState] = useRecoilState<GameState>(gameStateAtom);
	const [playerId, setPlayerId] = useState<string>(getOrCreatePlayerId());
	const [myPlayerData, setMyPlayerData] = useState<Player | undefined>();
	const [isCurrentTurn, setIsCurrentTurn] = useState<boolean>(false);
	const [localVersion, setLocalVersion] = useState<number>(0);

	/**
	 * 現在のプレイヤーを取得する
	 */
	const getCurrentPlayer = useCallback((players: Player[]) => {
		return players.find((player) => player.current) || null;
	}, []);

	useEffect(() => {
		const id = getOrCreatePlayerId();
		setPlayerId(id);
	}, []);

	/**
	 * ゲーム状態を更新する
	 */
	const updateGameState = useCallback(
		(newGameState: GameState, version: number) => {
			if (version > localVersion) {
				console.log("Updating game state:", newGameState);
				setGameState(newGameState);
				setLocalVersion(version);
				updateMyPlayerData(newGameState);
			}
		},
		[localVersion, playerId, setGameState]
	);

	/**
	 * 自分のプレイヤーデータを更新する
	 */
	const updateMyPlayerData = useCallback(
		(newGameState: GameState) => {
			const updatedMyPlayer = newGameState.players.find(
				(player) => player.id === playerId
			);
			if (updatedMyPlayer) {
				console.log("Updating my player data:", updatedMyPlayer);
				setMyPlayerData(updatedMyPlayer);
				setIsCurrentTurn(updatedMyPlayer.current || false);
			}
		},
		[playerId]
	);

	useEffect(() => {
		// ゲーム状態が更新されたときに自分のプレイヤーデータを更新する
		if (gameState && playerId) {
			updateMyPlayerData(gameState);
		}
	}, [gameState, playerId, updateMyPlayerData]);

	/**
	 * ソケットイベントのハンドラーをセットアップする
	 * versionの役割：ゲーム状態の更新を制御するためのバージョン番号
	 */
	useEffect(() => {
		// ゲーム開始、ゲーム状態更新のイベントハンドラーをセットアップ
		const setupSocketHandlers = () => {
			// ゲームが開始されたときに呼び出される
			const handleGameStarted = (newGameStateData: GameState) => {
				console.log("Game started:", newGameStateData);
				updateGameState(newGameStateData, 0); // バージョン0で初期化
			};

			// ゲーム状態が更新されたときに呼び出される
			const handleGameStateUpdate = (
				newGameStateData: GameState,
				version: number
			) => {
				console.log(
					"Received new game state:",
					newGameStateData,
					"version:",
					version
				);
				updateGameState(newGameStateData, version);
			};

			// socket.onとは、サーバーからのイベントを受け取るメソッド
			socket.on("startGame", handleGameStarted);
			socket.on("gameStateUpdate", handleGameStateUpdate);

			return () => {
				socket.off("startGame", handleGameStarted);
				socket.off("gameStateUpdate", handleGameStateUpdate);
			};
		};

		return setupSocketHandlers();
	}, [socket, updateGameState]);

	/**
	 * ケージクリックのハンドラー
	 */
	const handleCageClick = useCallback(
		(cageNumber: string, animal: Animal) => {
			try {
				console.log("Emitting cageClick:", {
					cageNumber,
					animal,
					playerId,
					roomId,
				});
				socket.emit(
					"cageClick",
					{ roomId, cageNumber, animal, playerId },
					handleCageClickResponse
				);
			} catch (e) {
				console.error(e);
			}
		},
		[socket, roomId, playerId]
	);

	/**
	 * ケージクリックのレスポンスを処理する
	 */
	const handleCageClickResponse = useCallback(
		(success: boolean, serverGameState: GameState | null) => {
			if (success && serverGameState) {
				console.log("Cage click successful:", serverGameState);
				updateGameState(serverGameState, localVersion + 1);
			} else {
				socket.emit("getGameState", { roomId });
			}
		},
		[localVersion, roomId, socket, updateGameState]
	);

	if (!gameState || !gameState.players) {
		return <div>Loading...</div>;
	}

	const currentPlayer = getCurrentPlayer(gameState.players);
	const otherPlayers = gameState.players.filter(
		(player) => player.id !== playerId
	);

	return (
		<div className="flex flex-col h-screen bg-[#f0e6d2] font-crimson-text">
			<GameHeader currentPlayer={currentPlayer} gameState={gameState} />
			<div className="flex flex-1 overflow-hidden">
				<OtherPlayersSection
					players={otherPlayers}
					currentPlayerId={gameState?.currentPlayer?.id}
				/>
				<AnimalCardsSection animalCards={animalCards} />
			</div>
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
	);
};

/**
 * ゲームヘッダーコンポーネント
 */
const GameHeader: React.FC<{
	currentPlayer: Player | null;
	gameState: GameState;
}> = ({ currentPlayer, gameState }) => (
	<div className="p-4 bg-blue-100">
		<h2 className="text-xl font-bold">
			現在のプレイヤー: {currentPlayer?.name}
		</h2>
		<h3 className="text-xl">ターンの状態: {gameState?.phase}</h3>
		<h3 className="text-xl">ラウンド: {gameState?.roundNumber}</h3>
		<h3 className="text-xl">うんち: {currentPlayer?.poops || 0}</h3>
		{currentPlayer?.diceResult !== undefined && (
			<h3 className="text-xl">
				ダイスの結果: {currentPlayer.diceResult}
			</h3>
		)}
	</div>
);

/**
 * 他のプレイヤーセクションコンポーネント
 */
const OtherPlayersSection: React.FC<{
	players: Player[];
	currentPlayerId: string | undefined;
}> = ({ players, currentPlayerId }) => (
	<div className="w-2/3 p-4 overflow-y-auto">
		{players.map((player: Player) => (
			<OtherPlayer
				key={player.id}
				player={player}
				isCurrentTurn={player.id === currentPlayerId}
			/>
		))}
	</div>
);

/**
 * アニマルカードセクションコンポーネント
 */
const AnimalCardsSection: React.FC<{ animalCards: AnimalCardType[] }> = ({
	animalCards,
}) => (
	<div className="w-1/2 flex flex-wrap justify-center content-start p-4 overflow-y-auto bg-gray-100">
		<AnimalCardList AnimalCards={animalCards} />
	</div>
);

/**
 * プレイヤーのエリアボードコンポーネント
 */
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
	<div className="h-1/3 p-4 bg-white shadow-lg">
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
