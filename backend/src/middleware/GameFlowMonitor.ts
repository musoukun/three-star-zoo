import { Board, GameState, Player } from "../types/types";
import { ActionState } from "../types/ActionState";
/**
 * ゲームの進行を管理するミドルウェアです。
 * @param {GameState} gameState - 現在のゲーム状態
 * @returns {GameState} - 更新されたゲーム状態
 */
export function gameProgressMiddleware(gameState: GameState): GameState {
	const updatedGameState = { ...gameState };

	switch (updatedGameState.phase) {
		case "init":
			handleInitPhase(updatedGameState);
			break;
		case "main":
			handleMainPhase(updatedGameState);
			break;
		case "end":
			handleEndPhase(updatedGameState);
			break;
	}

	return updatedGameState;
}
/**
 * ゲームの初期化フェーズを処理します。
 * @param {GameState} gameState - 現在のゲーム状態
 */
function handleInitPhase(gameState: GameState) {
	const currentPlayer = getCurrentPlayer(gameState);
	if (currentPlayer && isInitPhaseComplete(currentPlayer)) {
		updatePlayerAction(currentPlayer, ActionState.POOP);
		moveToNextPlayer(gameState);
	}

	if (areAllPlayersReady(gameState)) {
		transitionToMainPhase(gameState);
	}
}
/**
 * ゲームのメインフェーズを処理します。
 * @param {GameState} gameState - 現在のゲーム状態
 */
function handleMainPhase(gameState: GameState) {
	const currentPlayer = getCurrentPlayer(gameState);
	if (currentPlayer) {
		switch (currentPlayer.action) {
			case ActionState.POOP:
				handlePoopAction(currentPlayer, gameState);
				break;
			case ActionState.ROLL:
				handleRollAction(currentPlayer, gameState);
				break;
			case ActionState.TRADE:
				handleTradeAction(currentPlayer, gameState);
				break;
		}

		if (isActionComplete(currentPlayer)) {
			moveToNextPlayer(gameState);
			updateNextPlayerAction(gameState);
		}
	}
}
/**
 * ゲームの終了フェーズを処理します。
 * @param {GameState} gameState - 現在のゲーム状態
 */
function handleEndPhase(gameState: GameState) {
	// エンドフェーズのロジックを実装
}
/**
 * 現在のプレイヤーを取得します。
 * @param {GameState} gameState - 現在のゲーム状態
 * @returns {Player | undefined} - 現在のプレイヤー
 */
function getCurrentPlayer(gameState: GameState): Player | undefined {
	return gameState.players.find((player) => player.current);
}
/**
 * 初期化フェーズが完了したかどうかを判断します。
 * @param {Player} player - 判定対象のプレイヤー
 * @returns {boolean} - 初期化フェーズが完了していればtrue、そうでなければfalse
 */
function isInitPhaseComplete(player: Player): boolean {
	if (!player.board || !player.inventory) return false;

	const placedAnimals = player.inventory.reduce(
		(acc, animal) => {
			acc[animal.id] = 0;
			return acc;
		},
		{} as { [key: string]: number }
	);

	Object.values(player.board).forEach((cage) => {
		cage.animals.forEach((animal) => {
			placedAnimals[animal.id]++;
		});
	});

	return player.inventory.every((animal) => placedAnimals[animal.id] === 1);
}
/**
 * プレイヤーのアクションを更新します。
 * @param {Player} player - アクションを更新するプレイヤー
 * @param {ActionState} action - 新しいアクション
 */
function updatePlayerAction(player: Player, action: ActionState) {
	player.action = action;
}
/**
 * 次のプレイヤーに移行します。
 * @param {GameState} gameState - 現在のゲーム状態
 */
function moveToNextPlayer(gameState: GameState) {
	const currentPlayerIndex = gameState.players.findIndex(
		(player) => player.current
	);
	gameState.players[currentPlayerIndex].current = false;
	const nextPlayerIndex = (currentPlayerIndex + 1) % gameState.players.length;
	gameState.players[nextPlayerIndex].current = true;
}
/**
 * 次のプレイヤーのアクションを更新します。
 * @param {GameState} gameState - 現在のゲーム状態
 */
