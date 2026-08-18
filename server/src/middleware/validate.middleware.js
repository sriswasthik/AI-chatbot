/*
| Turns a zod schema into middleware. On success req.body is replaced with
| the parsed result, so controllers only ever see declared, coerced fields.
*/

const formatIssues = (error) =>
  error.issues.map((issue) => issue.message).join(" ");

export const validate = (schema) => {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: formatIssues(result.error),
      });
    }

    req.body = result.data;

    next();
  };
};

/*
| Query-string equivalent. Express 5 exposes req.query as a getter with no
| setter, so the parsed result goes on req.validatedQuery rather than
| overwriting req.query.
*/

export const validateQuery = (schema) => {
  return (req, res, next) => {
    const result = schema.safeParse(req.query);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: formatIssues(result.error),
      });
    }

    req.validatedQuery = result.data;

    next();
  };
};
