import React, { useEffect, useState } from "react";

interface ActionPhaseNotifierProps {
	text: string;
	backgroundColor?: string;
	textColor?: string;
	isBold?: boolean;
	isItalic?: boolean;
	opacity?: number;
	speed?: number;
	fontSize?: string;
	fontFamily?: string;
	duration?: number;
	onAnimationComplete?: () => void;
}

export const ActionPhaseNotifier: React.FC<ActionPhaseNotifierProps> = ({
	text,
	backgroundColor = "rgba(0, 0, 0, 0.7)",
	textColor = "white",
	isBold = true,
	isItalic = false,
	opacity = 0.7,
	speed = 1,
	fontSize = "1rem",
	fontFamily = "Arial",
	duration = 5,
	onAnimationComplete,
}) => {
	const [animationState, setAnimationState] = useState<
		"entering" | "stable" | "exiting" | "hidden"
	>("entering");

	useEffect(() => {
		const enterTimer = setTimeout(
			() => setAnimationState("stable"),
			speed * 1000
		);
		const stableTimer = setTimeout(
			() => setAnimationState("exiting"),
			(duration + speed) * 1000
		);
		const exitTimer = setTimeout(
			() => {
				setAnimationState("hidden");
				if (onAnimationComplete) {
					onAnimationComplete(); // アニメーション完了時に関数を呼び出す
				}
			},
			(duration + 2 * speed) * 1000
		);

		return () => {
			clearTimeout(enterTimer);
			clearTimeout(stableTimer);
			clearTimeout(exitTimer);
		};
	}, [duration, speed]);

	if (animationState === "hidden") return null;

	return (
		<div className="fixed inset-0 flex items-center justify-center pointer-events-none z-50">
			<div
				className={`w-full py-4 ${isBold ? "font-bold" : "font-normal"} ${isItalic ? "italic" : ""}`}
				style={{
					backgroundColor,
					opacity,
					transform:
						animationState === "entering"
							? "translateX(100%)"
							: animationState === "exiting"
								? "translateX(-100%)"
								: "translateX(0)",
					transition: `transform ${speed}s ease-in-out`,
				}}
			>
				<div
					className="text-center whitespace-nowrap"
					style={{
						color: textColor,
						fontSize,
						fontFamily,
					}}
				>
					{text}
				</div>
			</div>
		</div>
	);
};

export default ActionPhaseNotifier;
