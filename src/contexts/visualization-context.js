import React, { createContext, useReducer } from 'react';

const modes = [
  'text',
  'visualizations',
  'both',
  'interactive'
];

const categoryScalingOptions = [
  'row',
  'column'
];

const initialState = {
  modes: modes,
  mode: modes[0],
  showLinks: false,
  categoryScalingOptions: categoryScalingOptions,
  categoryScaling: categoryScalingOptions[0]
};

const reducer = (state, action) => {
  switch (action.type) {
    case 'setMode': 
      return {
        ...state,
        mode: action.mode
      };

    case 'setShowLinks':
      return {
        ...state,
        showLinks: action.showLinks
      }

    case 'setCategoryScaling':
      return {
        ...state,
        categoryScaling: action.categoryScaling
      }

    default: 
      throw new Error('Invalid visualization context action: ' + action.type);
  }
}

export const VisualizationContext = createContext(initialState);

export const VisualizationProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);
 
  return (
    <VisualizationContext.Provider value={ [state, dispatch] }>
      { children }
    </VisualizationContext.Provider>
  )
} 
