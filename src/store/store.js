import { createStore } from 'redux'
import reducer from '@/store/Reducers'
import Actions from './Action'

const store = createStore(reducer);

export default store;
export { Actions }
