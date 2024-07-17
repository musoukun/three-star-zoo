import AfricanElephant from "../assets/AfricanElephant.png";
import BottlenoseDolphin from "../assets/BottlenoseDolphin.png";
import CaliforniaSeaLion from "../assets/CaliforniaSeaLion.png";
import Cheetah from "../assets/Cheetah.png";
import GiantPanda from "../assets/GiantPanda.png";
import Lion from "../assets/Lion.png";
import Penguin from "../assets/Penguin.png";
import RessaPanda from "../assets/RessaPanda.png";
import ReticulatedGiraffe from "../assets/ReticulatedGiraffe.png";
import RosyFacedLovebird from "../assets/RosyFacedLovebird.png";
import SouthernWhiteRhino from "../assets/SouthernWhiteRhino.png";

export const animalImages = {
	AfricanElephant,
	BottlenoseDolphin,
	CaliforniaSeaLion,
	Cheetah,
	GiantPanda,
	Lion,
	Penguin,
	RessaPanda,
	ReticulatedGiraffe,
	RosyFacedLovebird,
	SouthernWhiteRhino,
};

export function getAnimalImage(animalId: string): string {
	return animalImages[animalId as keyof typeof animalImages] || "";
}
