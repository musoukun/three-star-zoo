// DiceMesh.tsx
import React from "react";
import { motion } from "framer-motion-3d";
import * as THREE from "three";
import { useLoader } from "@react-three/fiber";
import { useFBX } from "@react-three/drei";
import diceTexture from "@assets/dice.png";

const DiceMesh: React.FC<{
	result: number;
	diceResults: number[];
	index: number;
	animationDuration: number;
	rollingSpeed: number;
}> = ({ result, diceResults, index, animationDuration, rollingSpeed }) => {
	const fbx = useFBX("../../public/dice.fbx");
	const texture = useLoader(THREE.TextureLoader, diceTexture);
	const mesh = fbx.children[0] as THREE.Mesh;
	const geometry = mesh.geometry;

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
			animate={{
				rotateX: [0, totalRotations, diceRotations[result - 1].x],
				rotateY: [0, totalRotations, diceRotations[result - 1].y],
				rotateZ: [0, totalRotations, diceRotations[result - 1].z],
				y: [0, 3, 0],
			}}
			transition={{
				duration: animationDuration,
				times: [0, 0.4, 1],
				ease: ["easeIn", "easeOut"],
			}}
		>
			<meshStandardMaterial
				map={texture}
				emissive={new THREE.Color(0x000000)}
				emissiveIntensity={0.2}
				metalness={2}
				roughness={1}
				lightMapIntensity={1}
				aoMapIntensity={1}
				envMapIntensity={1}
				displacementScale={1}
			/>
		</motion.mesh>
	);
};

export default DiceMesh;
