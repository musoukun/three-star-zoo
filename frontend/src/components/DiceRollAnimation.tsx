import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface DiceRollAnimationProps {
	result: number;
}

const DiceRollAnimation: React.FC<DiceRollAnimationProps> = ({ result }) => {
	const [isRolling, setIsRolling] = useState(true);
	const [displayedResult, setDisplayedResult] = useState(1);

	useEffect(() => {
		const rollDuration = 2000; // 2 seconds of rolling animation
		const interval = setInterval(() => {
			setDisplayedResult(Math.floor(Math.random() * 6) + 1);
		}, 100);

		setTimeout(() => {
			clearInterval(interval);
			setIsRolling(false);
			setDisplayedResult(result);
		}, rollDuration);

		return () => clearInterval(interval);
	}, [result]);

	return (
		<div className="flex items-center justify-center h-screen bg-gray-100">
			<motion.div
				className="w-24 h-24 bg-white rounded-lg shadow-lg flex items-center justify-center text-4xl font-bold"
				animate={
					isRolling
						? {
								rotate: [0, 360, 720, 1080],
								scale: [1, 1.2, 1, 1.2, 1],
							}
						: { rotate: 0, scale: 1 }
				}
				transition={
					isRolling
						? {
								duration: 2,
								ease: "easeInOut",
								times: [0, 0.2, 0.5, 0.8, 1],
								repeat: Infinity,
								repeatType: "loop",
							}
						: { duration: 0.5 }
				}
			>
				{displayedResult}
			</motion.div>
		</div>
	);
};

export default DiceRollAnimation;
