import { useContext } from 'react';
import { Card, Form, Stack } from 'react-bootstrap';
import { SimplifyContext } from '../../contexts';

const { Group, Label, Check, Range } = Form;

export const SimplifyControls = () => {
  const [{ apply, method, amount }, simplifyDispatch] = useContext(SimplifyContext);

  const onApplyChange = evt => {
    simplifyDispatch({ type: 'setApply', apply: evt.target.checked });
  };

  const onMethodChange = evt => {
    simplifyDispatch({ type: 'setMethod', method: evt.target.value });
  };

  const onAmountChange = evt => {
    simplifyDispatch({ type: 'setAmount', amount: +evt.target.value / 100});
  };

  return (
    <Card>
    <Stack gap={ 3 }>
      <Group>
        <Check 
          type='checkbox' 
          label='Apply'
          size='sm'
          checked={ apply }
          onChange={ onApplyChange }
        />
      </Group>
      <Group>
        <Label>Amount</Label>
        <Range 
          min={ 0 }
          max={ 100 }
          step={ 0 }
          value={ amount * 100 }
          onChange={ onAmountChange }
        />        
      </Group>
    </Stack></Card>
  );
};
