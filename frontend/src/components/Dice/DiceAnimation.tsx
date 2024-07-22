// DiceAnimationComponent.tsx
import React, { useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import DiceMesh from "./DiceMesh";
import { useRecoilValue } from "recoil";
import { diceResultAtom } from "../../atoms/atoms";

type DiceProps = {
	diceResults: number[];
	onAnimationComplete: () => void;
	animationDuration?: number; // アニメーション時間（秒）
	rollingSpeed?: number; // 回転速度（1秒あたりの回転数）
};

const DiceAnimation: React.FC<DiceProps> = ({
	diceResults,
	onAnimationComplete,
	animationDuration = 4, // デフォルト値は4秒
	rollingSpeed = 2, // デフォルト値は1秒あたり2回転
}) => {
	const diceResult = useRecoilValue<number[] | null>(diceResultAtom);
	const [isAnimationComplete, setIsAnimationComplete] = useState(false);

	useEffect(() => {
		const timer = setTimeout(
			() => {
				setIsAnimationComplete(true);
				onAnimationComplete();
			},
			animationDuration * 1000 + diceResults.length * 500 // アニメーション時間 + サイコロの数 * 0.5秒
		);

		return () => clearTimeout(timer);
	}, [diceResults, onAnimationComplete, animationDuration]);

	return (
		<Canvas camera={{ position: [0, 5, 10], fov: 50 }}>
			<ambientLight intensity={2} /> {/* 環境光の強度を上げる */}
			<pointLight position={[10, 10, 10]} intensity={10} />
			{/* ポイントライトの強度を上げる ↑*/}
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
					diceResults={diceResult as number[]}
					index={index}
					isAnimationComplete={isAnimationComplete}
					animationDuration={animationDuration}
					rollingSpeed={rollingSpeed}
				/>
			))}
		</Canvas>
	);
};

export default DiceAnimation;
