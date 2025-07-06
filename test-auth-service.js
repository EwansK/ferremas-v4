const axios = require('axios');

const BASE_URL = 'http://localhost:3001';
let accessToken = '';
let refreshToken = '';

// Test data
const testUser = {
  name: 'Test',
  lastname: 'User',
  email: 'test@example.com',
  password: 'TestPassword123!'
};

const testLogin = {
  email: 'admin@ferremas.cl',
  password: 'password123'
};

async function testAuthService() {
  console.log('🧪 Testing Authentication Service...\n');

  try {
    // 1. Test health endpoint
    console.log('1. Testing health endpoint...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health check:', healthResponse.data.message);
    console.log('');

    // 2. Test user registration
    console.log('2. Testing user registration...');
    try {
      const registerResponse = await axios.post(`${BASE_URL}/auth/register`, testUser);
      console.log('✅ Registration successful:', registerResponse.data.message);
      console.log('   User ID:', registerResponse.data.data.user.id);
      console.log('   Role:', registerResponse.data.data.user.role);
      accessToken = registerResponse.data.data.tokens.accessToken;
      refreshToken = registerResponse.data.data.tokens.refreshToken;
      console.log('   Tokens received ✅');
    } catch (error) {
      if (error.response?.status === 409) {
        console.log('⚠️  User already exists, proceeding with login test...');
      } else {
        console.log('❌ Registration failed:', error.response?.data?.message || error.message);
      }
    }
    console.log('');

    // 3. Test user login with existing user
    console.log('3. Testing user login...');
    try {
      const loginResponse = await axios.post(`${BASE_URL}/auth/login`, testLogin);
      console.log('✅ Login successful:', loginResponse.data.message);
      console.log('   User:', loginResponse.data.data.user.name, loginResponse.data.data.user.lastname);
      console.log('   Role:', loginResponse.data.data.user.role);
      accessToken = loginResponse.data.data.tokens.accessToken;
      refreshToken = loginResponse.data.data.tokens.refreshToken;
      console.log('   New tokens received ✅');
    } catch (error) {
      console.log('❌ Login failed:', error.response?.data?.message || error.message);
    }
    console.log('');

    // 4. Test token verification
    console.log('4. Testing token verification...');
    try {
      const verifyResponse = await axios.post(`${BASE_URL}/auth/verify`, {}, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      console.log('✅ Token verification successful');
      console.log('   Verified user:', verifyResponse.data.data.user.email);
    } catch (error) {
      console.log('❌ Token verification failed:', error.response?.data?.message || error.message);
    }
    console.log('');

    // 5. Test get profile
    console.log('5. Testing get profile...');
    try {
      const profileResponse = await axios.get(`${BASE_URL}/auth/profile`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      console.log('✅ Profile retrieval successful');
      console.log('   Name:', profileResponse.data.data.user.name, profileResponse.data.data.user.lastname);
      console.log('   Email:', profileResponse.data.data.user.email);
      console.log('   Role:', profileResponse.data.data.user.role);
    } catch (error) {
      console.log('❌ Profile retrieval failed:', error.response?.data?.message || error.message);
    }
    console.log('');

    // 6. Test token refresh
    console.log('6. Testing token refresh...');
    try {
      const refreshResponse = await axios.post(`${BASE_URL}/auth/refresh`, {
        refreshToken: refreshToken
      });
      console.log('✅ Token refresh successful');
      const newAccessToken = refreshResponse.data.data.tokens.accessToken;
      console.log('   New access token received ✅');
      
      // Update access token for next tests
      accessToken = newAccessToken;
    } catch (error) {
      console.log('❌ Token refresh failed:', error.response?.data?.message || error.message);
    }
    console.log('');

    // 7. Test profile update
    console.log('7. Testing profile update...');
    try {
      const updateResponse = await axios.put(`${BASE_URL}/auth/profile`, {
        name: 'Updated Name'
      }, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      console.log('✅ Profile update successful');
      console.log('   Updated name:', updateResponse.data.data.user.name);
    } catch (error) {
      console.log('❌ Profile update failed:', error.response?.data?.message || error.message);
    }
    console.log('');

    // 8. Test logout
    console.log('8. Testing logout...');
    try {
      const logoutResponse = await axios.post(`${BASE_URL}/auth/logout`, {
        refreshToken: refreshToken
      });
      console.log('✅ Logout successful:', logoutResponse.data.message);
    } catch (error) {
      console.log('❌ Logout failed:', error.response?.data?.message || error.message);
    }
    console.log('');

    // 9. Test invalid token
    console.log('9. Testing with invalid token...');
    try {
      await axios.get(`${BASE_URL}/auth/profile`, {
        headers: { Authorization: 'Bearer invalid-token' }
      });
      console.log('❌ Should have failed with invalid token');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Invalid token properly rejected');
      } else {
        console.log('❌ Unexpected error:', error.response?.data?.message || error.message);
      }
    }
    console.log('');

    // 10. Test missing authorization
    console.log('10. Testing missing authorization...');
    try {
      await axios.get(`${BASE_URL}/auth/profile`);
      console.log('❌ Should have failed without authorization');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Missing authorization properly rejected');
      } else {
        console.log('❌ Unexpected error:', error.response?.data?.message || error.message);
      }
    }

    console.log('\n🎉 Authentication service testing completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run tests
if (require.main === module) {
  testAuthService();
}

module.exports = { testAuthService };