// src/App.tsx
import React, { useState, useEffect } from "react";
import { io, Socket } from "socket.io-client";
import Lobby from "./components/Lobby";
import Room from "./components/Room";

const App: React.FC = () => {
	const [socket, setSocket] = useState<Socket | null>(null);
	const [currentView, setCurrentView] = useState<"lobby" | "room" | "game">(
		"lobby"
	);
	const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);

	useEffect(() => {
		const savedView = localStorage.getItem("currentView");
		const savedRoomId = localStorage.getItem("currentRoomId");
		if (savedView) {
			setCurrentView(savedView as "lobby" | "room" | "game");
		}
		if (savedRoomId) {
			setCurrentRoomId(savedRoomId);
		}

		const newSocket = io("http://localhost:5000");
		setSocket(newSocket);

		return () => {
			newSocket.close();
		};
	}, []);

	useEffect(() => {
		localStorage.setItem("currentView", currentView);
		localStorage.setItem("currentRoomId", currentRoomId as string);
	}, [currentView, currentRoomId]);

	const handleLeaveRoom = () => {
		setCurrentRoomId(null);
		setCurrentView("lobby");
	};

	return (
		<div className="min-h-screen bg-gray-100">
			{currentView === "lobby" ? (
				<Lobby
					socket={socket}
					setCurrentRoomId={setCurrentRoomId}
					setCurrentView={setCurrentView}
				/>
			) : (
				<Room
					socket={socket}
					roomId={currentRoomId as string}
					onLeaveRoom={handleLeaveRoom}
				/>
			)}
		</div>
	);
};

export default App;
