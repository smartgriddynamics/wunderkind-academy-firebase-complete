import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateLoan } from '../public/ibebank/loan-calculator.js';

test('calculates the requested 20-year, 20% loan and first payment accurately', () => {
  const result = calculateLoan({
    amount: 2_000_000,
    annualRate: 20,
    years: 20,
    months: 2,
  });

  assert.equal(result.monthlyPayment, 33955.19);
  assert.equal(result.schedule[0].interest, 33333.33);
  assert.equal(result.schedule[0].principal, 621.86);
  assert.equal(result.schedule[0].balance, 1999378.14);
  assert.ok(Math.abs(result.mortgageConstant - 20.373114) < 0.00001);
  assert.equal(result.schedule.at(-1).balance, 0);
  assert.ok(Math.abs(result.totalPayment - result.schedule.reduce((sum, row) => sum + row.amount, 0)) < 0.01);
  assert.ok(Math.abs(result.totalInterest - result.schedule.reduce((sum, row) => sum + row.interest, 0)) < 0.01);
  assert.equal(Math.round(result.totalInterest * 100), Math.round((result.totalPayment - 2_000_000) * 100));
});

test('supports zero-interest loans and rounds the final payment to the remaining balance', () => {
  const result = calculateLoan({ amount: 100, annualRate: 0, years: 0, months: 3 });

  assert.equal(result.monthlyPayment, 33.33);
  assert.deepEqual(result.schedule.map(row => row.principal), [33.33, 33.33, 33.34]);
  assert.equal(result.totalInterest, 0);
  assert.equal(result.schedule.at(-1).balance, 0);
});

test('extra monthly payments shorten the schedule and are included in totals', () => {
  const regular = calculateLoan({ amount: 1200, annualRate: 12, years: 1, months: 0 });
  const accelerated = calculateLoan({ amount: 1200, annualRate: 12, years: 1, months: 0, extraPayment: 100 });

  assert.ok(accelerated.schedule.length < regular.schedule.length);
  assert.ok(accelerated.totalInterest < regular.totalInterest);
  assert.equal(accelerated.schedule.at(-1).balance, 0);
});

test('supports large principal amounts within precise cent arithmetic', () => {
  const result = calculateLoan({ amount: 1_000_000_000_000, annualRate: 4.5, years: 30, months: 0 });

  assert.ok(Number.isFinite(result.monthlyPayment));
  assert.equal(result.schedule.at(-1).balance, 0);
});

test('rejects invalid amounts, rates, and terms', () => {
  assert.throws(() => calculateLoan({ amount: 0, annualRate: 5, years: 1, months: 0 }), /Loan amount/);
  assert.throws(() => calculateLoan({ amount: 100, annualRate: -1, years: 1, months: 0 }), /Interest rate/);
  assert.throws(() => calculateLoan({ amount: 100, annualRate: 5, years: 0, months: 0 }), /Loan term/);
  assert.throws(() => calculateLoan({ amount: 100, annualRate: 5, years: 101, months: 0 }), /Loan term/);
});
