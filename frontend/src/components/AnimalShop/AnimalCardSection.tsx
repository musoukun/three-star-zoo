import React from "react";
import { AnimalCard as AnimalCardType } from "../../types/types";

interface AnimalCardProps {
	animal: AnimalCardType;
}

const AnimalCard: React.FC<AnimalCardProps> = ({ animal }) => (
	<div className="w-1/5 p-1">
		<div className="bg-white rounded-lg shadow-md p-2 h-full flex flex-col justify-between">
			<img
				src={animal.image}
				alt={animal.name}
				className="w-full h-24 object-cover rounded-t-lg"
			/>
			<div className="mt-2">
				<h3 className="text-sm font-semibold">{animal.name}</h3>
				<p className="text-xs">Cost: {animal.cost}</p>
			</div>
		</div>
	</div>
);

const AnimalCardList: React.FC<{ AnimalCards: AnimalCardType[] }> = ({
	AnimalCards,
}) => (
	<div className="flex flex-wrap -mx-1">
		{AnimalCards.map((animal) => (
			<AnimalCard key={animal.id} animal={animal} />
		))}
	</div>
);

const AnimalCardsSection: React.FC<{ animalCards: AnimalCardType[] }> = ({
	animalCards,
}) => (
	<div className="h-full overflow-y-auto p-2">
		<h2 className="text-lg font-bold mb-2">動物カード</h2>
		<AnimalCardList AnimalCards={animalCards} />
	</div>
);

export default AnimalCardsSection;
