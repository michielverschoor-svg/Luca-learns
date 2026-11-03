# Voiceover audio

Drop voiceover clips here as `audio/<episode>/<sceneId>.mp3`, for example
`audio/ep01/s01.mp3`. When a clip exists, the render plays it during that scene
(and stretches the scene if the clip is longer than `durationSec`). When it is
missing, the scene renders silent with subtitles only.

No paid text-to-speech API is called by this project.
