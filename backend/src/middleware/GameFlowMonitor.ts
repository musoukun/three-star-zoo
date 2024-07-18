import { Board, GameState, Player } from "../types/types";
import { ActionState } from "../types/ActionState";

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

function handleInitPhase(gameState: GameState) {
	const currentPlayer = gameState.players.find((player) => player.current);
	if (currentPlayer) {
		// プレイヤーの初期配置が完了したかチェック
		if (isPlayerActionComplete(currentPlayer)) {
			currentPlayer.action = ActionState.POOP;
			// 現在のプレイヤーのcurrentをfalseに設定
			currentPlayer.current = false;

			// 次のプレイヤーに移動
			//プレイヤーが1人の場合、gameState.players.indexOf(currentPlayer) + 1 の結果は1になります。
			// そして、1 % 1 は0になります。したがって、次のプレイヤーのインデックスは0となり
			// これは唯一のプレイヤーのインデックスと一致します。
			// したがって、このコードはプレイヤーが1人でも正しく機能します。
			const nextPlayerIndex =
				(gameState.players.indexOf(currentPlayer) + 1) %
				gameState.players.length;
			const nextPlayer = gameState.players[nextPlayerIndex];
			// 次のプレイヤーのcurrentをtrueに設定
			nextPlayer.current = true;
		}
	}

	// 全プレイヤーの初期配置が完了したかチェック
	const allPlayersPlacedAnimals = gameState.players.every(
		(player) => player.action === ActionState.POOP
	);

	if (allPlayersPlacedAnimals) {
		// 全プレイヤーの初期配置が完了したらMAINフェーズに移行
		gameState.phase = "main";
		// 先攻プレイヤーを設定
		const startPlayer =
			gameState.players.find((player) => player.startPlayer) ||
			gameState.players[0];
		startPlayer.current = true;

		// 現在のプレイヤーのPOOPアクションを処理
		handlePoopAction(startPlayer);
		startPlayer.action = ActionState.ROLL;
	}
}

function handleMainPhase(gameState: GameState) {
	const currentPlayer = gameState.players.find((player) => player.current);
	if (currentPlayer) {
		switch (currentPlayer.action) {
			case ActionState.POOP:
				handlePoopAction(currentPlayer);
				currentPlayer.action = ActionState.ROLL;
				break;
			case ActionState.ROLL:
				// ダイスロールの結果に基づいて処理
				if (currentPlayer.diceResult !== undefined) {
					currentPlayer.action = ActionState.TRADE;
				}
				break;
			// 他のアクションの処理をここに追加
			default:
				break;
		}

		// プレイヤーのアクションが完了したかチェック
		if (isPlayerActionComplete(currentPlayer)) {
			moveToNextPlayer(gameState);
		}
	}
}

function handlePoopAction(player: Player) {
	if (player.board) {
		const totalPoops = calculateTotalPoops(player.board);
		player.poops = (player.poops || 0) + totalPoops;
	}
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

function moveToNextPlayer(gameState: GameState) {
	const currentPlayerIndex = gameState.players.findIndex(
		(player) => player.current
	);
	gameState.players[currentPlayerIndex].current = false;
	const nextPlayerIndex = (currentPlayerIndex + 1) % gameState.players.length;
	gameState.players[nextPlayerIndex].current = true;
	gameState.players[nextPlayerIndex].action = ActionState.POOP;
}

function isPlayerActionComplete(player: Player): boolean {
	switch (player.action) {
		case ActionState.INIT:
			return isInitPhaseComplete(player);
		case ActionState.FLUSH:
		case ActionState.ROLL:
			return true;
		default:
			return false;
	}
}

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

function handleEndPhase(gameState: GameState) {
	// エンドフェーズのロジックを実装
}

export function canCompleteAction(
	gameState: GameState,
	playerId: string
): boolean {
	const player = gameState.players.find((p) => p.id === playerId);
	if (!player) return false;

	return isPlayerActionComplete(player);
}

export function getNextPlayer(gameState: GameState): Player {
	const currentPlayerIndex = gameState.players.findIndex(
		(player) => player.current
	);
	const nextPlayerIndex = (currentPlayerIndex + 1) % gameState.players.length;
	return gameState.players[nextPlayerIndex];
}
