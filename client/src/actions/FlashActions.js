export const UPDATE_FLASH = 'UPDATE_FLASH';

export function updateFlash(flash) {
  return {
    type: UPDATE_FLASH,
    flash,
  };
}
