import React, { createContext, useReducer } from 'react';

const modes = [
  'text',
  'visualizations',
  'both',
  'interactive'
];

const initialState = {
  modes: modes,
  mode: modes[0],
  showLinks: false
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
