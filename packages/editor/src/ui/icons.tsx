import type { JSX, SVGAttributes } from "react";
import type { IconBaseProps } from "react-icons";

import {
  HiMusicalNote,
  HiOutlinePlayCircle,
  HiOutlineSpeakerWave,
  HiOutlineSpeakerXMark,
  HiPause,
  HiPlay,
  HiPlayCircle,
} from "react-icons/hi2";

import { GiDrumKit, GiGrandPiano, GiGuitarBassHead, GiGuitarHead, GiMusicalNotes } from "react-icons/gi";

export const BassHeadIcon = GiGuitarBassHead;
export const DrumIcon = GiDrumKit;
export const GuitarHeadIcon = GiGuitarHead;
export const MusicNoteIcon = HiMusicalNote;
export const MuteIcon = HiOutlineSpeakerXMark;
export const PauseIcon = HiPause;
export const PianoIcon = GiGrandPiano;
export const PlayIcon = HiPlay;
export const SoloIcon = HiPlayCircle;
export const UnmuteIcon = HiOutlineSpeakerWave;
export const UnsoloIcon = HiOutlinePlayCircle;
export const VocalistIcon = GiMusicalNotes;

export type IconType = (props: IconBaseProps & Omit<SVGAttributes<SVGSVGElement>, keyof IconBaseProps>) => JSX.Element;
