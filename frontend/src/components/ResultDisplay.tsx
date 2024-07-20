import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getAnimalImage } from "../utils/importAnimalImages";
import { ResultPoops } from "../types/types";

interface ResultDisplayProps {
	results: ResultPoops[];
	duration?: number; // 表示時間（ミリ秒）
	onClose: () => void;
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({
	results,
	duration,
	onClose,
}) => {
	const [isVisible, setIsVisible] = useState(true);

	useEffect(() => {
		if (duration) {
			const timer = setTimeout(() => {
				setIsVisible(false);
				onClose();
			}, duration);
			return () => clearTimeout(timer);
		}
	}, [duration, onClose]);

	const handleClick = () => {
		if (!duration) {
			setIsVisible(false);
			onClose();
		}
	};

	const totalPoop = results.reduce((sum, item) => sum + item.subtotal, 0);

	// 	initial：アニメーションの初期状態を定義します。
	// 	ここでは、要素の不透明度を0（完全に透明）にし、スケールを0.8（元のサイズの80%）に設定しています。

	// animate：アニメーションの最終状態を定義します。
	// ここでは、要素の不透明度を1（完全に不透明）にし、スケールを1（元のサイズ）に設定しています。

	// exit：要素がアンマウントされるときのアニメーション状態を定義します。
	// ここでは、要素の不透明度を0に戻し、スケールを再び0.8に設定しています。

	// transition：アニメーションの遷移を定義します。
	// ここでは、アニメーションの持続時間を0.3秒に設定しています。
	// これらのプロパティを組み合わせることで、要素が表示されるとき、
	// 表示されている間、そして消えるときのアニメーションを制御できます。

	return (
		<AnimatePresence>
			{isVisible && (
				<motion.div
					initial={{ opacity: 0, scale: 0.8 }}
					animate={{ opacity: 1, scale: 1 }}
					exit={{ opacity: 0, scale: 0.8 }}
					transition={{ duration: 0.3 }}
					className="fixed inset-0 flex items-center justify-center z-50"
					onClick={handleClick}
				>
					<div className="bg-[#e6f3d9] border-4 border-[#8b4513] p-6 rounded-lg max-w-md w-full">
						<div className="space-y-2">
							{results.map((item, index) => (
								<div
									key={index}
									className="flex items-center justify-between"
								>
									<div className="flex items-center">
										<div className="w-8 h-8 mr-2">
											<img
												src={getAnimalImage(
													item.animalId
												)}
												alt={item.animalId}
												className="w-full h-full object-cover rounded-full"
											/>
										</div>
										<span>{item.animalCount}</span>
									</div>
									<span>×</span>
									<span>
										{item.poopIcon}
										{item.poopCost}
									</span>
									<span>=</span>
									<span>
										{item.poopIcon}
										{item.subtotal}
									</span>
								</div>
							))}
							<div className="border-t border-[#8b4513] mt-2 pt-2">
								<div className="flex items-center justify-between font-bold">
									<span>合計:</span>
									<span>
										{results[0].poopIcon}
										{totalPoop}個
									</span>
								</div>
							</div>
						</div>
					</div>
				</motion.div>
			)}
		</AnimatePresence>
	);
};

export default ResultDisplay;
