// Script para generar hash BCrypt de admin123
const bcrypt = require('bcryptjs');

const password = 'admin123';
const saltRounds = 10;

console.log('Generando hash BCrypt para:', password);
console.log('='.repeat(50));

// Generar hash
const hash = bcrypt.hashSync(password, saltRounds);
console.log('Hash generado:', hash);

// Verificar que funciona
const isValid = bcrypt.compareSync(password, hash);
console.log('Verificación exitosa:', isValid);

console.log('\nPara usar en data.sql:');
console.log(`'${hash}'`);
