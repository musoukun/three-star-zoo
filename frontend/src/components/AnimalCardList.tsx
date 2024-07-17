import React from "react";
import AnimalCard from "./AnimalCard";
import animalCardsMock from "./animalCardsMock";
import { AnimalCard as AnimalCardType } from "../types/types";

interface AnimalCardListProps {
	AnimalCards: AnimalCardType[];
}
const AnimalCardList: React.FC<AnimalCardListProps> = () => {
	return (
		<div className="flex flex-wrap justify-center gap-4 p-4 bg-gray-100">
			{animalCardsMock.map((animal: AnimalCardType) => (
				<AnimalCard
					key={`${animal.id}-${animal.name}`}
					animalCard={animal}
				/>
			))}
		</div>
	);
};

export default AnimalCardList;
