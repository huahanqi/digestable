import { useContext, useRef, useEffect } from 'react';
import * as d3 from 'd3';
import { SimplifyContext } from '../../contexts';
import { digestable } from '../../digestable';

export const TableWrapper = ({ data }) => {
  const [{ apply, method, amount }] = useContext(SimplifyContext);
  const divRef = useRef();
  const digestableRef = useRef();

  // Create visualization
  useEffect(() => {
    if (!digestableRef.current) {
      digestableRef.current = digestable()
        .applySimplification(apply)        
        .simplificationMethod(method)      
        .simplificationAmount(amount);
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
      digestableRef.current.applySimplification(apply);
    }
  }, [apply]);

  useEffect(() => {
    if (digestableRef.current) {
      digestableRef.current.simplificationMethod(method);
    }
  }, [method]);

  useEffect(() => {
    if (digestableRef.current) {
      digestableRef.current.simplificationAmount(amount);
    }
  }, [amount]);

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