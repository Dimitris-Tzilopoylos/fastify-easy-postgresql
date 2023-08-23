import { FastifyRequest } from "fastify";

export const formatInput = (data: any, user: any, formatter: any) => {
  try {
    return formatter(data, user);
  } catch (error) {
    return data;
  }
};

export const formatQueryParams = (req: FastifyRequest, opt: any) => {
  return formatInput(req.query, req.user, opt?.queryParamsFormatter);
};

export const formatParams = (req: FastifyRequest, opt: any) => {
  return formatInput(req.params, req.user, opt?.paramsFormatter);
};

export const formatBody = (req: FastifyRequest, opt: any) => {
  return formatInput(req.body, req.user, opt?.bodyFormatter);
};
