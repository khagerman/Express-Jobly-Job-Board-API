const { BadRequestError } = require("../expressError");

// This takes data that needs to be updated and an object containing the correct sql column names ( {
//   firstName: "first_name",
//   lastName: "last_name",
//   isAdmin: "is_admin",
// })turns an
// object into a sql set with correct names and placeholders (like $1) for protection of data
// and a an array of values
// {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2'] ["aliya", 32]

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  // makes an array of keys of given data like "firstName"
  const keys = Object.keys(dataToUpdate);
  // if data is empty throw error
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map(
    (colName, idx) => `"${jsToSql[colName] || colName}"=$${idx + 1}`
  );

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

module.exports = { sqlForPartialUpdate };
