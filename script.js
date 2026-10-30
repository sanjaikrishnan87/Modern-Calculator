const screen = document.getElementById("screen");
const expressionDisplay = document.getElementById("expression");
const buttons = document.querySelector(".buttons");

let expression = "";
let justCalculated = false;

function updateDisplay() {
  screen.value = expression || "0";
}

function clearAll() {
  expression = "";
  expressionDisplay.textContent = "";
  justCalculated = false;
  updateDisplay();
}

function appendValue(value) {
  if (justCalculated && /[0-9.]/.test(value)) {
    expression = "";
    expressionDisplay.textContent = "";
  }

  justCalculated = false;

  if (/[+\-*/%]/.test(value)) {
    if (!expression && value !== "-") return;

    if (/[+\-*/%]$/.test(expression)) {
      expression = expression.slice(0, -1);
    }
  }

  if (value === ".") {
    const currentNumber = expression.split(/[+\-*/%]/).pop();
    if (currentNumber.includes(".")) return;
    if (!currentNumber) value = "0.";
  }

  expression += value;
  updateDisplay();
  showPreview();
}

function deleteLast() {
  expression = expression.slice(0, -1);
  justCalculated = false;
  updateDisplay();
  showPreview();
}

function calculate(input) {
  const tokens = input.match(
    /(?:\d+\.?\d*|\.\d+)|[+\-*/%]/g
  );

  if (!tokens || tokens.join("") !== input.replace(/\s/g, "")) {
    throw new Error("Invalid expression");
  }

  let position = 0;

  function parseExpression() {
    let value = parseTerm();

    while (tokens[position] === "+" || tokens[position] === "-") {
      const operator = tokens[position++];
      const right = parseTerm();
      value = operator === "+" ? value + right : value - right;
    }

    return value;
  }

  function parseTerm() {
    let value = parseUnary();

    while (["*", "/", "%"].includes(tokens[position])) {
      const operator = tokens[position++];
      const right = parseUnary();

      if ((operator === "/" || operator === "%") && right === 0) {
        throw new Error("Cannot divide by zero");
      }

      if (operator === "*") value *= right;
      if (operator === "/") value /= right;
      if (operator === "%") value %= right;
    }

    return value;
  }

  function parseUnary() {
    if (tokens[position] === "-") {
      position++;
      return -parseUnary();
    }

    if (tokens[position] === "+") {
      position++;
      return parseUnary();
    }

    const token = tokens[position++];

    if (!token || !/^(?:\d+\.?\d*|\.\d+)$/.test(token)) {
      throw new Error("Invalid number");
    }

    return Number(token);
  }

  const result = parseExpression();

  if (position !== tokens.length || !Number.isFinite(result)) {
    throw new Error("Invalid result");
  }

  return Number(result.toPrecision(12));
}

function showPreview() {
  if (!expression || /[+\-*/%]$/.test(expression)) {
    expressionDisplay.textContent = "";
    return;
  }

  try {
    expressionDisplay.textContent = "= " + calculate(expression);
  } catch {
    expressionDisplay.textContent = "";
  }
}

function calculateResult() {
  if (!expression) return;

  try {
    const result = calculate(expression);
    expressionDisplay.textContent = expression + " =";
    expression = String(result);
    justCalculated = true;
    updateDisplay();
  } catch (error) {
    expressionDisplay.textContent =
      error.message === "Cannot divide by zero"
        ? "Cannot divide by zero"
        : "Invalid expression";

    expression = "";
    screen.value = "Error";
    justCalculated = true;
  }
}

function toggleSign() {
  if (!expression) {
    expression = "-";
  } else {
    const match = expression.match(/(\d*\.?\d+)$/);

    if (match) {
      const number = match[0];
      const start = match.index;
      const before = expression.slice(0, start);

      if (
        before.endsWith("-") &&
        (before.length === 1 || /[+*/%]$/.test(before.slice(0, -1)))
      ) {
        expression = before.slice(0, -1) + number;
      } else {
        expression = before + "-" + number;
      }
    }
  }

  justCalculated = false;
  updateDisplay();
  showPreview();
}

buttons.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;

  if (button.dataset.action === "clear") clearAll();
  else if (button.dataset.action === "delete") deleteLast();
  else if (button.dataset.action === "calculate") calculateResult();
  else if (button.dataset.action === "sign") toggleSign();
  else if (button.dataset.value) appendValue(button.dataset.value);
});

document.addEventListener("keydown", (event) => {
  const key = event.key;

  if (/^[0-9.]$/.test(key)) appendValue(key);
  else if (["+", "-", "*", "/", "%"].includes(key)) appendValue(key);
  else if (key === "Enter" || key === "=") {
    event.preventDefault();
    calculateResult();
  } else if (key === "Backspace") deleteLast();
  else if (key === "Escape" || key.toLowerCase() === "c") clearAll();
});