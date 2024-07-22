import React from "react";

// Diceコンポーネント
const Dice: React.FC<{ value: number; size: number; isRolling: boolean }> = ({
	value,
	size,
}) => {
	const dotColor = value === 1 ? "red" : "black";

	const dots = [
		{ positions: [[0, 0]] }, // 1
		{
			positions: [
				[-0.5, 0.5],
				[0.5, -0.5],
			],
		}, // 2
		{
			positions: [
				[-0.5, 0.5],
				[0, 0],
				[0.5, -0.5],
			],
		}, // 3
		{
			positions: [
				[-0.5, 0.5],
				[0.5, 0.5],
				[-0.5, -0.5],
				[0.5, -0.5],
			],
		}, // 4
		{
			positions: [
				[-0.5, 0.5],
				[0.5, 0.5],
				[0, 0],
				[-0.5, -0.5],
				[0.5, -0.5],
			],
		}, // 5
		{
			positions: [
				[-0.5, 0.5],
				[0, 0.5],
				[0.5, 0.5],
				[-0.5, -0.5],
				[0, -0.5],
				[0.5, -0.5],
			],
		}, // 6
	];

	return (
		<mesh>
			<boxGeometry args={[size, size, size]} />
			<meshStandardMaterial color="white" />
			{dots[value - 1].positions.map((pos, index) => (
				<mesh
					key={index}
					position={[
						(pos[0] * size) / 2,
						(pos[1] * size) / 2,
						size / 2 + 0.01,
					]}
				>
					<circleGeometry args={[size * 0.1, 32]} />
					<meshStandardMaterial color={dotColor} />
				</mesh>
			))}
		</mesh>
	);
};
export default Dice;
