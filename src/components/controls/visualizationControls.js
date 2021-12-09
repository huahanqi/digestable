import { useContext } from 'react';
import { Form, FloatingLabel } from 'react-bootstrap';
import { VisualizationContext } from '../../contexts';
import { ControlPanel } from './controlPanel';

const { Group, Select, Check } = Form;

export const VisualizationControls = () => {
  const [{ modes, mode, showLinks }, visualizationDispatch] = useContext(VisualizationContext);

  const onModeChange = evt => {
    visualizationDispatch({ type: 'setMode', mode: evt.target.value });
  };

  const onShowLinksChange = evt => {
    visualizationDispatch({ type: 'setShowLinks', showLinks: evt.target.checked });
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
      <Group>
        <Check 
          type='checkbox' 
          label='Show links'
          id='show-links-checkbox'              
          size='sm'
          checked={ showLinks }
          onChange={ onShowLinksChange }
        />
      </Group>
    </ControlPanel>
  );
};
