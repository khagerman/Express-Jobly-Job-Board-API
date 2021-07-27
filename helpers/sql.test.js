const jwt = require("jsonwebtoken");
const { sqlForPartialUpdate } = require("./sql.js");
const { SECRET_KEY } = require("../config");
const {
  NotFoundError,
  BadRequestError,
  UnauthorizedError,
} = require("../expressError");

describe("sqlForPartialUpdate", function () {
  test("throws error no data", function () {
    try {
      sqlForPartialUpdate({}, {});
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });

  test("works with given data ", function () {
    let jstosql = {
      firstName: "first_name",
      lastName: "last_name",
    };
    let data = { firstName: "Bob", lastName: "George" };
    let sql = sqlForPartialUpdate(data, jstosql);
    expect(sql).toEqual({
      setCols: '"first_name"=$1, "last_name"=$2',
      values: ["Bob", "George"],
    });
  });
});
