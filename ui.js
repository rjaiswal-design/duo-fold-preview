/** The default screens are app captures: draw them as-is, no browser chrome. */
export async function loadDefaultUIs() {
  const screens = {};
  await Promise.all(['outer', 'inner'].map(async kind => {
    const image = new Image(); image.src = `./previews/${kind}.webp`; await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = kind === 'inner' ? 2160 : 585;
    canvas.height = kind === 'inner' ? 1518 : 851;
    const c = canvas.getContext('2d');
    c.fillStyle = '#ffffff'; c.fillRect(0, 0, canvas.width, canvas.height);
    // Fit without cropping; the export ratios already match the screens closely.
    const scale = Math.min(canvas.width / image.width, canvas.height / image.height);
    c.drawImage(image, (canvas.width - image.width * scale) / 2, (canvas.height - image.height * scale) / 2,
      image.width * scale, image.height * scale);
    screens[kind] = canvas;
  }));
  return { portfolio: screens };
}
