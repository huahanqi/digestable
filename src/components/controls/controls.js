import { Form, Stack } from 'react-bootstrap';

const { Group, Label, Check, Range } = Form;

export const Controls = ({ simplify, simplification, onSimplifyChange, onSimplificationChange }) => {
  return (
    <Stack gap={ 3 }>
      <Group>
        <Check 
          type='checkbox' 
          label='Simplify'
          size='sm'
          checked={ simplify }
          onChange={ evt => onSimplifyChange(evt.target.checked) } />
      </Group>
      <Group>
        <Label>Simplification amount</Label>
        <Range 
          min={ 0 }
          max={ 100 }
          step={ 0 }
          value={ simplification * 100 }
          onChange={ evt => onSimplificationChange(+evt.target.value / 100) }
        />        
      </Group>
    </Stack>
  );
};
