import { useContext, useEffect } from 'react';
import { Form, FloatingLabel, Spinner, Row, Col } from 'react-bootstrap';
import { VisualizationContext } from '../../contexts';
import { ControlPanel } from './controlPanel';

const { Group, Select, Check } = Form;

export const VisualizationControls = ({ visual }) => {
  const [
    {
      modes,
      mode,
      showLinks,
      categoryScalingOptions,
      categoryScaling,
      calculatingRelations,
    },
    visualizationDispatch,
  ] = useContext(VisualizationContext);

  useEffect(() => {
    if (visual === 'both') {
      visualizationDispatch({ type: 'setMode', mode: 'both' });
      //simplification = 'false';
    } else if (visual === 'visualizations') {
      visualizationDispatch({ type: 'setMode', mode: 'visualizations' });
    } else if (visual === 'interactive') {
      visualizationDispatch({
        type: 'setMode',
        mode: 'interactive',
      });
    }
  }, []);

  const onModeChange = (evt) => {
    visualizationDispatch({ type: 'setMode', mode: evt.target.value });
  };

  const onShowLinksChange = (evt) => {
    visualizationDispatch({
      type: 'setShowLinks',
      showLinks: evt.target.checked,
    });
  };

  const onCategoryScalingChange = (evt) => {
    visualizationDispatch({
      type: 'setCategoryScaling',
      categoryScaling: evt.target.value,
    });
  };

  return (
    <ControlPanel title='Visualization'>
      <Group>
        <FloatingLabel label='Mode'>
          <Select value={mode} onChange={onModeChange}>
            {modes.map((mode, i) => (
              <option key={i} value={mode}>
                {mode}
              </option>
            ))}
          </Select>
        </FloatingLabel>
      </Group>
      <Group>
        <FloatingLabel label='Category scaling'>
          <Select value={categoryScaling} onChange={onCategoryScalingChange}>
            {categoryScalingOptions.map((option, i) => (
              <option key={i} value={option}>
                {option}
              </option>
            ))}
          </Select>
        </FloatingLabel>
      </Group>
    </ControlPanel>
  );
};
