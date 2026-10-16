export const FONT = '"Trebuchet MS", system-ui, sans-serif';

export const uiStyle = (size, color = '#ffffff') => ({
  fontFamily: FONT, fontSize: `${size}px`, fontStyle: 'bold', color,
  stroke: '#120a1a', strokeThickness: Math.max(3, Math.round(size / 5)),
});
