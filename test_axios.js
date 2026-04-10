const axios = require('axios');
axios.get('http://localhost:8000/api/purchase/last-purchase-info?item_id=2')
    .then(res => console.log("item_id=2 data:", typeof res.data, JSON.stringify(res.data)))
    .catch(err => console.error(err.message));

axios.get('http://localhost:8000/api/purchase/last-purchase-info?item_id=12')
    .then(res => console.log("item_id=12 data:", typeof res.data, JSON.stringify(res.data)))
    .catch(err => console.error(err.message));
