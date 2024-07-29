// src/components/LoadingOverlay.tsx
import React from "react";

interface LoadingOverlayProps {
	message: string;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ message }) => {
	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
			<div className="bg-white p-4 rounded-lg shadow-lg">
				<p className="text-lg font-semibold">{message}</p>
				<div className="mt-2 animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
			</div>
		</div>
	);
};

export default LoadingOverlay;
