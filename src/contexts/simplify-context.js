import React, { createContext, useReducer } from "react";

const methods = ['threshold', 'kmeans'];

const initialState = {
  apply: false,
  methods: methods,
  method: methods[0],
  amount: 0.5
};

const reducer = (state, action) => {
  switch (action.type) {
    case "setApply": 
      return {
        ...state,
        apply: action.apply
      };

    case "setMethod": {
      return {
        ...state,
        method: action.method
      };
    }

    case "setAmount": {
      return {
        ...state,
        amount: action.amount
      };
    }

    default: 
      throw new Error("Invalid simplify context action: " + action.type);
  }
}

export const SimplifyContext = createContext(initialState);

export const SimplifyProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);
 
  return (
    <SimplifyContext.Provider value={ [state, dispatch] }>
      { children }
    </SimplifyContext.Provider>
  )
} 
