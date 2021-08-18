"use strict";

const db = require("../db");
const { NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for companies. */

class Job {
  /** Create a job (from data), update db, return new job data.
   *
   * data should be { title, salary, equity, companyHandle }
   *
   * Returns { id, title, salary, equity, companyHandle }
   **/

  static async create(data) {
    const result = await db.query(
      `INSERT INTO jobs (title,
                             salary,
                             equity,
                             company_handle)
           VALUES ($1, $2, $3, $4)
           RETURNING id, title, salary, equity, company_handle AS "companyHandle"`,
      [data.title, data.salary, data.equity, data.companyHandle]
    );
    let job = result.rows[0];

    return job;
  }

  /** Find all jobs (optional filter on searchFilters).
   *
   * searchFilters
   * - minSalary
   * - hasEquity (true returns only jobs with equity > 0, other values ignored)
   * - title (will find case-insensitive, partial matches)
   *
   * Returns [{ id, title, salary, equity, companyHandle, companyName }, ...]
   * */

  static async findAll(search = {}) {
    let { title, minSalary, hasEquity } = search;
    if (!title && !minSalary && !hasEquity) {
      const jobs = await db.query(
        `SELECT id, title, salary, equity, company_handle AS "companyHandle" FROM jobs`
      );
      return jobs.rows;
    }

    let titleFilter;
    if (title) {
      titleFilter = "%" + title + "%";
    }

    // only equity
    if (hasEquity == "true" && !minSalary && !title) {
      const jobs = await db.query(
        `SELECT id, title, salary, equity, company_handle AS "companyHandle" FROM jobs WHERE equity > 0`
      );
      return jobs.rows;
      // only min
    } else if (!!minSalary && !hasEquity && !title) {
      const jobs = await db.query(
        `SELECT title, salary, equity, company_handle AS "companyHandle" FROM jobs WHERE salary >= $1`,
        [+minSalary]
      );
      return jobs.rows;
      // only name
    } else if (!!title && !hasEquity && !minSalary) {
      const jobs = await db.query(
        `SELECT id, title, salary, equity, company_handle AS "companyHandle" FROM jobs WHERE title ILIKE $1`,
        [titleFilter]
      );
      return jobs.rows;
      //  no equity
    } else if (!hasEquity && !!minSalary && !!title) {
      const jobs = await db.query(
        ` SELECT id, title, salary, equity, company_handle AS "companyHandle" FROM jobs WHERE title ILIKE $1 AND salary >= $2`,
        [titleFilter, +minSalary]
      );
      return jobs.rows;
      // no min
    } else if (hasEquity == "true" && !minSalary && !!title) {
      const jobs = await db.query(
        `SELECT id, title, salary, equity, company_handle AS "companyHandle" FROM jobs WHERE title ILIKE $1 AND  +equity > 0`,
        [titleFilter]
      );
      return jobs.rows;
    } // all filters
    else if (!!minSalary && hasEquity == "true" && !!title) {
      const jobs = await db.query(
        `SELECT id, title, salary, equity, company_handle AS "companyHandle" FROM jobs WHERE title ILIKE $1 AND salary >= $2 AND +equity > 0`,
        [titleFilter, +minSalary]
      );
      return jobs.rows;
    } else {
      // only min and equity
      const jobs = await db.query(
        `SELECT id, title, salary, equity, company_handle AS "companyHandle" FROM jobs WHERE salary >= $1 AND +equity > 0`,
        [+minSalary]
      );
      return jobs.rows;
    }
  }

  /** Given a job id, return data about job.
   *
   * Returns { id, title, salary, equity, companyHandle, company }
   *   where company is { handle, name, description, numEmployees, logoUrl }
   *
   * Throws NotFoundError if not found.
   **/

  static async get(id) {
    const jobRes = await db.query(
      `SELECT id,
                  title,
                  salary,
                  equity,
                  company_handle AS "companyHandle"
           FROM jobs
           WHERE id = $1`,
      [id]
    );

    const job = jobRes.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);

    const companiesRes = await db.query(
      `SELECT handle,
                  name,
                  description,
                  num_employees AS "numEmployees",
                  logo_url AS "logoUrl"
           FROM companies
           WHERE handle = $1`,
      [job.companyHandle]
    );

    delete job.companyHandle;
    job.company = companiesRes.rows[0];

    return job;
  }

  /** Update job data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain
   * all the fields; this only changes provided ones.
   *
   * Data can include: { title, salary, equity }
   *
   * Returns { id, title, salary, equity, companyHandle }
   *
   * Throws NotFoundError if not found.
   */

  static async update(id, data) {
    const { setCols, values } = sqlForPartialUpdate(data, {});
    const idVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE jobs 
                      SET ${setCols} 
                      WHERE id = ${idVarIdx} 
                      RETURNING id, 
                                title, 
                                salary, 
                                equity,
                                company_handle AS "companyHandle"`;
    const result = await db.query(querySql, [...values, id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);

    return job;
  }

  /** Delete given job from database; returns undefined.
   *
   * Throws NotFoundError if company not found.
   **/

  static async remove(id) {
    const result = await db.query(
      `DELETE
           FROM jobs
           WHERE id = $1
           RETURNING id`,
      [id]
    );
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);
  }
}

module.exports = Job;
