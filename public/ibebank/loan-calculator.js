 const MAX_LOAN_AMOUNT = Number.MAX_SAFE_INTEGER / 100;
const MAX_TERM_MONTHS = 1200;

function roundMoney(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function calculateFlatLoan(amount, durationDays, annualRatePercent) {
  const principal = Number(amount);
  const duration = Number(durationDays);
  const ratePercent = Number(annualRatePercent);

  if (!Number.isFinite(principal) || principal <= 0 || principal > MAX_LOAN_AMOUNT) {
    throw new Error('Loan amount must be greater than zero.');
  }
  if (!Number.isFinite(duration) || duration <= 0) {
    throw new Error('Loan duration must be greater than zero.');
  }
  if (!Number.isFinite(ratePercent) || ratePercent < 0) {
    throw new Error('Annual interest rate must be zero or greater.');
  }

  const interestRate = (ratePercent / 100) * (duration / 365);
  const interestAmount = roundMoney(principal * interestRate);
  return {
    interestRate,
    interestAmount,
    totalRepayment: roundMoney(principal + interestAmount),
  };
}

export function calculateLoan({ amount, annualRate, years, months, extraPayment = 0 }) {
  const principal = Number(amount);
  const ratePercent = Number(annualRate);
  const termYears = Number(years);
  const termMonths = Number(months);
  const extra = Number(extraPayment);

  if (!Number.isFinite(principal) || principal <= 0 || principal > MAX_LOAN_AMOUNT) {
    throw new Error(`Loan amount must be greater than zero and no more than ${MAX_LOAN_AMOUNT}.`);
  }
  if (!Number.isFinite(ratePercent) || ratePercent < 0) {
    throw new Error('Interest rate must be zero or greater.');
  }
  if (!Number.isInteger(termYears) || termYears < 0 || !Number.isInteger(termMonths) || termMonths < 0) {
    throw new Error('Loan term must use non-negative whole years and months.');
  }
  if (!Number.isFinite(extra) || extra < 0 || extra > MAX_LOAN_AMOUNT) {
    throw new Error('Extra monthly payment must be zero or greater.');
  }

  const paymentCount = termYears * 12 + termMonths;
  if (paymentCount < 1 || paymentCount > MAX_TERM_MONTHS) {
    throw new Error(`Loan term must be between 1 and ${MAX_TERM_MONTHS} months.`);
  }

  const monthlyRate = ratePercent / 12 / 100;
  const unroundedPayment = monthlyRate === 0
    ? principal / paymentCount
    : principal * monthlyRate / -Math.expm1(-paymentCount * Math.log1p(monthlyRate));
  const monthlyPayment = roundMoney(unroundedPayment);

  if (!Number.isFinite(monthlyPayment) || monthlyPayment <= 0) {
    throw new Error('These values produce a monthly payment that cannot be represented.');
  }

  let balance = roundMoney(principal);
  const schedule = [];
  let totalPayment = 0;
  let totalInterest = 0;

  for (let month = 1; month <= paymentCount && balance > 0; month += 1) {
    const interest = roundMoney(balance * monthlyRate);
    const payoffAmount = roundMoney(balance + interest);
    const plannedPayment = roundMoney(monthlyPayment + extra);
    const amountPaid = month === paymentCount
      ? payoffAmount
      : Math.min(plannedPayment, payoffAmount);
    const principalPaid = roundMoney(amountPaid - interest);

    if (principalPaid <= 0) {
      throw new Error('The rounded monthly payment does not reduce the loan balance. Increase the payment or shorten the term.');
    }

    balance = Math.max(0, roundMoney(balance - principalPaid));
    if (balance === 0) {
      schedule.push({ number: month, amount: payoffAmount, interest, principal: roundMoney(payoffAmount - interest), balance: 0 });
      totalPayment = roundMoney(totalPayment + payoffAmount);
      totalInterest = roundMoney(totalInterest + interest);
      break;
    }

    schedule.push({ number: month, amount: amountPaid, interest, principal: principalPaid, balance });
    totalPayment = roundMoney(totalPayment + amountPaid);
    totalInterest = roundMoney(totalInterest + interest);
  }

  if (balance > 0) {
    throw new Error('The loan could not be repaid within the selected term.');
  }

  const annualPayment = roundMoney(monthlyPayment * 12);
  return {
    monthlyPayment,
    totalPayment,
    totalInterest,
    annualPayment,
    mortgageConstant: (annualPayment / principal) * 100,
    schedule,
  };
}
