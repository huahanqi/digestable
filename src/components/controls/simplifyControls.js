import { useContext } from 'react';
import { Form, FloatingLabel, Button } from 'react-bootstrap';
import { SimplifyContext } from '../../contexts';
import { ControlPanel } from './controlPanel';

const { Group, Label, Check, Select, Range, Control } = Form;

export const SimplifyControls = () => {
  const [
    {
      apply,
      columnType,
      methods,
      method,
      amount,
      transformBase,
      unique,
      rows,
      unselect,
    },
    simplifyDispatch,
  ] = useContext(SimplifyContext);

  const onApplyChange = (evt) => {
    simplifyDispatch({ type: 'setApply', apply: evt.target.checked });
  };

  const onMethodChange = (evt) => {
    simplifyDispatch({
      type: 'setMethod',
      method: methods.find(({ name }) => name === evt.target.value),
    });
  };

  const onAmountChange = (evt) => {
    simplifyDispatch({ type: 'setAmount', amount: +evt.target.value / 100 });
  };

  const onRowsChange = (evt) => {
    simplifyDispatch({ type: 'setRows', rows: +evt.target.value });
  };

  const onTransformBaseChange = (evt) => {
    simplifyDispatch({
      type: 'setTransformBase',
      transformBase: +evt.target.value / 100,
    });
  };

  const onUnselectChange = (evt) => {
    simplifyDispatch({
      type: 'setUnselect',
      unselect: evt.target.value === 'true',
    });
  };

  return (
    <ControlPanel title='Simplification' subtitle={`${columnType} column`}>
      <Group>
        <Check
          type='checkbox'
          label='Apply'
          id='apply-simplification-checkbox'
          size='sm'
          checked={apply}
          disabled={columnType === 'id'}
          onChange={onApplyChange}
        />
      </Group>
      {columnType === 'numeric' && (
        <>
          <Group>
            <Label>numeric column:</Label>
            <FloatingLabel label='Method'>
              <Select value={method.name} onChange={onMethodChange}>
                {methods.map(({ name }, i) => (
                  <option key={i} value={name}>
                    {name}
                  </option>
                ))}
              </Select>
            </FloatingLabel>
          </Group>
          {method.type === 'amount' ? (
            <Group>
              <Label>Amount</Label>
              <Range
                min={0}
                max={100}
                step={1}
                value={amount * 100}
                onChange={onAmountChange}
              />
            </Group>
          ) : (
            <Group>
              <Label>Number of rows</Label>
              <Control
                type='number'
                min={1}
                max={unique}
                step={1}
                value={rows}
                onChange={onRowsChange}
              />
            </Group>
          )}
          {method.transform && (
            <Group>
              <Label>Depth weight</Label>
              <Range
                min={100}
                max={400}
                step={1}
                value={transformBase * 100}
                onChange={onTransformBaseChange}
              />
            </Group>
          )}
          <Group>
            <Label>Select</Label>
            <br />
            <Button
              variant='primary'
              size='sm'
              value={!unselect}
              onClick={onUnselectChange}
            >
              UnSelect all rows
            </Button>
          </Group>
        </>
      )}
    </ControlPanel>
  );
};
