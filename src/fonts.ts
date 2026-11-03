import {loadFont} from '@remotion/fonts';
import patrickHand from '@fontsource/patrick-hand/files/patrick-hand-latin-400-normal.woff2';
import nunito400 from '@fontsource/nunito/files/nunito-latin-400-normal.woff2';
import nunito700 from '@fontsource/nunito/files/nunito-latin-700-normal.woff2';

// Fonts ship with the npm packages, so rendering never needs the network.
loadFont({family: 'Patrick Hand', url: patrickHand, weight: '400'});
loadFont({family: 'Nunito', url: nunito400, weight: '400'});
loadFont({family: 'Nunito', url: nunito700, weight: '700'});

export const FONTS = {
  hand: "'Patrick Hand', 'Comic Sans MS', cursive",
  clean: "'Nunito', 'Helvetica Neue', Arial, sans-serif",
};
