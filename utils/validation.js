const Joi = require('joi');

const validateLogin = (data) => {
  const schema = Joi.object({
    username: Joi.string().required(),
    password: Joi.string().required()
  });
  return schema.validate(data);
};

const validateRegister = (data) => {
  const schema = Joi.object({
    username: Joi.string().alphanum().min(3).max(30).required(),
    password: Joi.string().min(6).required(),
    email: Joi.string().email().required(),
    full_name: Joi.string().min(2).max(100).required(),
    role_name: Joi.string().optional(),
    base_names: Joi.array().items(Joi.string()).optional()
  });
  return schema.validate(data);
};

module.exports = {
  validateLogin,
  validateRegister
};
