import { useContext, useRef, useEffect } from 'react';
import * as d3 from 'd3';
import { SimplifyContext } from '../../contexts';
import { digestable } from '../../digestable';

export const TableWrapper = ({ data }) => {
  const [{ apply, method, amount, rows }, simplifyDispatch] = useContext(SimplifyContext);
  const divRef = useRef();
  const digestableRef = useRef();

  // Create visualization
  useEffect(() => {
    if (!digestableRef.current) {
      digestableRef.current = digestable()
        .applySimplification(apply)        
        .simplificationMethod(method.name)      
        .simplificationAmount(amount)
        .simplificationRows(rows)
        .on('sortByColumn', column => {
          simplifyDispatch({ type: 'setUnique', unique: column.uniqueValues.length });
        });
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
      digestableRef.current.simplificationMethod(method.name);
    }
  }, [method]);

  useEffect(() => {
    if (digestableRef.current) {
      digestableRef.current.simplificationAmount(amount);
    }
  }, [amount]);

  useEffect(() => {
    if (digestableRef.current) {
      digestableRef.current.simplificationRows(rows);
    }
  }, [rows]);

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