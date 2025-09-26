const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testSegmentsAPI() {
  try {
    console.log('Testing segments API...');
    
    // First, login to get a token
    console.log('1. Logging in...');
    const loginResponse = await fetch('http://localhost:5001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123'
      })
    });

    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.status} ${loginResponse.statusText}`);
    }

    const loginData = await loginResponse.json();
    console.log('Login successful:', loginData.success);
    
    const token = loginData.data.accessToken;
    console.log('Token received:', token ? 'Yes' : 'No');

    // Test segments API
    console.log('\n2. Testing segments API...');
    const projectId = '94774b27-7447-46c2-b783-0e7fe3bc1a1b';
    const segmentsResponse = await fetch(`http://localhost:5001/api/segments/project/${projectId}?page=1&limit=1000`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('Segments API status:', segmentsResponse.status);
    console.log('Segments API ok:', segmentsResponse.ok);

    if (segmentsResponse.ok) {
      const segmentsData = await segmentsResponse.json();
      console.log('Segments response:', JSON.stringify(segmentsData, null, 2));
    } else {
      const errorText = await segmentsResponse.text();
      console.log('Error response:', errorText);
    }

  } catch (error) {
    console.error('Error testing API:', error);
  }
}

testSegmentsAPI();
