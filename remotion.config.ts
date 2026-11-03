import {Config} from '@remotion/cli/config';

// Voiceover clips live in audio/<episode>/<sceneId>.mp3 and are served as static files.
Config.setPublicDir('./audio');
Config.setVideoImageFormat('jpeg');
Config.setOverwriteOutput(true);
