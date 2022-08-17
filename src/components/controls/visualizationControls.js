import { useContext } from 'react';
import { Form, FloatingLabel, Spinner, Row, Col } from 'react-bootstrap';
import { VisualizationContext } from '../../contexts';
import { ControlPanel } from './controlPanel';

const { Group, Select, Check } = Form;

export const VisualizationControls = () => {
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
        {calculatingRelations ? (
          <>
            <Check
              type='checkbox'
              label='Show links'
              id='show-links-checkbox'
              size='sm'
              checked={showLinks}
              onChange={onShowLinksChange}
              disabled={calculatingRelations}
            />
            {/* <Spinner
                animation='border'
                style={{
                  width: '1.5rem',
                  height: '1.5rem',
                  position: 'relative',
                  right: '20%',
                }}
              /> */}
            <p className='text-muted small' style={{ marginBottom: '0rem' }}>
              Calculating...
            </p>
          </>
        ) : (
          <Check
            type='checkbox'
            label='Show links'
            id='show-links-checkbox'
            size='sm'
            checked={showLinks}
            onChange={onShowLinksChange}
            disabled={calculatingRelations}
          />
        )}
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
