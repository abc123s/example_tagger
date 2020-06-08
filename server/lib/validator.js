import Joi from 'joi';

// default options
const defaultOptions = {
  allowUnknown: true,
  stripUnknown: true,
};

function toSingleMessage(joiResult) {
  return joiResult.error.details.map(error => error.message);
}

export function paramsValidator(scheme, options = defaultOptions) {
  return (req, res, next) => {
    const result = Joi.validate(req.params, scheme, options);
    if (result.error) {
      return res.status(400).json(toSingleMessage(result));
    }
    req.params = result.value;
    return next();
  };
}

export function queryValidator(scheme, options = defaultOptions) {
  return (req, res, next) => {
    const result = Joi.validate(req.query, scheme, options);
    if (result.error) {
      return res.status(400).json(toSingleMessage(result));
    }
    req.query = result.value;
    return next();
  };
}

export function bodyValidator(scheme, options = defaultOptions) {
  return (req, res, next) => {
    const result = Joi.validate(req.body, scheme, options);
    if (result.error) {
      return res.status(400).json(toSingleMessage(result));
    }
    req.body = result.value;
    return next();
  };
}

export function userValidator(scheme, options = defaultOptions) {
  return (req, res, next) => {
    const result = Joi.validate(req.user, scheme, options);
    if (result.error) {
      return res.status(400).json(toSingleMessage(result));
    }
    req.user = result.value;
    return next();
  };
}
