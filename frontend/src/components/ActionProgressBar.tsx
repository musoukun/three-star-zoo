import React from "react";
import { ActionState } from "../types/ActionState";
import { useGameState } from "../hooks/useGameState";

const ActionProgressBar: React.FC = () => {
	const { myPlayerAction } = useGameState();

	const currentAction: ActionState = myPlayerAction as ActionState;

	const actions = [
		{ key: "poop", icon: "💩", label: "うんちをもらう" },
		{ key: "roll", icon: "🎲", label: "サイコロをなげる" },
		{ key: "income", icon: "💰", label: "収入を得る" },
		{ key: "trade", icon: "🔄", label: "動物を買う/星を買う" },
		{ key: "flush", icon: "🧹", label: "うんちを掃除する" },
	];

	return (
		<div className="w-3/5fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-200 ">
			<div className="flex justify-between items-center max-w-screen-xl mx-auto">
				{actions.map((action, index) => (
					<React.Fragment key={action.key}>
						<div
							className={`flex flex-col items-center ${currentAction === action.key ? "text-blue-600 font-bold" : "text-gray-400"}`}
						>
							<span className="text-2xl">{action.icon}</span>
							<span className="text-xs whitespace-nowrap">
								{action.label}
							</span>
						</div>
						{index < actions.length - 1 && (
							<div className="flex-grow mx-2">
								<div
									className={`h-0.5 ${currentAction === action.key ? "bg-blue-600" : "bg-gray-300"}`}
								></div>
							</div>
						)}
					</React.Fragment>
				))}
			</div>
		</div>
	);
};

export default ActionProgressBar;
