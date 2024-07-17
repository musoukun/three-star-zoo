import { createServer } from "http";
import { Server } from "socket.io";
import { Socket as ClientSocket } from "socket.io-client";
import Client from "socket.io-client";
import { PrismaClient } from "@prisma/client";
import { configureSocketEvents } from "../src/routes/socketEvents";
import { GameState } from "../src/types/types";
import { AddressInfo } from "net";

let io: Server, serverSocket, clientSocket: ClientSocket, prisma: PrismaClient;

beforeAll((done) => {
	const httpServer = createServer();
	io = new Server(httpServer);
	prisma = new PrismaClient();
	configureSocketEvents(io, prisma);

	httpServer.listen(() => {
		const address = httpServer.address() as AddressInfo;
		const port = address.port;
		clientSocket = Client(`http://localhost:${port}`) as ClientSocket;
		io.on("connection", (socket) => {
			serverSocket = socket;
		});
		clientSocket.on("connect", done);
	});
});

afterAll((done) => {
	io.close(() => {
		clientSocket.close();
		prisma.$disconnect();
		done();
	});
});

test("create room", (done) => {
	clientSocket.emit(
		"createRoom",
		{
			name: "Test Room",
			password: "1234",
			playerName: "Player 1",
			playerId: "1",
		},
		(response: { roomId: string }) => {
			try {
				expect(response).toHaveProperty("roomId");
				done();
			} catch (error) {
				done(error);
			}
		}
	);
}, 10000);

test("join room", (done) => {
	clientSocket.emit(
		"joinRoom",
		{
			roomId: "1",
			password: "1234",
			playerName: "Player 2",
			playerId: "2",
		},
		(response: boolean) => {
			try {
				expect(response).toBe(true);
				done();
			} catch (error) {
				done(error);
			}
		}
	);
}, 10000);

// ... 他のテストケースは変更なし ...

test("player leave", (done) => {
	clientSocket.emit(
		"leaveRoom",
		{ roomId: "1", playerId: "2" },
		(response: boolean) => {
			try {
				expect(response).toBe(true);
				done();
			} catch (error) {
				done(error);
			}
		}
	);
}, 10000);

test("start game", (done) => {
	clientSocket.emit(
		"startGame",
		{
			roomId: "1",
			playerId: "1",
			players: [
				{ id: "1", name: "Player 1" },
				{ id: "2", name: "Player 2" },
			],
		},
		(success: boolean, gameState: GameState | null) => {
			try {
				expect(success).toBe(true);
				expect(gameState).toHaveProperty("players");
				expect(gameState).toHaveProperty("currentPlayer");
				expect(gameState).toHaveProperty("phase");
				expect(gameState).toHaveProperty("roundNumber");
				done();
			} catch (error) {
				done(error);
			}
		}
	);
}, 10000);

test("cage click", (done) => {
	clientSocket.emit("cageClick", {
		roomId: "1",
		cageNumber: "cage1",
		animal: "レッサーパンダ",
		playerId: "1",
	});
	clientSocket.on("gameStateUpdate", (updatedState: GameState) => {
		try {
			expect(updatedState).toHaveProperty("players");
			expect(updatedState).toHaveProperty("currentPlayer");
			expect(updatedState).toHaveProperty("phase");
			expect(updatedState).toHaveProperty("roundNumber");
			done();
		} catch (error) {
			done(error);
		}
	});
}, 10000);

test("turn complete", (done) => {
	clientSocket.emit("actionComplete", { roomId: "1", playerId: "1" });
	clientSocket.on("gameStateUpdate", (updatedState: GameState) => {
		try {
			expect(updatedState).toHaveProperty("players");
			expect(updatedState).toHaveProperty("currentPlayer");
			expect(updatedState).toHaveProperty("phase");
			expect(updatedState).toHaveProperty("roundNumber");
			done();
		} catch (error) {
			done(error);
		}
	});
}, 10000);

test("player leave", (done) => {
	clientSocket.emit(
		"leaveRoom",
		{ roomId: "1", playerId: "2" },
		(response: boolean) => {
			try {
				expect(response).toBe(true);
				done();
			} catch (error) {
				done(error);
			}
		}
	);
}, 10000);
