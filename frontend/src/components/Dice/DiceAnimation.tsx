import React, { useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import DiceMesh from "./DiceMesh";
import { useRecoilValue } from "recoil";
import { diceResultAtom } from "../../atoms/atoms";

type DiceProps = {
	diceResults: number[];
	onAnimationComplete: () => void;
};
const DiceAnimationComponent: React.FC<DiceProps> = ({
	diceResults,
	onAnimationComplete,
}) => {
	const diceResult = useRecoilValue<number[] | null>(diceResultAtom);
	useEffect(() => {
		const timer = setTimeout(
			() => {
				onAnimationComplete();
			},
			2000 + diceResults.length * 500
		); // Wait for all dice to stop

		return () => clearTimeout(timer);
	}, [diceResults, onAnimationComplete]);

	return (
		<Canvas camera={{ position: [0, 5, 10], fov: 50 }}>
			<ambientLight intensity={0.5} />
			<pointLight position={[10, 10, 10]} />
			{diceResults.map((result, index) => (
				<DiceMesh
					key={index}
					result={result}
					diceResults={diceResult as number[]}
					index={index}
				/>
			))}
		</Canvas>
	);
};

export default DiceAnimationComponent;
