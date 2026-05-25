import app from '../src/app';
import { resetDb, balance, rowCount } from './helpers/db';
import { signedInAgent, csrfFor } from './helpers/agent';

async function createTwoAccounts(): Promise<[number, number]> {
  const agent = await signedInAgent(app);
  for (const type of ['일반 통장', '적금 통장']) {
    const token = await csrfFor(agent, '/accounts/new');
    await agent.post('/accounts').type('form').send({ _csrf: token, type }).expect(302);
  }
  return [1, 2];
}

describe('accounts: money flows', () => {
  beforeEach(async () => {
    await resetDb();
  });

  it('deposits money and records a history row', async () => {
    const [a] = await createTwoAccounts();
    const agent = await signedInAgent(app);
    const token = await csrfFor(agent, `/accounts/${a}/input`);
    await agent
      .post(`/accounts/${a}/input`)
      .type('form')
      .send({ _csrf: token, money: '1500', content: 'jest-deposit' })
      .expect(302);

    expect(await balance(a)).toBe(1500);
    expect(await rowCount('history')).toBe(1);
  });

  it('rejects negative deposit (302 redirect, no balance change)', async () => {
    const [a] = await createTwoAccounts();
    const agent = await signedInAgent(app);
    const token = await csrfFor(agent, `/accounts/${a}/input`);
    await agent
      .post(`/accounts/${a}/input`)
      .type('form')
      .send({ _csrf: token, money: '-10', content: 'bad' })
      .expect(302);

    expect(await balance(a)).toBe(0);
    expect(await rowCount('history')).toBe(0);
  });

  it('rejects overdraft and rolls the balance back', async () => {
    const [a] = await createTwoAccounts();
    const agent = await signedInAgent(app);

    let token = await csrfFor(agent, `/accounts/${a}/input`);
    await agent
      .post(`/accounts/${a}/input`)
      .type('form')
      .send({ _csrf: token, money: '1000', content: 'seed' })
      .expect(302);

    token = await csrfFor(agent, `/accounts/${a}/output`);
    await agent
      .post(`/accounts/${a}/output`)
      .type('form')
      .send({ _csrf: token, money: '5000', content: 'too-much' })
      .expect(302);

    expect(await balance(a)).toBe(1000);
    // one history row from the deposit, none from the failed withdraw
    expect(await rowCount('history')).toBe(1);
  });

  it('transfers funds atomically and records both legs', async () => {
    const [a, b] = await createTwoAccounts();
    const agent = await signedInAgent(app);

    let token = await csrfFor(agent, `/accounts/${a}/input`);
    await agent
      .post(`/accounts/${a}/input`)
      .type('form')
      .send({ _csrf: token, money: '3000', content: 'seed' })
      .expect(302);

    token = await csrfFor(agent, `/accounts/${a}/sendmoney`);
    await agent
      .post(`/accounts/${a}/sendmoney`)
      .type('form')
      .send({ _csrf: token, to: b, money: '1200', content: 'jest-transfer' })
      .expect(302);

    expect(await balance(a)).toBe(1800);
    expect(await balance(b)).toBe(1200);
    // 1 deposit + 2 transfer legs
    expect(await rowCount('history')).toBe(3);
  });

  it('rolls back BOTH sides when the transfer throws mid-flight', async () => {
    const [a, b] = await createTwoAccounts();
    const agent = await signedInAgent(app);

    let token = await csrfFor(agent, `/accounts/${a}/input`);
    await agent
      .post(`/accounts/${a}/input`)
      .type('form')
      .send({ _csrf: token, money: '3000', content: 'seed' })
      .expect(302);

    token = await csrfFor(agent, `/accounts/${a}/sendmoney`);
    await agent
      .post(`/accounts/${a}/sendmoney?fail=1`)
      .type('form')
      .send({ _csrf: token, to: b, money: '500', content: 'will-throw' })
      .expect(500);

    expect(await balance(a)).toBe(3000);
    expect(await balance(b)).toBe(0);
    // only the seed deposit's history row should still exist
    expect(await rowCount('history')).toBe(1);

    // A clean transfer after the rollback must still succeed — proves the
    // connection was released back to the pool.
    token = await csrfFor(agent, `/accounts/${a}/sendmoney`);
    await agent
      .post(`/accounts/${a}/sendmoney`)
      .type('form')
      .send({ _csrf: token, to: b, money: '500', content: 'ok' })
      .expect(302);

    expect(await balance(a)).toBe(2500);
    expect(await balance(b)).toBe(500);
  });
});
