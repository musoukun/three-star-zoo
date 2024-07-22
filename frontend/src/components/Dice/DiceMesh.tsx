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
}> = ({ result, diceResults, index }) => {
	const fbx = useFBX("../../public/dice.fbx"); // パスを適切に調整してください
	const texture = useLoader(THREE.TextureLoader, diceTexture); // パスを適切に調整してください
	const mesh = fbx.children[0] as THREE.Mesh;
	const geometry = mesh.geometry;

	const [animationState, setAnimationState] = useState<"rolling" | "showing">(
		"rolling"
	);

	useEffect(() => {
		const timer = setTimeout(
			() => {
				setAnimationState("showing");
			},
			2000 + index * 500
		); // Stagger the dice stopping

		return () => clearTimeout(timer);
	}, [index]);

	const diceRotations = [
		{ x: 0, y: -0.5 * Math.PI, z: 0 },
		{ x: -0.5 * Math.PI, y: 0, z: 0 },
		{ x: 0, y: 0, z: 0 },
		{ x: 0, y: Math.PI, z: 0 },
		{ x: 0.5 * Math.PI, y: 0, z: 0 },
		{ x: 0, y: 0.5 * Math.PI, z: 0 },
	];

	return (
		<motion.mesh
			geometry={geometry}
			position={[index * 2 - (diceResults.length - 1), 0, 0]}
			scale={0.5}
			animate={animationState}
			variants={{
				rolling: {
					rotateX: [0, Math.PI * 4],
					rotateY: [0, Math.PI * 4],
					rotateZ: [0, Math.PI * 4],
					y: [0, 3, 0],
					transition: {
						duration: 2,
						repeat: Infinity,
						repeatType: "loop",
					},
				},
				showing: {
					rotateX: diceRotations[result - 1].x,
					rotateY: diceRotations[result - 1].y,
					rotateZ: diceRotations[result - 1].z,
					y: 0,
					transition: { duration: 0.5 },
				},
			}}
		>
			<meshStandardMaterial map={texture} />
		</motion.mesh>
	);
};
export default DiceMesh;
