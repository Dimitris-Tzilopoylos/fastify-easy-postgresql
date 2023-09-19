import { DB } from "easy-psql";

export const aggregator = async (
  args: any,
  countPromise: (where: any) => Promise<number>,
  dataPromise: (args: {
    where: any;
    limit: number;
    offset: number;
  }) => Promise<any[]>
) => {
  const { page, view = 10, where } = args;

  try {
    const total = await countPromise(where);
    const paginationData = DB.paginator(page, view, total);
    if (!total) {
      return { ...paginationData, results: [] as any[] };
    }

    const results = (await dataPromise({
      where,
      limit: paginationData.per_page,
      offset: paginationData.skip,
    })) as any[];

    return { ...paginationData, results };
  } catch (error) {
    return {
      total: 0,
      view,
      page,
      skip: 0,
      limit: 0,
      per_page: view,
      results: [] as any,
    };
  }
};

export const withSimpleResponseFormatter = (data: any, user: any, opt: any) => {
  if (!opt?.responseFormatter) {
    return data;
  }
  return opt.responseFormatter(data, user);
};

export const withResponseFormatter = async (
  promise: any,
  user: any,
  opt: any
) => {
  if (!opt?.responseFormatter) {
    return await promise;
  }

  return opt.responseFormatter(await promise, user);
};
