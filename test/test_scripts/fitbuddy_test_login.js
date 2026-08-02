import http from 'k6/http';
import { sleep, check } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 20 },  // Ramp up to 20 users
    { duration: '1m', target: 50 },   // Push to 50 users
    { duration: '1m', target: 100 },  // Maintain 100 maximum users
    { duration: '30s', target: 0 },   // Cool down to 0
  ],
};

const BASE_URL = 'http://localhost:7000'; 

// Array of your whitelisted production accounts for the login test
const staticUsers = [
  { email: 'a@a.com', password: 'SecurePassword123!' },
  { email: 'b@b.com', password: 'SecurePassword123!' },
  { email: 'swadhinkarjan26@gmail.com', password: 'SecurePassword123!' }
];

export default function () {
  const params = {
    headers: { 'Content-Type': 'application/json' },
  };

  // Flip a coin (50/50 probability) to determine user action
  const actionSelector = Math.random();

  // ----------------------------------------------------
  // SCENARIO 1: SIGNUP ROUTE (50% Traffic Weight)
  // ----------------------------------------------------
  if (actionSelector < 0.50) {
    const uniqueId = Date.now() + '_' + Math.floor(Math.random() * 100000);
    const signupPayload = JSON.stringify({
      username: `Stress User ${uniqueId}`, // Using username to match controller destructuring
      email: `user_${uniqueId}@gmail.com`,
      password: 'SecurePassword123!',
      age: 22,
      gender: 'male'
    });

    const res = http.post(`${BASE_URL}/user/signup`, signupPayload, params);

    check(res, {
      'Signup status is 201': (r) => r.status === 201,
      'Signup latency < 500ms': (r) => r.timings.duration < 500,
    });
  } 
  
  // ----------------------------------------------------
  // SCENARIO 2: LOGIN ROUTE (50% Traffic Weight)
  // ----------------------------------------------------
  else {
    // Pick one of your 3 preserved users at random so they don't hit identical keys on every line
    const randomUser = staticUsers[Math.floor(Math.random() * staticUsers.length)];
    const loginPayload = JSON.stringify({
      email: randomUser.email,
      password: randomUser.password, // Make sure this matches your local user passwords
    });

    const res = http.post(`${BASE_URL}/user/login`, loginPayload, params);

    check(res, {
      'Login status is 200': (r) => r.status === 200,
      'Login latency < 250ms': (r) => r.timings.duration < 250,
    });
  }

  // Pace the loops to resemble human activity
  sleep(1); 
}