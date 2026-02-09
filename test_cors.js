const axios = require('axios');

async function testCors() {
    const baseUrl = 'https://healthnexus-c3sa.onrender.com';
    try {
        console.log("Testing CORS Preflight (OPTIONS)...");
        const res = await axios({
            method: 'OPTIONS',
            url: `${baseUrl}/api/auth/profile`,
            headers: {
                'Access-Control-Request-Method': 'GET',
                'Access-Control-Request-Headers': 'content-type,authorization',
                'Origin': 'http://localhost:5173'
            }
        });
        console.log("CORS Status:", res.status);
        console.log("CORS Headers:", res.headers);

        console.log("\nTesting Actual Request with Origin...");
        const res2 = await axios.get(`${baseUrl}/`, {
            headers: { 'Origin': 'http://localhost:5173' }
        });
        console.log("Request Status:", res2.status);
        console.log("Access-Control-Allow-Origin:", res2.headers['access-control-allow-origin']);

    } catch (err) {
        console.error("CORS TEST FAILED:");
        if (err.response) {
            console.error(`Status: ${err.response.status}`);
            console.error(`Headers:`, err.response.headers);
        } else {
            console.error(err.message);
        }
    }
}

testCors();
