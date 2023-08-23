import { FastifyRequest, FastifyReply } from "fastify";
import server from "../../app";
import { aggregator } from "../../utils/aggregator";
import { toWhereFiltersWithColumns } from "../../utils/filters";
import { formatBody, formatQueryParams } from "../../utils/formatters";

export const get = (opt: any) =>
  async function (req: FastifyRequest, reply: FastifyReply) {
    const { page, view, ...where } = formatQueryParams(req, opt);

    if (!opt.pagination) {
      reply.code(200).send(
        await req.model.find({
          where: toWhereFiltersWithColumns(req.model.registeredFilters, where),
          ...(opt.include && { include: opt.include(req, req.user) }),
        })
      );
    } else {
      reply.code(200).send(
        await aggregator(
          {
            page,
            view,
            where: toWhereFiltersWithColumns(
              req.model.registeredFilters,
              where
            ),
          },
          async (where) => {
            const { count } = await req.model.aggregate({
              _count: true,
              where,
            });
            return count as number;
          },
          ({ where, limit, offset }) =>
            req.model.find({
              where,
              limit,
              offset,
              ...(opt.include && { include: opt.include(req, req.user) }),
            })
        )
      );
    }
  };

export const post = (opt: any) =>
  async function (req: FastifyRequest, reply: FastifyReply) {
    const inputData = formatBody(req, opt);
    const data = await req.model.create(inputData);
    if (!data) {
      throw server.httpErrors.internalServerError(
        `${req.model.table} entity failed to be created`
      );
    }
    reply.code(201).send(data);
  };

export const put = (opt: any) =>
  async function (req: FastifyRequest, reply: FastifyReply) {
    const queryParamas = formatQueryParams(req, opt);
    const update = formatBody(req, opt);
    const where = toWhereFiltersWithColumns(
      req.model.registeredFilters,
      queryParamas
    );
    const data = await req.model.update({ update, where });
    if (!data?.length) {
      throw server.httpErrors.internalServerError(
        `${req.model.table} entity/-ies failed to be updated`
      );
    }
    reply.code(200).send(data);
  };

export const remove = (opt: any) =>
  async function (req: FastifyRequest, reply: FastifyReply) {
    const where = toWhereFiltersWithColumns(
      req.model.registeredFilters,
      formatQueryParams(req, opt)
    );
    const data = await req.model.delete({ where });
    if (!data?.length) {
      throw server.httpErrors.internalServerError(
        `${req.model.table} entity/-ies failed to be deleted`
      );
    }
    reply.code(200).send(data);
  };
