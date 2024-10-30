import request from 'supertest';
import { app } from '../../app';

it('Returns a 201 on successful sign up.', async () => {
  return request(app)
    .post('/api/users/signup')
    .send({
      email: 'test@test.com',
      password: 'password'
    })
    .expect(201);
});

it('Returns a 400 with an invalid email.', async () => {
  return request(app)
    .post('/api/users/signup')
    .send({
      email: 'test',
      password: 'password'
    })
    .expect(400);
});

it('Returns a 400 with invalid password.', async () => {
  return request(app)
    .post('/api/users/signup')
    .send({
      email: 'test@test.com',
      password: 'p'
    })
    .expect(400);
});

it('Returns a 400 with no fields provided.', async () => {
  await request(app)
    .post('/api/users/signup')
    .send({
      email: 'test@test.com',
      password: ''
    })
    .expect(400);

  await request(app)
    .post('/api/users/signup')
    .send({
      email: '',
      password: 'password'
    })
    .expect(400);
});

it('Does not allow same email to be used.', async () => {
  await request(app)
    .post('/api/users/signup')
    .send({
      email: 'test@test.com',
      password: 'password'
    })
    .expect(201);

  await request(app)
    .post('/api/users/signup')
    .send({
      email: 'test@test.com',
      password: 'password'
    })
    .expect(400);
});

it('Sets a cookie after successful signup.', async () => {
  const response = await request(app)
    .post('/api/users/signup')
    .send({
      email: 'test@test.com',
      password: 'password'
    })
    .expect(201);

  expect(response.get('Set-Cookie')).toBeDefined();
});