function updateNextPlayerAction(gameState: GameState) {
	const nextPlayer = getCurrentPlayer(gameState);
	if (nextPlayer) {
		updatePlayerAction(nextPlayer, ActionState.POOP);
	}
}

/**
 * すべてのプレイヤーが準備完了かどうかを判断します。
 * @param {GameState} gameState - 現在のゲーム状態
 * @returns {boolean} - すべてのプレイヤーが準備完了していればtrue、そうでなければfalse
 */
function areAllPlayersReady(gameState: GameState): boolean {
	return gameState.players.every(
		(player) => player.action === ActionState.POOP
	);
}

/**
 * メインフェーズに移行します。
 * @param {GameState} gameState - 現在のゲーム状態
 */
function transitionToMainPhase(gameState: GameState) {
	gameState.phase = "main";
	const startPlayer =
		gameState.players.find((player) => player.startPlayer) ||
		gameState.players[0];
	startPlayer.current = true;
	handlePoopAction(startPlayer, gameState);
	updatePlayerAction(startPlayer, ActionState.ROLL);
}
/**
 * POOPアクションを処理します。
 * @param {Player} player - アクションを実行するプレイヤー
 * @param {GameState} gameState - 現在のゲーム状態
 */
function handlePoopAction(player: Player, gameState: GameState) {
	if (player.board) {
		const totalPoops = calculateTotalPoops(player.board);
		player.poops = (player.poops || 0) + totalPoops;
	}
	updatePlayerAction(player, ActionState.ROLL);
}

function calculateTotalPoops(board: Board): number {
	return Object.values(board).reduce((total, cage) => {
		return (
			total +
			cage.animals.reduce(
				(cageTotal, animal) => cageTotal + (animal.poops || 0),
				0
			)
		);
	}, 0);
}

/**
 * ROLLアクションを処理します。
 * @param {Player} player - アクションを実行するプレイヤー
 * @param {GameState} gameState - 現在のゲーム状態
 */
function handleRollAction(player: Player, gameState: GameState) {
	if (player.diceResult !== undefined) {
		updatePlayerAction(player, ActionState.TRADE);
	}
}
/**
 * TRADEアクションを処理します。
 * @param {Player} player - アクションを実行するプレイヤー
 * @param {GameState} gameState - 現在のゲーム状態
 */
function handleTradeAction(player: Player, gameState: GameState) {
	// トレードアクションの処理を実装
}

function isActionComplete(player: Player): boolean {
	switch (player.action) {
		case ActionState.INIT:
			return isInitPhaseComplete(player);
		case ActionState.POOP:
		case ActionState.FLUSH:
			return true;
		case ActionState.ROLL:
			return player.diceResult !== undefined;
		case ActionState.TRADE:
			return false; // トレードの完了条件を実装
		default:
			return false;
	}
}
/**
 * アクションが完了できるかどうかを判断します。
 * @param {GameState} gameState - 現在のゲーム状態
 * @param {string} playerId - 判定対象のプレイヤーID
 * @returns {boolean} - アクションが完了できればtrue、そうでなければfalse
 */
export function canCompleteAction(
	gameState: GameState,
	playerId: string
): boolean {
	const player = gameState.players.find((p) => p.id === playerId);
	return player ? isActionComplete(player) : false;
}
/**
 * 次のプレイヤーを取得します。
 * @param {GameState} gameState - 現在のゲーム状態
 * @returns {Player} - 次のプレイヤー
 */
export function getNextPlayer(gameState: GameState): Player {
	const currentPlayerIndex = gameState.players.findIndex(
		(player) => player.current
	);
	const nextPlayerIndex = (currentPlayerIndex + 1) % gameState.players.length;
	return gameState.players[nextPlayerIndex];
}
