import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PlayerEffectResult } from "../types/types";
import { getAnimalImage } from "../utils/importAnimalImages";

interface EffectResultProps {
	result: PlayerEffectResult;
	onComplete: () => void;
	displayInterval: number;
	nextPlayerDelay: number;
}

const EffectResult: React.FC<EffectResultProps> = ({
	result,
	onComplete,
	displayInterval,
	nextPlayerDelay,
}) => {
	const [currentIndex, setCurrentIndex] = useState(-1);
	const totalItems = result.effects.length + 2; // プレイヤー名 + 効果 + 合計

	useEffect(() => {
		const timer = setInterval(() => {
			setCurrentIndex((prevIndex) => {
				if (prevIndex < totalItems - 1) {
					return prevIndex + 1;
				}
				clearInterval(timer);
				setTimeout(onComplete, nextPlayerDelay);
				return prevIndex;
			});
		}, displayInterval);

		return () => clearInterval(timer);
	}, [totalItems, displayInterval, nextPlayerDelay, onComplete]);

	return (
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			exit={{ opacity: 0 }}
			className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
		>
			<div className="bg-white p-4 rounded-lg shadow-lg max-w-2xl w-full">
				<AnimatePresence>
					{currentIndex >= 0 && (
						<motion.h3
							key="player-name"
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							className="text-xl font-semibold mb-4"
						>
							{result.playerName}
						</motion.h3>
					)}
					{result.effects.map(
						(effect, index) =>
							currentIndex >= index + 1 && (
								<motion.div
									key={`effect-${index}`}
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									className="flex items-center mt-2"
								>
									<img
										src={getAnimalImage(effect.animalId)}
										alt={effect.animalId}
										className="w-8 h-8 mr-2"
									/>
									<span>{effect.description}</span>
								</motion.div>
							)
					)}
					{currentIndex >= totalItems - 1 && (
						<motion.div
							key="total"
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							className="mt-4 border-t pt-2"
						>
							<p className="font-bold">合計:</p>
							<p>
								コイン: {result.finalCoins} (
								{result.coinDifference > 0 ? "+" : ""}
								{result.coinDifference})
							</p>
							<p>
								スター: {result.finalStars} (
								{result.starDifference > 0 ? "+" : ""}
								{result.starDifference})
							</p>
						</motion.div>
					)}
				</AnimatePresence>
			</div>
		</motion.div>
	);
};

export default EffectResult;
