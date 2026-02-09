const axios = require('axios');

async function checkApi() {
    const baseUrl = 'https://healthnexus-c3sa.onrender.com';
    try {
        console.log("Checking Health Check...");
        const health = await axios.get(`${baseUrl}/`);
        console.log("Health Check Response:", health.data);

        console.log("\nChecking Family Add (+91 6205904440)...");
        try {
            await axios.post(`${baseUrl}/api/family/add`, { phone: '+91 6205904440', relation: 'Family' });
        } catch (err) {
            console.log("Family Add (No Token) Status:", err.response?.status);
            console.log("Family Add (No Token) Error:", err.response?.data);
        }

    } catch (err) {
        console.error("API CHECK FAILED:");
        if (err.response) {
            console.error(`Status: ${err.response.status}`);
            console.error(`Data:`, err.response.data);
        } else {
            console.error(err.message);
        }
    }
}

checkApi();
