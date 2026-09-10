import assert from 'assert';
import { formatDispatchLine } from './dispatch-message';

const line = formatDispatchLine({
  unitShort: '1 р',
  lastName: 'Кваша',
  firstName: 'Іван',
  middleName: 'Петрович',
  rankName: 'солдат',
  serviceType: 'строкова',
  birthDate: '1999-05-01T00:00:00.000Z',
  phone: '+380501112233',
  action: 'Стаціонар',
  diagnosis: 'GSW',
});

assert.equal(
  line,
  '1 р · Кваша Іван Петрович · солдат строкова · 01.05.1999 · +380501112233 · Стаціонар · GSW',
);

assert.equal(
  formatDispatchLine({
    lastName: 'Тест',
    firstName: 'Імʼя',
    action: 'Консультація',
  }),
  'Тест Імʼя · Консультація',
);

console.log('dispatch-message tests passed');
