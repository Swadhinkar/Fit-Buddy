// import { execution } from 'k6/execution';
import http from 'k6/http';
import { sleep, check } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 20 },  // Ramp up from 0 to 20 users
    { duration: '1m', target: 50 },   // Push to 50 users
    { duration: '1m', target: 100 },  // Push to 100 users (Be careful with Render's free tier here!)
    { duration: '30s', target: 0 },   // Ramp down back to 0
  ],
};

// Paste your actual Render backend URL here
const BASE_URL = 'http://localhost:7000'; // Change this to your Render URL when testing

export default function () {
  // Scenario 1: Hitting a public health metrics or fatigue analysis endpoint
  // (If it requires an auth token, you can pass it in the headers)
  const params = {
    headers: {
      'Content-Type': 'application/json',
      // 'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5YzgwMTg2N2ZjNzI2NjJkODBiYTczYiIsImlhdCI6MTc4MTk1ODc4OSwiZXhwIjoxNzgxOTU5Njg5fQ.LAmbdQ1Fr8riBAnVIp7-iVZSyJS5YIthXgRjIfTS3jg', // Uncomment if needed
    },
  };

  // const uniqueId = execution.scenario.iterationInTest;
  const uniqueId = Date.now() + '_' + Math.floor(Math.random() * 100000);

const payload = JSON.stringify({
  username: `Test User ${uniqueId}`, // Changed from name to username
  email: `user_${uniqueId}@gmail.com`,
  password: 'SecurePassword123!',
  age: 23,
  gender: 'male'
});

  // Test your MongoDB Aggregation pipeline route
  const res = http.post(`${BASE_URL}/user/signup/`, payload, params);

  // Validate the responses
  check(res, {
    'status is 200': (r) => r.status === 200,
    'latency under 250ms': (r) => r.timings.duration < 250,
  });
  
  // Wait 1 second between iterations to simulate real human pacing
  sleep(1); 
}