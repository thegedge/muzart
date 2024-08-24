import type { JSX } from "preact/compat";
import { IconBaseProps } from "react-icons";

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

export const BassHeadIcon = GiGuitarBassHead as IconType;
export const DrumIcon = GiDrumKit as IconType;
export const GuitarHeadIcon = GiGuitarHead as IconType;
export const MusicNoteIcon = HiMusicalNote as IconType;
export const MuteIcon = HiOutlineSpeakerXMark as IconType;
export const PauseIcon = HiPause as IconType;
export const PianoIcon = GiGrandPiano as IconType;
export const PlayIcon = HiPlay as IconType;
export const SoloIcon = HiPlayCircle as IconType;
export const UnmuteIcon = HiOutlineSpeakerWave as IconType;
export const UnsoloIcon = HiOutlinePlayCircle as IconType;
export const VocalistIcon = GiMusicalNotes as IconType;

export type IconType = (
  props: IconBaseProps & Omit<JSX.SVGAttributes<SVGSVGElement>, keyof IconBaseProps>,
) => JSX.Element;
