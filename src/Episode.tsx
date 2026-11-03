import React from 'react';
import {AbsoluteFill, Html5Audio, Series, staticFile} from 'remotion';
import {StoryScene} from './scenes/StoryScene';
import {StepCard} from './scenes/StepCard';
import {TipCard} from './scenes/TipCard';
import {isStepCard, isTipCard, type Episode as EpisodeData, type EpisodeProps, type Scene} from './types';
import './fonts';

/** Scene length in frames: the scripted duration, stretched if its voiceover clip runs longer. */
export const sceneFrames = (scene: Scene, fps: number, audioSec?: number) => {
  const scripted = scene.durationSec;
  const needed = audioSec ? audioSec + 0.4 : 0;
  return Math.max(1, Math.round(Math.max(scripted, needed) * fps));
};

export const episodeFrames = (episode: EpisodeData, audioDurations: Record<string, number>) =>
  episode.scenes.reduce((sum, s) => sum + sceneFrames(s, episode.fps, audioDurations[s.id]), 0);

const episodeLabel = (episode: EpisodeData) => {
  const n = /(\d+)/.exec(episode.id);
  return n ? `Luca Learns · Episode ${parseInt(n[1], 10)}` : 'Luca Learns';
};

export const Episode: React.FC<EpisodeProps> = ({episode, audio, audioDurations, sfx}) => (
  <AbsoluteFill style={{backgroundColor: '#F6EEDC'}}>
    <Series>
      {episode.scenes.map((scene) => (
        <Series.Sequence
          key={scene.id}
          name={scene.id}
          durationInFrames={sceneFrames(scene, episode.fps, audioDurations[scene.id])}
        >
          {isTipCard(scene) ? (
            <TipCard scene={scene} episodeLabel={episodeLabel(episode)} />
          ) : isStepCard(scene) ? (
            <StepCard scene={scene} />
          ) : (
            <StoryScene scene={scene} sfx={sfx ?? {}} />
          )}
          {audio[scene.id] ? <Html5Audio src={staticFile(audio[scene.id])} /> : null}
        </Series.Sequence>
      ))}
    </Series>
  </AbsoluteFill>
);
