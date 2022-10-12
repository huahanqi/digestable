import { useContext, useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import { SimplifyContext, VisualizationContext } from '../../contexts';
import { useScrollHook } from '../../hooks';
import { digestable } from '../../digestable';
import Footer from './Footer';
//import { index } from 'd3';

export const TableWrapper = ({
  data,
  clusterCol,
  ascending,
  simplification,
}) => {
  const [
    { apply, method, amount, rows, transformBase, unselect },
    simplifyDispatch,
  ] = useContext(SimplifyContext);
  const [
    { mode, showLinks, categoryScaling },
    visualizationDispatch,
  ] = useContext(VisualizationContext);
  const divRef = useRef();
  const digestableRef = useRef();
  const OuterDivRef = useRef();

  // parameters for load more
  const [isFullData, setIsFullData] = useState(false);
  const [addrowNum, setAddRowNum] = useState(100);
  // Scroll callback
  const onScroll = useScrollHook(
    () => {
      if (digestableRef.current) {
        digestableRef.current.updateLinks();
      }
    },
    OuterDivRef,
    'horizontal'
  );

  // Create visualization
  useEffect(() => {
    if (!digestableRef.current) {
      digestableRef.current = digestable()
        .applySimplification(apply)
        .applyClusterColumnLink(clusterCol, ascending)
        // .applySimpleLink(simplification)
        .simplificationMethod(method.name)
        .simplificationAmount(amount)
        .simplificationRows(rows)
        .transformBase(transformBase)
        .visualizationMode(mode)
        .categoryScaling(categoryScaling)
        .on('clusterByColumn', (column) => {
          simplifyDispatch({
            type: 'setColumnInfo',
            columnType: column.type,
            unique: column.uniqueValues.length,
          });
        })
        .onCalcRel('CalculateRelations', (isCalculating) => {
          //console.log(isCalculating);
          visualizationDispatch({
            type: 'setCalculatingRelations',
            calculatingRelations: isCalculating,
          });
        });
    }
  }, []);

  // Update data
  useEffect(() => {
    d3.select(divRef.current)
      .datum(data)
      .call(digestableRef.current);
    visualizationDispatch({
      type: 'setCalculatingRelations',
      calculatingRelations: true,
    });
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

  // unselect parameters
  useEffect(() => {
    if (digestableRef.current) {
      digestableRef.current.unselect();
    }
  }, [unselect]);

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

  useEffect(() => {
    if (digestableRef.current) {
      digestableRef.current.categoryScaling(categoryScaling);
    }
  }, [categoryScaling]);

  // if still calculate relations
  // useEffect(() => {
  //   if (digestableRef.current) {
  //     visualizationDispatch({
  //       type: 'setCalculatingRelations',
  //       calculatingRelations: false,
  //     });
  //   }
  // }, [calculatingRelations]);

  //load-more parameter

  // initial check
  useEffect(() => {
    if (digestableRef.current && digestableRef.current.isFullData()) {
      setIsFullData(true);
    }
  }, []);

  // click event
  const loadMore = (addrowNum) => {
    if (digestableRef.current) {
      digestableRef.current.loadMore(addrowNum);
      if (digestableRef.current.isFullData()) {
        setIsFullData(true);
      }
    }
  };

  const max = digestableRef.current && digestableRef.current.fullDataLength();
  const displayRowNum =
    digestableRef.current && digestableRef.current.displayRowNum();

  const refreshDisplayRowNum = () => {
    if (digestableRef.current) {
      return digestableRef.current.displayRowNum();
    }
  };
  return (
    <div
      ref={OuterDivRef}
      onScroll={onScroll}
      style={{
        height: '100%',
        overflow: 'auto',
      }}
    >
      <div ref={divRef}></div>
      {apply || isFullData ? (
        <div></div>
      ) : (
        <Footer
          loadMore={loadMore}
          isFullData={isFullData}
          addrowNum={addrowNum}
          setAddRowNum={setAddRowNum}
          max={max}
          displayRowNum={displayRowNum}
          refreshDisplayRowNum={refreshDisplayRowNum}
        />
      )}
    </div>
  );
};
