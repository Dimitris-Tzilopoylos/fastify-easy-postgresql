import { FastifyRequest, FastifyReply } from "fastify";
import server from "../../app";
import {
  aggregator,
  withResponseFormatter,
  withSimpleResponseFormatter,
} from "../../utils/aggregator";
import { toWhereFiltersWithColumns } from "../../utils/filters";
import {
  formatBody,
  formatParams,
  formatQueryParams,
} from "../../utils/formatters";
import { z } from "zod";

export const get = (opt: any) =>
  async function (req: FastifyRequest, reply: FastifyReply) {
    const { page, view, ...where } = formatQueryParams(req, opt);

    if (!opt.pagination) {
      reply.code(200).send(
        await withResponseFormatter(
          req.model.find({
            where: toWhereFiltersWithColumns(
              req.model.registeredFilters,
              where
            ),
            ...(opt.include && { include: opt.include(req, req.user) }),
          }),
          req.user,
          opt
        )
      );
    } else {
      reply.code(200).send(
        await withResponseFormatter(
          aggregator(
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
          ),
          req.user,
          opt
        )
      );
    }
  };

export const getByIdentifier = (opt: any) =>
  async function (
    req: FastifyRequest<{ Params?: z.infer<typeof opt.modelParamsZodSchema> }>,
    reply: FastifyReply
  ) {
    const id = formatParams(req, opt)?.[opt.identifier];
    const data = await withResponseFormatter(
      req.model.findOne({
        where: { [opt.identifier]: { _eq: id } },
        ...(opt.include && { include: opt.include(req, req.user) }),
      }),
      req.user,
      opt
    );

    if (!data) {
      throw server.httpErrors.notFound();
    }

    reply.code(200).send(data);
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
    reply.code(201).send(withSimpleResponseFormatter(data, req.user, opt));
  };

export const put = (opt: any) =>
  async function (
    req: FastifyRequest<{
      Querystring?: z.infer<typeof opt.modelQueryParamsZodSchema>;
    }>,
    reply: FastifyReply
  ) {
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
    reply.code(200).send(withSimpleResponseFormatter(data, req.user, opt));
  };

export const putByIdentifier = (opt: any) =>
  async function (
    req: FastifyRequest<{
      Params?: z.infer<typeof opt.modelParamsZodSchema>;
    }>,
    reply: FastifyReply
  ) {
    const update = formatBody(req, opt);
    const where = toWhereFiltersWithColumns(
      req.model.registeredFilters,
      formatParams(req, opt)
    );
    const data = await req.model.update({ update, where });
    if (!data?.length) {
      throw server.httpErrors.internalServerError(
        `${req.model.table} entity/-ies failed to be updated`
      );
    }
    reply.code(200).send(withSimpleResponseFormatter(data, req.user, opt));
  };

export const remove = (opt: any) =>
  async function (
    req: FastifyRequest<{
      Querystring?: z.infer<typeof opt.modelQueryParamsZodSchema>;
    }>,
    reply: FastifyReply
  ) {
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
    reply.code(200).send(withSimpleResponseFormatter(data, req.user, opt));
  };

export const removeByIdentifier = (opt: any) =>
  async function (
    req: FastifyRequest<{
      Params?: z.infer<typeof opt.modelParamsZodSchema>;
    }>,
    reply: FastifyReply
  ) {
    const where = toWhereFiltersWithColumns(
      req.model.registeredFilters,
      formatParams(req, opt)
    );
    const data = await req.model.delete({ where });
    if (!data?.length) {
      throw server.httpErrors.internalServerError(
        `${req.model.table} entity/-ies failed to be deleted`
      );
    }
    reply.code(200).send(withSimpleResponseFormatter(data, req.user, opt));
  };
