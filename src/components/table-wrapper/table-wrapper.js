import { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import { digestable } from '../../digestable';

export const TableWrapper = ({ data, simplify, simplification }) => {
  const divRef = useRef();
  const digestableRef = useRef();

  // Create visualization
  useEffect(() => {
    if (!digestableRef.current) {
      digestableRef.current = digestable()
        .simplify(simplify)        
        .simplification(simplification);
    }
  }, []);

  // Update data
  useEffect(() => {
    d3.select(divRef.current)
      .datum(data)
      .call(digestableRef.current);
  }, [data]);

  // Update parameters
  useEffect(() => {
    if (digestableRef.current) {
      digestableRef.current.simplify(simplify);
    }
  }, [simplify]);

  useEffect(() => {
    if (digestableRef.current) {
      digestableRef.current.simplification(simplification);
    }
  }, [simplification]);

  return (
    <div 
      ref={ divRef }
      style={{ 
        height: '100%',
        overflow: 'auto'
      }}
    />
  );
};           