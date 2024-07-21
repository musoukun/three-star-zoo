import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface DiceRollAnimationProps {
	result: number[];
	onAnimationComplete: () => void;
}

const DiceRollAnimation: React.FC<DiceRollAnimationProps> = ({
	result,
	onAnimationComplete,
}) => {
	const [isRolling, setIsRolling] = useState(true);
	const [displayedResults, setDisplayedResults] = useState<number[]>([]);

	useEffect(() => {
		const rollDuration = 2000;
		const timer = setTimeout(() => {
			setIsRolling(false);
			setDisplayedResults(result);
			onAnimationComplete();
		}, rollDuration);

		return () => clearTimeout(timer);
	}, [result, onAnimationComplete]);

	return (
		<div className="flex items-center justify-center h-screen bg-gray-100">
			{displayedResults.map((dice, index) => (
				<motion.div
					key={index}
					className="w-24 h-24 bg-white rounded-lg shadow-lg flex items-center justify-center text-4xl font-bold mx-2"
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
					{dice}
				</motion.div>
			))}
		</div>
	);
};

export default DiceRollAnimation;
