import React, { createContext, useReducer } from 'react';

// const modes = ['text', 'visualizations', 'both', 'interactive'];
const modes = ['text', 'visualizations', 'both'];
// const categoryScalingOptions = ['row', 'column'];
const categoryScalingOptions = ['row'];

const initialState = {
  modes: modes,
  mode: modes[0],
  showLinks: false,
  categoryScalingOptions: categoryScalingOptions,
  categoryScaling: categoryScalingOptions[0],
  calculatingRelations: true,
  mainIndices: [],
  prepareIndices: [],
  showSearch: false,
};

const reducer = (state, action) => {
  switch (action.type) {
    case 'setMode':
      return {
        ...state,
        mode: action.mode,
      };

    case 'setShowLinks':
      return {
        ...state,
        showLinks: action.showLinks,
      };

    case 'setCategoryScaling':
      return {
        ...state,
        categoryScaling: action.categoryScaling,
      };

    case 'setCalculatingRelations':
      return {
        ...state,
        calculatingRelations: action.calculatingRelations,
      };

    case 'setMainIndices':
      return {
        ...state,
        mainIndices: action.mainIndices,
      };

    case 'setPrepareIndices':
      return {
        ...state,
        prepareIndices: action.prepareIndices,
      };

    case 'setShowSearch':
      return {
        ...state,
        showSearch: action.showSearch,
      };

    default:
      throw new Error('Invalid visualization context action: ' + action.type);
  }
};

export const VisualizationContext = createContext(initialState);

export const VisualizationProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  return (
    <VisualizationContext.Provider value={[state, dispatch]}>
      {children}
    </VisualizationContext.Provider>
  );
};
