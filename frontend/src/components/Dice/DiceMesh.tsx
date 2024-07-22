import React, { useState, useEffect } from "react";
import { motion } from "framer-motion-3d";
import * as THREE from "three";
import { useLoader } from "@react-three/fiber";
import { useFBX } from "@react-three/drei";
import diceTexture from "@assets/dice.png";

const DiceMesh: React.FC<{
	result: number;
	diceResults: number[];
	index: number;
	isAnimationComplete: boolean;
	animationDuration: number;
	rollingSpeed: number;
}> = ({
	result,
	diceResults,
	index,
	isAnimationComplete,
	animationDuration,
	rollingSpeed,
}) => {
	const fbx = useFBX("../../public/dice.fbx");
	const texture = useLoader(THREE.TextureLoader, diceTexture);
	const mesh = fbx.children[0] as THREE.Mesh;
	const geometry = mesh.geometry;

	const [animationState, setAnimationState] = useState<"rolling" | "showing">(
		"rolling"
	);

	useEffect(() => {
		if (isAnimationComplete) {
			setAnimationState("showing");
		}
	}, [isAnimationComplete]);

	const diceRotations = [
		{ x: 0, y: -0.5 * Math.PI, z: 0 },
		{ x: -0.5 * Math.PI, y: 0, z: 0 },
		{ x: 0, y: 0, z: 0 },
		{ x: 0, y: Math.PI, z: 0 },
		{ x: 0.5 * Math.PI, y: 0, z: 0 },
		{ x: 0, y: 0.5 * Math.PI, z: 0 },
	];

	const totalRotations = Math.PI * 4 * rollingSpeed;

	return (
		<motion.mesh
			geometry={geometry}
			position={[index * 2 - (diceResults.length - 1), 0, 0]}
			scale={0.5}
			animate={animationState}
			variants={{
				rolling: {
					rotateX: [0, totalRotations, diceRotations[result - 1].x],
					rotateY: [0, totalRotations, diceRotations[result - 1].y],
					rotateZ: [0, totalRotations, diceRotations[result - 1].z],
					y: [0, 3, 0],
					transition: {
						duration: animationDuration, // アニメーション時間
						times: [0, 0.4, 1],
						ease: ["easeIn", "easeOut"],
					},
				},
				showing: {
					// サイコロの目を表示するアニメーション
					rotateX: diceRotations[result - 1].x,
					rotateY: diceRotations[result - 1].y,
					rotateZ: diceRotations[result - 1].z,
					y: 0,
					transition: { duration: 0.5 },
				},
			}}
		>
			<meshStandardMaterial
				map={texture} // テクスチャを適用
				emissive={new THREE.Color(0x000000)} // 発光色
				emissiveIntensity={0.2} // 発光強度
				metalness={2} // 金属感
				roughness={1} // 粗さ
				lightMapIntensity={1} // ライトマップの強度
				aoMapIntensity={1} // 環境光遮蔽マップの強度
				envMapIntensity={1} // 環境マップの強度
				displacementScale={1} // 変位スケール
			/>
		</motion.mesh>
	);
};

export default DiceMesh;
