import request from 'supertest';
import app from '../src/app';
import { resetDb } from './helpers/db';
import { csrfFor } from './helpers/agent';

beforeEach(async () => {
  await resetDb();
});

describe('signin', () => {
  it('rejects POST /signin with no CSRF token', async () => {
    await request(app)
      .post('/signin')
      .type('form')
      .send({ email: 'demo@banker.local', password: 'password123' })
      .expect(403);
  });

  it('accepts seed user signin via bcrypt', async () => {
    const agent = request.agent(app);
    const token = await csrfFor(agent, '/signin');
    await agent
      .post('/signin')
      .type('form')
      .send({ _csrf: token, email: 'demo@banker.local', password: 'password123' })
      .expect(302)
      .expect('Location', '/');
  });

  it('rejects signin with wrong password', async () => {
    const agent = request.agent(app);
    const token = await csrfFor(agent, '/signin');
    await agent
      .post('/signin')
      .type('form')
      .send({ _csrf: token, email: 'demo@banker.local', password: 'wrong' })
      .expect(302)
      .expect('Location', '/signin');
  });

  it('rejects signin for unknown user', async () => {
    const agent = request.agent(app);
    const token = await csrfFor(agent, '/signin');
    await agent
      .post('/signin')
      .type('form')
      .send({ _csrf: token, email: 'nobody@example.com', password: 'password123' })
      .expect(302)
      .expect('Location', '/signin');
  });
});
