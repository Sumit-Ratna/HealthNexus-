const axios = require('axios');

const BASE_URL = 'https://healthnexus-c3sa.onrender.com/api';

async function testConnection() {
    try {
        console.log("1. Creating a Doctor...");
        const docPhone = '9999999999';
        const docRes = await axios.post(`${BASE_URL}/auth/register`, {
            phone: docPhone,
            name: 'Dr. Test',
            role: 'doctor',
            specialization: 'Testing',
            hospital_name: 'Test Hospital',
            otp: '123456'
        });
        const doctor = docRes.data.user;
        const doctorQrId = doctor.doctor_qr_id;
        console.log(`✅ Doctor created. QR ID: ${doctorQrId}`);

        console.log("\n2. Creating a Patient...");
        const patPhone = '8888888888';
        const patRes = await axios.post(`${BASE_URL}/auth/register`, {
            phone: patPhone,
            name: 'Patient Test',
            role: 'patient',
            otp: '123456'
        });
        const patientToken = patRes.data.accessToken;
        console.log(`✅ Patient created. Token: ${patientToken.substring(0, 10)}...`);

        console.log("\n3. searching for Doctor (Case Insensitive Test)...");
        const searchRes = await axios.get(`${BASE_URL}/connect/doctor/qr/${doctorQrId.toLowerCase()}`, {
            headers: { Authorization: `Bearer ${patientToken}` }
        });
        console.log(`✅ Search result: Found Dr. ${searchRes.data.name}`);

        console.log("\n4. Linking Patient to Doctor...");
        const linkRes = await axios.post(`${BASE_URL}/connect/doctor/link`, {
            doctor_qr_id: doctorQrId.toLowerCase()
        }, {
            headers: { Authorization: `Bearer ${patientToken}` }
        });
        console.log(`✅ Link result: ${linkRes.data.message}`);

        console.log("\n5. Testing Family Connection...");
        const famRes = await axios.post(`${BASE_URL}/family/add`, {
            phone: docPhone, // Adding the doctor as family for testing
            relation: 'Friend'
        }, {
            headers: { Authorization: `Bearer ${patientToken}` }
        });
        console.log(`✅ Family result: ${famRes.data.message}`);

        console.log("\n🎉 ALL TESTS PASSED!");
    } catch (err) {
        console.error("\n❌ TEST FAILED:");
        if (err.response) {
            console.error(`Status: ${err.response.status}`);
            console.error(`Data:`, err.response.data);
        } else {
            console.error(err.message);
        }
    }
}

testConnection();
