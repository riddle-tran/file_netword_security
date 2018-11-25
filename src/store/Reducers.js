import ActionTypes from "./Action"

const initialState = {
  isLogged: null
}

const reducer = function (state = initialState, action) {
  switch (action.type) {
    case ActionTypes.LOGIN:
      return {
        ...state,
        isLogged: true,
      }
    case ActionTypes.LOGOUT:
      return {
        ...state,
        isLogged: false,
      }
    default:
      return state;
  }
}

export default reducer
