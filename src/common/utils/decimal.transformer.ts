/** MySQL DECIMAL columns come back as strings — map them to numbers. */
export const decimalTransformer = {
  to: (value?: number | null) => value,
  from: (value?: string | null) =>
    value === undefined || value === null ? value : parseFloat(value),
};
