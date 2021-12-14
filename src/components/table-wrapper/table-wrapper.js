import { useContext, useRef, useEffect } from 'react';
import * as d3 from 'd3';
import { SimplifyContext, VisualizationContext } from '../../contexts';
import { useScrollHook } from '../../hooks';
import { digestable } from '../../digestable';

export const TableWrapper = ({ data }) => {
  const [{ apply, method, amount, rows, transformBase }, simplifyDispatch] = useContext(SimplifyContext);
  const [{ mode, showLinks }] = useContext(VisualizationContext);
  const divRef = useRef();
  const digestableRef = useRef();

  // Scroll callback
  const onScroll = useScrollHook(() => {
    if (digestableRef.current) {
      digestableRef.current.updateLinks();
    }
  }, divRef, 'horizontal');

  // Create visualization
  useEffect(() => {
    if (!digestableRef.current) {
      digestableRef.current = digestable()
        .applySimplification(apply)        
        .simplificationMethod(method.name)      
        .simplificationAmount(amount)
        .simplificationRows(rows)
        .visualizationMode(mode)
        .on('sortByColumn', column => {
          simplifyDispatch({ 
            type: 'setColumnInfo', 
            columnType: column.type, 
            unique: column.uniqueValues.length 
          });
        });
    }
  }, []);

  // Update data
  useEffect(() => {
    d3.select(divRef.current)
      .datum(data)
      .call(digestableRef.current);
  }, [data]);

  // Simplify parameters
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

  useEffect(() => {
    if (digestableRef.current) {
      digestableRef.current.transformBase(transformBase);
    }
  }, [transformBase]);

  // Visualization parameters
  useEffect(() => {
    if (digestableRef.current) {
      digestableRef.current.visualizationMode(mode);
    }
  }, [mode]);

  useEffect(() => {
    if (digestableRef.current) {
      digestableRef.current.showLinks(showLinks);
    }
  }, [showLinks]);

  return (
    <div 
      ref={ divRef }
      style={{ 
        height: '100%',
        overflow: 'auto'
      }}
      onScroll={ onScroll }
    />
  );
};           