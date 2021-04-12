import React, { createContext, useContext, useMemo } from "react";
import { PlaybackController } from "../../../playback/PlaybackController";

const Context = createContext(new PlaybackController());

export function usePlayback() {
  return useContext(Context);
}

export function PlaybackContext(props: { children?: React.ReactNode }) {
  const playback = useMemo(() => new PlaybackController(), []);
  return <Context.Provider value={playback}>{props.children}</Context.Provider>;
}
