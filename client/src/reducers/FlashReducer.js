import { UPDATE_FLASH } from '../actions/FlashActions';

export default function flash(state = {}, action) {
  switch (action.type) {
    case UPDATE_FLASH:
      return { ...action.flash };
    default:
      return state;
  }
}
