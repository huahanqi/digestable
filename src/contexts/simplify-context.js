import React, { createContext, useReducer } from 'react';

const methods = [
  { name: 'quantiles', type: 'rows' },
  { name: 'kmeans', type: 'rows' },
  { name: 'gap', type: 'rows', transform: true },
  //  { name: 'threshold', type: 'amount' }
];

const initialState = {
  apply: false,
  columnType: 'numeric',
  methods: methods,
  method: methods[0],
  amount: 0.5,
  transformBase: 1,
  unique: 0,
  rows: 10,
};

const reducer = (state, action) => {
  switch (action.type) {
    case 'setApply':
      return {
        ...state,
        apply: action.apply,
      };

    case 'setMethod':
      return {
        ...state,
        method: action.method,
      };

    case 'setAmount':
      return {
        ...state,
        amount: action.amount,
      };

    case 'setTransformBase':
      return {
        ...state,
        transformBase: action.transformBase,
      };

    case 'setColumnInfo':
      return {
        ...state,
        columnType: action.columnType,
        unique: action.unique,
        rows: Math.min(state.rows, action.unique),
      };

    case 'setRows':
      return {
        ...state,
        rows: action.rows,
      };

    default:
      throw new Error('Invalid simplify context action: ' + action.type);
  }
};

export const SimplifyContext = createContext(initialState);

export const SimplifyProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  return (
    <SimplifyContext.Provider value={[state, dispatch]}>
      {children}
    </SimplifyContext.Provider>
  );
};
