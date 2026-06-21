Sound assets for Clackr.

- sound.ogg  : the realistic mechanical keyboard sprite (used by the
               "Realistic" sound profile). One file containing every key's
               press/release sound, sliced via src/audio/keySprite.ts.

- faah.mp3   : the optional "Faah" mistake sound for Fash mode.
               To use it: Settings -> Gameplay -> Fash mode = ON, then set
               "Mistake sound" to "Faah". Path is set by FAAH_SOUND_PATH in
               src/audio/soundEngine.ts. If missing, it falls back to the buzzer.
