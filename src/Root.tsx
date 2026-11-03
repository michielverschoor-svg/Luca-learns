import React from 'react';
import {Composition, getStaticFiles} from 'remotion';
import {CharacterSheet} from './CharacterSheet';
import {Episode, episodeFrames} from './Episode';
import type {Episode as EpisodeData, EpisodeProps} from './types';
import ep01 from '../episodes/ep01-sit.json';

const defaultProps: EpisodeProps = {
  episode: ep01 as EpisodeData,
  audio: {},
  audioDurations: {},
};

/** In the Studio, pick up any clips already sitting in audio/<episode>/. */
const discoverAudio = (episode: EpisodeData): Record<string, string> => {
  const found: Record<string, string> = {};
  try {
    for (const file of getStaticFiles()) {
      const m = new RegExp(`^${episode.id}/([^/]+)\\.mp3$`).exec(file.name);
      if (m) found[m[1]] = file.name;
    }
  } catch {
    // getStaticFiles is not available in every environment; render silent.
  }
  return found;
};

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="Episode"
      component={Episode}
      defaultProps={defaultProps}
      fps={30}
      width={1920}
      height={1080}
      durationInFrames={300}
      calculateMetadata={({props}) => {
        const audio = Object.keys(props.audio).length > 0 ? props.audio : discoverAudio(props.episode);
        const [width, height] = props.episode.resolution ?? [1920, 1080];
        return {
          durationInFrames: episodeFrames(props.episode, props.audioDurations),
          fps: props.episode.fps,
          width,
          height,
          props: {...props, audio},
        };
      }}
    />
    <Composition
      id="CharacterSheet"
      component={CharacterSheet}
      durationInFrames={90}
      fps={30}
      width={1920}
      height={1080}
    />
  </>
);
