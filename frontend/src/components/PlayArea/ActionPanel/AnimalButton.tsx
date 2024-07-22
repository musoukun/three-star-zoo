import React from "react";
import { Animal } from "../../../types/types";

interface AnimalButtonProps {
	animal: Animal;
	selectedAnimal: string | null;
	placedAnimals: { [key: string]: number };
	handleAnimalSelect: (animal: string) => void;
}

const AnimalButton: React.FC<AnimalButtonProps> = ({
	animal,
	selectedAnimal,
	placedAnimals,
	handleAnimalSelect,
}) => (
	<button
		className={`w-full mb-2 py-2 px-4 rounded ${
			selectedAnimal === animal.id
				? "bg-blue-500 text-white"
				: "bg-gray-200"
		}`}
		onClick={() => handleAnimalSelect(animal.id)}
		disabled={placedAnimals[animal.id] > 0}
	>
		{animal.name}
	</button>
);

export default AnimalButton;
