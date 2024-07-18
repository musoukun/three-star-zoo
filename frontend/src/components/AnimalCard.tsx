import { AnimalCard as AnimalCardType } from "../types/types";

interface AnimalCardProps {
	animalCard: AnimalCardType;
}

function AnimalCard({ animalCard }: AnimalCardProps) {
	if (!animalCard) {
		return null; // または適切なエラー表示
	}

	return (
		<div
			className={`w-[180px] h-[280px] border-2 border-gray-300 rounded-lg overflow-hidden ${animalCard.color || "bg-white"} m-2`}
		>
			<div className="h-1/2 bg-white p-2">
				<img
					src={animalCard.image}
					alt={`Illustration of ${animalCard.name}`}
					className="w-full h-full object-cover rounded"
				/>
			</div>

			<div className="h-1/6 bg-white flex items-center justify-between px-2">
				<span className="text-xl font-bold">{animalCard.id}</span>
				<span className="text-lg font-semibold">{animalCard.name}</span>
			</div>

			<div className="h-1/3 bg-gray-100 p-2">
				<div className="w-full h-full bg-white rounded p-1 text-xs">
					{animalCard.stats.map((stat, index) => (
						<div
							key={`${animalCard.name}-stat-${index}`}
							className="flex justify-between"
						>
							<span>{stat.label}</span>
							<span className="flex">
								{[...Array(stat.value)].map(
									(_, circleIndex) => (
										<i
											key={`${animalCard.name}-stat-${index}-circle-${circleIndex}`}
											className="fas fa-circle text-yellow-500 mr-1"
										></i>
									)
								)}
							</span>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}

export default AnimalCard;
