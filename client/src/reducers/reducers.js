import { combineReducers } from 'redux';
import flash from './FlashReducer';

// special reducer to track rehydration
export const REHYDRATED = 'REHYDRATED';
const rehydrated = (state = false, action) => {
  if (action.type === REHYDRATED) {
    return true;
  }
  return state;
};

const reducer = combineReducers({
  rehydrated,
  flash,
});
export default reducer;
