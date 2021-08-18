"use strict";

const request = require("supertest");

const app = require("../app");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,

  u1Token,
  u3Token,
  jobIDs,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

// post

describe("POST /jobs", function () {
  test("ok for admin", async function () {
    const resp = await request(app)
      .post(`/jobs`)
      .send({
        companyHandle: "c1",
        title: "itsajob",
        salary: 10,
        equity: "0.1234",
      })
      .set("authorization", `Bearer ${u3Token}`);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      job: {
        id: expect.any(Number),
        companyHandle: "c1",
        title: "itsajob",
        salary: 10,
        equity: "0.1234",
      },
    });
  });

  test("NOT ALLOWED for regular users", async function () {
    const resp = await request(app)
      .post(`/jobs`)
      .send({
        companyHandle: "c1",
        title: "ICANTADDTHISJOB",
        salary: 1000000000000,
        equity: "0",
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("can't have missing data", async function () {
    const resp = await request(app)
      .post(`/jobs`)
      .send({
        salary: 1000000000000,
      })
      .set("authorization", `Bearer ${u3Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("can't have invalid data", async function () {
    const resp = await request(app)
      .post(`/jobs`)
      .send({
        companyHandle: 12333333,
        title: "thats not a COMPANY",
        salary: 12233,
        equity: "0",
      })
      .set("authorization", `Bearer ${u3Token}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** GET /jobs */

describe("GET /jobs", function () {
  test("ok for anon", async function () {
    const resp = await request(app).get(`/jobs`);
    expect(resp.body).toEqual({
      jobs: [
        {
          id: expect.any(Number),
          title: "Job1",
          salary: 100,
          equity: "0.3",
          companyHandle: "c1",
        },
        {
          id: expect.any(Number),
          title: "Job2",
          salary: 100000,
          equity: "0",
          companyHandle: "c2",
        },
      ],
    });
  });

  test("can filter", async function () {
    const resp = await request(app).get(`/jobs`).query({ title: "1" });
    expect(resp.body).toEqual({
      jobs: [
        {
          id: expect.any(Number),
          title: "Job1",
          salary: 100,
          equity: "0.3",
          companyHandle: "c1",
        },
      ],
    });
  });

  test("bad request on invalid filter", async function () {
    const resp = await request(app)
      .get(`/jobs`)
      .query({ minSalary: 20000000000, notarealfilter: "fake" });
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** GET /jobs/:id */

describe("GET /jobs/:id", function () {
  test("works for anon", async function () {
    const resp = await request(app).get(`/jobs/${jobIDs[0]}`);
    console.log(jobIDs);

    expect(resp.body).toEqual({
      job: {
        id: expect.any(Number),
        title: "Job1",
        salary: 100,
        equity: "0.3",

        company: {
          description: "Desc1",
          handle: "c1",
          logoUrl: "http://c1.img",
          name: "C1",
          numEmployees: 1,
        },
      },
    });
  });

  test("not found for bad id", async function () {
    const resp = await request(app).get(`/jobs/0`);
    expect(resp.statusCode).toEqual(404);
  });
});

/************************************** PATCH /jobs/:id */

describe("PATCH /jobs/:id", function () {
  test("works for admin", async function () {
    const resp = await request(app)
      .patch(`/jobs/${+jobIDs[0]}`)
      .send({
        title: "JOBONE",
      })
      .set("authorization", `Bearer ${u3Token}`);
    expect(resp.body).toEqual({
      job: {
        id: expect.any(Number),
        title: "JOBONE",
        salary: 100,
        equity: "0.3",
        companyHandle: "c1",
      },
    });
  });

  test("regular lowly users cannot path data", async function () {
    const resp = await request(app)
      .patch(`/jobs/${+jobIDs[0]}`)
      .send({
        title: "ICANTDOTHIS",
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found for bad id", async function () {
    const resp = await request(app)
      .patch(`/jobs/0`)
      .send({
        salary: 12222222222222,
      })
      .set("authorization", `Bearer ${u3Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request with invalid data", async function () {
    const resp = await request(app)
      .patch(`/jobs/${jobIDs[0]}}`)
      .send({
        salary: "onebajilianddollars",
      })
      .set("authorization", `Bearer ${u3Token}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** DELETE /jobs/:id */

describe("DELETE /jobs/:id", function () {
  test("works for admin", async function () {
    // console.log(jobIDs[0]);
    const resp = await request(app)
      .delete(`/jobs/${jobIDs[0]}`)
      .set("authorization", `Bearer ${u3Token}`);
    expect(resp.body).toEqual({ deleted: jobIDs[0] });
  });

  test("Users can't delete other users", async function () {
    const resp = await request(app)
      .delete(`/jobs/${+jobIDs[0]}}`)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for anon", async function () {
    const resp = await request(app).delete(`/jobs/${+jobIDs[0]}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found for id that doesn't exist", async function () {
    const resp = await request(app)
      .delete(`/jobs/0`)
      .set("authorization", `Bearer ${u3Token}`);
    expect(resp.statusCode).toEqual(404);
  });
});
