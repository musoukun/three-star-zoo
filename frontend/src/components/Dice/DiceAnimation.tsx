// DiceAnimation.tsx
import React, { useEffect, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import DiceMesh from "./DiceMesh";

type DiceProps = {
	diceResults: number[];
	onAnimationComplete: () => void;
	animationDuration?: number;
	rollingSpeed?: number;
};

const DiceAnimation: React.FC<DiceProps> = ({
	diceResults,
	onAnimationComplete,
	animationDuration = 4,
	rollingSpeed = 2,
}) => {
	const timerRef = useRef<NodeJS.Timeout | null>(null);

	useEffect(() => {
		timerRef.current = setTimeout(
			() => {
				//何故かdiceResultsがnullでUpdateされる

				onAnimationComplete();
			},
			animationDuration * 1000 + diceResults.length * 500
		);

		return () => {
			if (timerRef.current) {
				clearTimeout(timerRef.current);
			}
		};
	}, []); // 依存配列は空

	return (
		<Canvas camera={{ position: [0, 5, 10], fov: 50 }}>
			<ambientLight intensity={2} />
			<pointLight position={[10, 10, 10]} intensity={10} />
			<spotLight
				position={[0, 10, 0]}
				angle={0.5}
				penumbra={1}
				intensity={1}
				castShadow
			/>
			{diceResults.map((result, index) => (
				<DiceMesh
					key={index}
					result={result}
					diceResults={diceResults as number[]}
					index={index}
					animationDuration={animationDuration}
					rollingSpeed={rollingSpeed}
				/>
			))}
		</Canvas>
	);
};

export default DiceAnimation;
