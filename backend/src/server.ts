import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import { PrismaClient, Room } from "@prisma/client";

import { corsOptions } from "./config";

import { GameRoom } from "./types/types";
import { SocketEventHandler } from "./routes/SocketEvents";
import { RoomRepository } from "./repository/RoomRepository";

const prisma = new PrismaClient();
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: corsOptions });
// ソケットイベントハンドラーを初期化
const socketEventHandler = new SocketEventHandler(io, prisma);
socketEventHandler.setupSocketConnections();

app.use(cors(corsOptions));

app.get("/api/rooms", async (req, res) => {
	try {
		const roomRepo = new RoomRepository(prisma);
		const roomList: Room[] = await roomRepo.getRoomList();
		res.json(roomList);
	} catch (error) {
		console.error("Failed to fetch rooms:", error);
		res.status(500).json({ error: "Failed to fetch rooms" });
	}
});

async function main() {
	try {
		const PORT = process.env.PORT || 5000;
		server.listen(PORT, () => {
			console.log(`Server is running on port ${PORT}`);
		});
	} catch (error) {
		console.error("Failed to start server:", error);
		process.exit(1);
	}
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});

export { prisma, io };
