export const normalizeNumber = (value: any, defaultValue = 0) => {
  return isNaN(value) ? defaultValue : parseInt(value);
};

export const toUpperCaseModelTitle = (value: string) => {
  return value
    .split("_")
    .map((x) =>
      x
        .toLowerCase()
        .split("")
        .map((x, idx) => (idx === 0 ? x.toUpperCase() : x))
        .join("")
    )
    .join(" ");
};

export const toKebabCase = (val: string) =>
  val
    .split("")
    .map((x) => x.toLowerCase())
    .join("")
    .split("_")
    .join("-");

export const toCamelCase = (val: string) =>
  val
    .split("_")
    .map((x, idx) => (idx === 0 ? x.toLowerCase() : toUpperCaseModelTitle(x)))
    .join("");

export const toSchemaRef = (val: string, prefix = "") =>
  `${toCamelCase(val)}${prefix}Schema`;
