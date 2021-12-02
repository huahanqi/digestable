import { useContext } from 'react';
import { Form, FloatingLabel } from 'react-bootstrap';
import { VisualizationContext } from '../../contexts';
import { ControlPanel } from './controlPanel';

const { Group, Select } = Form;

export const VisualizationControls = () => {
  const [{ modes, mode }, visualizationDispatch] = useContext(VisualizationContext);

  const onModeChange = evt => {
    visualizationDispatch({ type: 'setMode', mode: evt.target.value });
  };

  return (
    <ControlPanel title='Visualization'>
      <Group>
        <FloatingLabel label="Mode">
          <Select 
            value={ mode }
            onChange={ onModeChange }
          >
            { modes.map((mode, i) => (
                <option 
                  key={ i } 
                  value={ mode }
                >
                  { mode }
                </option>
              ))
            }
          </Select>
        </FloatingLabel>
      </Group>
    </ControlPanel>
  );
};
