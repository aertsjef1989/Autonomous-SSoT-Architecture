# Media and slide management

## Media: images, GIFs, video

**+ Upload asset** now takes PNG, JPG, **GIF** and **video** (mp4, webm, mov). One file or many at once.

The asset list labels what each thing is and how heavy it is, e.g. `▶ clip.mp4  1920x1080  5.2MB`. Click to place it on the current slide.

### GIFs

A GIF goes through the image path, so it **animates on the canvas** and it gets the entire image control stack: tint to a theme role, greyscale, saturation, brightness, contrast, invert, blur, rotate, flip, corner radius, frame, opacity.

### Video

A video is a **real `<video>` element on the canvas**, so it plays while you design around it.

| Control | Default |
|---|---|
| autoplay | on |
| loop | on |
| muted | on (browsers block unmuted autoplay) |
| controls | off |
| fit | contain, cover, or stretch |
| corner radius, frame, opacity, rotate | |
| reset aspect | snaps the box back to the file's true ratio |

Thumbnails and PPTX export use a **still frame** with a play glyph instead of a live player, so the sidebar stays fast.

**On export**, video is embedded as **real PowerPoint media** (`addMedia`), not a picture of a video. It plays in the deck. If the codec is one PowerPoint will not take, it falls back to the still frame rather than failing the export.

**A word on weight.** Video is stored inside the project `.json` as base64. A 20MB clip makes a 27MB project file. That is fine for one or two clips; it is not a media library. Keep the hero clip in the deck and leave the b-roll out.

## Slide management

Three buttons above the slide list:

- **+ Slide**: a new blank slide after the current one.
- **Duplicate**: a full copy of the current slide, with fresh object ids, inserted right after it. The fastest way to build a sequence that evolves.
- **Delete**: removes the current slide. Selection moves to the nearest remaining slide.

Delete cannot empty the deck: on the last slide it resets it to blank rather than leaving you with nothing. Every one of the three is undoable with Ctrl+Z.
