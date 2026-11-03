/**
 * Render a YouTube thumbnail (1280x720 PNG) for an episode.
 *
 *   npm run thumbnail -- ep01
 *
 * Options come from the episode JSON's optional "thumbnail" object:
 *   "thumbnail": {"text": "SIT?!", "expression": "treat-hypnotized", "color": "#2FA3E6", "badge": "Luca Learns"}
 * Command-line overrides: --text="NO TREAT?!" --expression=betrayed --color=#F2549B --out=out/x.png
 */
import fs from 'node:fs';
import path from 'node:path';
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import {thumbnailDefaults, type ThumbnailProps} from '../src/thumbnail-props';

const root = path.resolve(__dirname, '..');
const args = process.argv.slice(2);
const id = args.find((a) => !a.startsWith('--'));
const flag = (name: string) => args.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3);

if (!id) {
  console.error('Usage: npm run thumbnail -- <episode>   (for example: npm run thumbnail -- ep01)');
  process.exit(1);
}

const main = async () => {
  const dir = path.join(root, 'episodes');
  const file = fs.readdirSync(dir).find((f) => f === `${id}.json` || f.startsWith(`${id}-`));
  if (!file) throw new Error(`No episode file for "${id}" in episodes/`);
  const episode = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
  const props: ThumbnailProps = {
    ...thumbnailDefaults,
    ...(episode.thumbnail ?? {}),
    ...(flag('text') ? {text: flag('text')} : {}),
    ...(flag('expression') ? {expression: flag('expression')} : {}),
    ...(flag('color') ? {color: flag('color')} : {}),
    ...(flag('badge') ? {badge: flag('badge')} : {}),
  };
  const output = flag('out') ? path.resolve(root, flag('out')!) : path.join(root, 'out', `${episode.id}-thumbnail.png`);
  fs.mkdirSync(path.dirname(output), {recursive: true});

  const browserExecutable = process.env.REMOTION_BROWSER_EXECUTABLE || null;
  const serveUrl = await bundle({entryPoint: path.join(root, 'src', 'index.ts'), publicDir: path.join(root, 'audio')});
  const composition = await selectComposition({serveUrl, id: 'Thumbnail', inputProps: props, browserExecutable});
  await renderStill({serveUrl, composition, output, inputProps: props, browserExecutable, imageFormat: 'png'});
  console.log(`Thumbnail: ${path.relative(root, output)}  (${props.text}, ${props.expression})`);
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
