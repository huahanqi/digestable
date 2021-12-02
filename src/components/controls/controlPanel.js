import { Card, Stack } from 'react-bootstrap';

const { Header, Body } = Card;

export const ControlPanel = ({ title, children }) => {
  return (
    <Card>
      <Header>{ title }</Header>
      <Body>
        <Stack gap={ 3 }>
          { children }
        </Stack>
      </Body>
    </Card>
  );
};
