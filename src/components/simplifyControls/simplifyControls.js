import { useContext } from 'react';
import { Card, Form, Stack, FloatingLabel } from 'react-bootstrap';
import { SimplifyContext } from '../../contexts';

const { Header, Body } = Card;
const { Group, Label, Check, Select, Range } = Form;

export const SimplifyControls = () => {
  const [{ apply, methods, method, amount }, simplifyDispatch] = useContext(SimplifyContext);

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
      <Header>Simplification</Header>
      <Body>
        <Stack gap={ 3 }>
          <Group>
            <Check 
              type='checkbox' 
              label='Apply'
              id='apply-simplification-checkbox'              
              size='sm'
              checked={ apply }
              onChange={ onApplyChange }
            />
          </Group>
          <Group>
            <FloatingLabel label="Method">
              <Select 
                value={ method }
                onChange={ onMethodChange }
              >
                { methods.map((method, i) => (
                    <option 
                      key={ i } 
                      value={ method }
                    >
                      { method }
                    </option>
                  ))
                }
              </Select>
            </FloatingLabel>
          </Group>
          <Group>
            <Label >Amount</Label>
            <Range 
              min={ 0 }
              max={ 100 }
              step={ 0 }
              value={ amount * 100 }
              onChange={ onAmountChange }
            />        
          </Group>
        </Stack>
      </Body>
    </Card>
  );
};
