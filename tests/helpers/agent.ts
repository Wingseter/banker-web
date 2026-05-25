import request from 'supertest';
import type { Application } from 'express';

export type Agent = ReturnType<typeof request.agent>;

/** Pull the first hidden _csrf token out of the rendered HTML. */
export function extractCsrf(body: string): string {
  const m = body.match(/name="_csrf" value="([^"]+)"/);
  if (!m) throw new Error('no CSRF token in response body');
  return m[1];
}

/**
 * Returns a supertest agent (with cookie persistence) already signed in as
 * the seed demo user.
 */
export async function signedInAgent(app: Application): Promise<Agent> {
  const agent: Agent = request.agent(app);
  const get = await agent.get('/signin').expect(200);
  const token = extractCsrf(get.text);
  await agent
    .post('/signin')
    .type('form')
    .send({ _csrf: token, email: 'demo@banker.local', password: 'password123' })
    .expect(302);
  return agent;
}

/** GET a form-rendering URL and pull the fresh CSRF token off it. */
export async function csrfFor(agent: Agent, url: string): Promise<string> {
  const r = await agent.get(url).expect(200);
  return extractCsrf(r.text);
}
