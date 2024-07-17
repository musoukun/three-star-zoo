import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import { configureSocketEvents } from "./routes/socketEvents";
import { corsOptions } from "./config";
import { getRoomList } from "./repository/roomRepository";

const prisma = new PrismaClient();
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: corsOptions });

app.use(cors(corsOptions));

app.get("/api/rooms", async (req, res) => {
	try {
		const roomList = await getRoomList(prisma);
		res.json(roomList);
	} catch (error) {
		console.error("Failed to fetch rooms:", error);
		res.status(500).json({ error: "Failed to fetch rooms" });
	}
});

configureSocketEvents(io, prisma);

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
