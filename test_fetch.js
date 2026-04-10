fetch('http://localhost:8000/api/purchase/last-purchase-info?item_id=2')
    .then(res => res.text())
    .then(text => console.log("item_id=2 data:", text))
    .catch(err => console.error(err.message));

fetch('http://localhost:8000/api/purchase/last-purchase-info?item_id=12')
    .then(res => res.text())
    .then(text => console.log("item_id=12 data:", text))
    .catch(err => console.error(err.message));
