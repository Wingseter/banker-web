import app from '../src/app';
import { resetDb, balance, rowCount } from './helpers/db';
import { signedInAgent, csrfFor } from './helpers/agent';

async function seedAccountAndCard(): Promise<{ accountId: number; cardId: number }> {
  const agent = await signedInAgent(app);

  let token = await csrfFor(agent, '/accounts/new');
  await agent
    .post('/accounts')
    .type('form')
    .send({ _csrf: token, type: '일반 통장' })
    .expect(302);

  token = await csrfFor(agent, '/accounts/1/input');
  await agent
    .post('/accounts/1/input')
    .type('form')
    .send({ _csrf: token, money: '5000', content: 'seed' })
    .expect(302);

  token = await csrfFor(agent, '/cards/new');
  await agent
    .post('/cards')
    .type('form')
    .send({
      _csrf: token,
      max: '1000000',
      type: '명지 사랑 카드',
      account: '1',
      name: '내사랑카드',
    })
    .expect(302);

  return { accountId: 1, cardId: 1 };
}

describe('cards', () => {
  beforeEach(async () => {
    await resetDb();
  });

  it('charges the linked account on use and writes one history row', async () => {
    const { accountId, cardId } = await seedAccountAndCard();
    const agent = await signedInAgent(app);
    const token = await csrfFor(agent, `/cards/${cardId}/use`);
    await agent
      .post(`/cards/${cardId}/use`)
      .type('form')
      .send({ _csrf: token, money: '300', content: 'coffee' })
      .expect(302);

    expect(await balance(accountId)).toBe(4700);
    // 1 seed deposit + 1 card-use leg
    expect(await rowCount('history')).toBe(2);
  });

  it('refuses to charge more than the linked account balance', async () => {
    const { accountId, cardId } = await seedAccountAndCard();
    const agent = await signedInAgent(app);
    const token = await csrfFor(agent, `/cards/${cardId}/use`);
    await agent
      .post(`/cards/${cardId}/use`)
      .type('form')
      .send({ _csrf: token, money: '999999', content: 'big-spender' })
      .expect(302);

    expect(await balance(accountId)).toBe(5000);
    // Only the seed deposit, no card history.
    expect(await rowCount('history')).toBe(1);
  });
});
