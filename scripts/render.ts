/**
 * Render one episode to MP4.
 *
 *   npm run render -- ep01
 *   npm run render -- ep01 --frames=0-299      (render part of it)
 *   npm run render -- ep01 --concurrency=4
 *
 * Voiceover: if audio/<episode>/<sceneId>.mp3 exists it is played during that
 * scene; otherwise the scene is silent. No external API is called.
 *
 * Set REMOTION_BROWSER_EXECUTABLE to use an already installed Chrome or
 * chrome-headless-shell instead of letting Remotion download one.
 */
import fs from 'node:fs';
import path from 'node:path';
import {bundle} from '@remotion/bundler';
import {renderMedia, selectComposition} from '@remotion/renderer';
import {parseMedia} from '@remotion/media-parser';
import {nodeReader} from '@remotion/media-parser/node';
import type {Episode, EpisodeProps} from '../src/types';

const root = path.resolve(__dirname, '..');

const fail = (msg: string): never => {
  console.error(`\n  ${msg}\n`);
  process.exit(1);
};

const args = process.argv.slice(2);
const episodeArg = args.find((a) => !a.startsWith('--'));
const flag = (name: string) => args.find((a) => a.startsWith(`--${name}=`))?.split('=')[1];

if (!episodeArg) fail('Usage: npm run render -- <episode>   (for example: npm run render -- ep01)');

const findEpisodeFile = (id: string): string => {
  const dir = path.join(root, 'episodes');
  const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith('.json')) : [];
  const match =
    files.find((f) => f === `${id}.json` || f === id) ?? files.find((f) => f.startsWith(`${id}-`));
  if (!match) {
    return fail(`No episode file for "${id}" in episodes/. Found: ${files.join(', ') || 'nothing'}`);
  }
  return path.join(dir, match);
};

const main = async () => {
  const episodeFile = findEpisodeFile(episodeArg!.replace(/\.json$/, ''));
  const episode = JSON.parse(fs.readFileSync(episodeFile, 'utf8')) as Episode;
  console.log(`Episode ${episode.id}: ${episode.title} (${path.relative(root, episodeFile)})`);

  // Voiceover clips.
  const audioDir = path.join(root, 'audio');
  fs.mkdirSync(path.join(audioDir, episode.id), {recursive: true});
  const audio: Record<string, string> = {};
  const audioDurations: Record<string, number> = {};
  for (const scene of episode.scenes) {
    const rel = `${episode.id}/${scene.id}.mp3`;
    const file = path.join(audioDir, rel);
    if (!fs.existsSync(file)) continue;
    audio[scene.id] = rel;
    try {
      const {slowDurationInSeconds} = await parseMedia({
        src: file,
        reader: nodeReader,
        fields: {slowDurationInSeconds: true},
        acknowledgeRemotionLicense: true,
      });
      audioDurations[scene.id] = slowDurationInSeconds;
    } catch (err) {
      console.warn(`  Could not read the length of ${rel}; using the scripted scene length.`, err);
    }
  }
  const withAudio = Object.keys(audio);
  console.log(
    withAudio.length
      ? `Voiceover found for: ${withAudio.join(', ')}`
      : `No voiceover clips in audio/${episode.id}/, rendering silent with subtitles.`,
  );

  const inputProps: EpisodeProps = {episode, audio, audioDurations};
  const browserExecutable = process.env.REMOTION_BROWSER_EXECUTABLE || null;

  console.log('Bundling...');
  const serveUrl = await bundle({
    entryPoint: path.join(root, 'src', 'index.ts'),
    publicDir: audioDir,
  });

  const composition = await selectComposition({
    serveUrl,
    id: 'Episode',
    inputProps,
    browserExecutable,
  });

  const framesFlag = flag('frames');
  const frameRange = framesFlag
    ? (framesFlag.split('-').map((n) => parseInt(n, 10)) as [number, number])
    : null;
  const concurrency = flag('concurrency') ? parseInt(flag('concurrency')!, 10) : null;

  const outDir = path.join(root, 'out');
  fs.mkdirSync(outDir, {recursive: true});
  const outputLocation = path.join(outDir, `${episode.id}.mp4`);
  console.log(
    `Rendering ${composition.width}x${composition.height} @ ${composition.fps}fps, ` +
      `${(composition.durationInFrames / composition.fps).toFixed(1)}s -> ${path.relative(root, outputLocation)}`,
  );

  let lastPct = -1;
  await renderMedia({
    composition,
    serveUrl,
    codec: 'h264',
    outputLocation,
    inputProps,
    browserExecutable,
    frameRange,
    concurrency,
    imageFormat: 'jpeg',
    jpegQuality: 92,
    crf: 18,
    overwrite: true,
    enforceAudioTrack: true,
    onProgress: ({progress}) => {
      const pct = Math.floor(progress * 100);
      if (pct % 5 === 0 && pct !== lastPct) {
        lastPct = pct;
        process.stdout.write(`  ${pct}%\n`);
      }
    },
  });
  console.log(`Done: ${path.relative(root, outputLocation)}`);
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
