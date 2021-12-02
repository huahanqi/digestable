import { useContext } from 'react';
import { Card, Form, Stack, FloatingLabel } from 'react-bootstrap';
import { SimplifyContext } from '../../contexts';

const { Header, Body } = Card;
const { Group, Label, Check, Select, Range, Control } = Form;

export const SimplifyControls = () => {
  const [{ apply, methods, method, amount, unique, rows }, simplifyDispatch] = useContext(SimplifyContext);

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
                value={ method.name }
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
                onChange={ onRowsChange }
              />        
            </Group>
          }
        </Stack>
      </Body>
    </Card>
  );
};
