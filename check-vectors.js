const fs = require('fs');
const vectors = require('./assets/vectors-clean.json');

// Test that all required keys exist
console.log('Hash exists:', !!vectors.hash);
console.log('Numbers count:', Object.keys(vectors.numbers).length);
console.log('Platforms count:', Object.keys(vectors.platforms).length);
