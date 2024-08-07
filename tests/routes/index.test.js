const request = require('supertest');
const { expect } = require('chai');
const app = require('../../server'); // Adjust the path to your actual server file

describe('API Endpoints', () => {
  it('GET /status should return status 200', (done) => {
    request(app)
      .get('/status')
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);
        expect(res.body).to.have.property('redis');
        expect(res.body).to.have.property('db');
        done();
      });
  });

  it('GET /stats should return status 200', (done) => {
    request(app)
      .get('/stats')
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);
        expect(res.body).to.have.property('users');
        expect(res.body).to.have.property('files');
        done();
      });
  });
});
