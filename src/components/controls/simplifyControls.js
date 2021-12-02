import { useContext } from 'react';
import { Form, FloatingLabel } from 'react-bootstrap';
import { SimplifyContext } from '../../contexts';
import { ControlPanel } from './controlPanel';

const { Group, Label, Check, Select, Range, Control } = Form;

export const SimplifyControls = () => {
  const [
    { apply, columnType, methods, method, amount, unique, rows }, 
    simplifyDispatch
  ] = useContext(SimplifyContext);

  const onApplyChange = evt => {
    simplifyDispatch({ type: 'setApply', apply: evt.target.checked });
  };

  const onMethodChange = evt => {
    simplifyDispatch({ type: 'setMethod', method: methods.find(({ name }) => name === evt.target.value) });
  };

  const onAmountChange = evt => {
    simplifyDispatch({ type: 'setAmount', amount: +evt.target.value / 100 });
  };

  const onRowsChange = evt => {
    simplifyDispatch({ type: 'setRows', rows: +evt.target.value });
  };

  return (
    <ControlPanel title="Simplification">
      <Group>
        <Check 
          type='checkbox' 
          label='Apply'
          id='apply-simplification-checkbox'              
          size='sm'
          checked={ apply }
          disabled={ columnType === 'id' }
          onChange={ onApplyChange }
        />
      </Group>
      <Group>
        <FloatingLabel label="Method">
          <Select 
            value={ method.name }
            disabled={ columnType !== 'numeric' }
            onChange={ onMethodChange }
          >
            { methods.map(({ name }, i) => (
                <option 
                  key={ i } 
                  value={ name }
                >
                  { name }
                </option>
              ))
            }
          </Select>
        </FloatingLabel>
      </Group>
      { method.type === 'amount' ?
        <Group>
          <Label>Amount</Label>
          <Range 
            min={ 0 }
            max={ 100 }
            step={ 0 }
            value={ amount * 100 }
            disabled={ columnType !== 'numeric' }
            onChange={ onAmountChange }
          />        
        </Group>
      :
        <Group>
          <Label >Number of rows</Label>
          <Control
            type='number'
            min={ 1 }
            max={ unique }
            step={ 1 }
            value={ rows }
            disabled={ columnType !== 'numeric' }
            onChange={ onRowsChange }
          />        
        </Group>
      }
    </ControlPanel>
  );
};
