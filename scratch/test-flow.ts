import axios from 'axios';

async function testFlow() {
  try {
    // 1. Create a plan
    console.log("Creating plan...");
    const createRes = await axios.post('http://localhost:3003/api/admin/vtpass/plans', {
        service: "mtn-data",
        name: "CORPORATE GIFTING - 500.0 MB (30days)",
        variationCode: "2639",
        price: 980,
        apiPrice: 202,
        volume: "500.0 MB",
        validity: "30days",
        planType: "Daily",
        network: "MTN",
        mode: "sandbox",
        apiType: "bardetech"
    });
    console.log("Created plan:", createRes.data);

    // 2. Fetch saved plans
    console.log("Fetching saved plans...");
    const fetchRes = await axios.get('http://localhost:3003/api/admin/vtpass/plans?service=mtn-data&apiType=all&savedOnly=true');
    console.log("Fetched plans:", fetchRes.data);

  } catch (err: any) {
    console.error("Error:", err.message);
    if (err.response) {
      console.error(err.response.data);
    }
  }
}

testFlow();
