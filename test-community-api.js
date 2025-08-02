const axios = require('axios');

async function testCommunityAPI() {
  try {
    console.log('Testing community API...');
    
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://phoenix.onrender.com' 
      : 'http://localhost:4000';
    
    // Test GET messages
    console.log('\n1. Testing GET /api/community/messages');
    const getResponse = await axios.get(`${baseUrl}/api/community/messages`, {
      headers: {
        'Authorization': 'Bearer dummy-jwt-token-for-testing'
      }
    });
    console.log('GET Response:', getResponse.data);
    
    // Test POST message
    console.log('\n2. Testing POST /api/community/messages');
    const postResponse = await axios.post(`${baseUrl}/api/community/messages`, {
      content: 'Test message from API test script',
      topics: ['test']
    }, {
      headers: {
        'Authorization': 'Bearer dummy-jwt-token-for-testing',
        'Content-Type': 'application/json'
      }
    });
    console.log('POST Response:', postResponse.data);
    
    // Test GET again to see the new message
    console.log('\n3. Testing GET /api/community/messages again');
    const getResponse2 = await axios.get(`${baseUrl}/api/community/messages`, {
      headers: {
        'Authorization': 'Bearer dummy-jwt-token-for-testing'
      }
    });
    console.log('GET Response 2:', getResponse2.data);
    
  } catch (error) {
    console.error('Error testing API:', error.response?.data || error.message);
  }
}

testCommunityAPI();
