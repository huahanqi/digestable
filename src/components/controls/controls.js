import { Form } from 'react-bootstrap';

const { Control, Group, Label, Check } = Form;

export const Controls = ({ simplify, onSimplifyChange }) => {
  return (
    <>
      <Group>
        <Check 
          type="checkbox" 
          label="Simplify"
          checked={ simplify }
          onChange={ onSimplifyChange } />
      </Group>
    </>
  );
};
