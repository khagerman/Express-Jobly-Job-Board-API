"use strict";

const { NotFoundError, BadRequestError } = require("../expressError");
const db = require("../db.js");
const Job = require("./job.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  JobIDs,
  jobIDs,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe("create", function () {
  let newJob = {
    companyHandle: "c1",
    title: "Testing123",
    salary: 100000,
    equity: "0.1",
  };

  test("works", async function () {
    let job = await Job.create(newJob);
    expect(job).toEqual({
      ...newJob,
      id: expect.any(Number),
    });
  });
});

/************************************** findAll */

describe("findAll", function () {
  test("works: no filter", async function () {
    let jobs = await Job.findAll();
    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "Job1",
        salary: 100,
        equity: "0.12",
        companyHandle: "c1",
      },
      {
        id: expect.any(Number),
        title: "Job2",
        salary: 200000,
        equity: "0.2",
        companyHandle: "c1",
      },
      {
        id: expect.any(Number),
        title: "Job3",
        salary: 300,
        equity: "0",
        companyHandle: "c2",
      },
    ]);
  });

  test("works: filter min salary", async function () {
    let jobs = await Job.findAll({ minSalary: 200 });
    expect(jobs).toEqual([
      {
        companyHandle: "c1",
        equity: "0.2",
        salary: 200000,
        title: "Job2",
      },
      {
        companyHandle: "c2",
        equity: "0",
        salary: 300,
        title: "Job3",
      },
    ]);
  });

  test("works: filter equity", async function () {
    let jobs = await Job.findAll({ hasEquity: true });
    expect(jobs).toEqual([
      {
        companyHandle: "c1",
        equity: "0.12",
        id: expect.any(Number),
        salary: 100,
        title: "Job1",
      },
      {
        companyHandle: "c1",
        equity: "0.2",
        id: expect.any(Number),
        salary: 200000,
        title: "Job2",
      },
    ]);
  });

  test("works: filter min salary & equity", async function () {
    let jobs = await Job.findAll({ minSalary: 250, hasEquity: true });
    expect(jobs).toEqual([
      {
        companyHandle: "c1",
        equity: "0.2",
        id: expect.any(Number),
        salary: 200000,
        title: "Job2",
      },
    ]);
  });

  test("works: filter by name", async function () {
    let jobs = await Job.findAll({ title: "1" });
    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "Job1",
        salary: 100,
        equity: "0.12",
        companyHandle: "c1",
      },
    ]);
  });
});

/************************************** get */

describe("get", function () {
  test("get by id", async function () {
    console.log(jobIDs);
    let job = await Job.get(jobIDs[0]);
    expect(job).toEqual({
      id: expect.any(Number),
      title: "Job1",
      salary: 100,
      equity: "0.12",
      company: {
        handle: "c1",
        name: "C1",
        description: "Desc1",
        numEmployees: 1,
        logoUrl: "http://c1.img",
      },
    });
  });

  test("fails if id that does not exist", async function () {
    try {
      await Job.get(0);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/************************************** update */

describe("update", function () {
  let update = {
    title: "Updatedstuff",
    salary: 5000000,
    equity: "0.1",
  };
  test("works", async function () {
    let job = await Job.update(jobIDs[0], update);
    expect(job).toEqual({
      id: jobIDs[0],
      companyHandle: "c1",
      ...update,
    });
  });

  test("not found if no job with id", async function () {
    try {
      await Job.update(0, {
        title: "THISSHOULDFAIL",
      });
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("throws err if no data", async function () {
    try {
      await Job.update(jobIDs[0], {});
      fail();
    } catch (err) {
      console.log(err);
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** remove */

describe("remove", function () {
  test("works", async function () {
    await Job.remove(jobIDs[0]);
    const res = await db.query("SELECT id FROM jobs WHERE id=$1", [jobIDs[0]]);
    expect(res.rows.length).toEqual(0);
  });

  test("not found if no job", async function () {
    try {
      await Job.remove(0);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});
