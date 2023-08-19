export const toWhereFiltersWithColumns = (config: any, where: any) => {
  try {
    return Object.entries(where).reduce((acc, [key, value]) => {
      if (!!config[key]) {
        Object.assign(acc, config[key](value, where, acc));
      }
      return acc;
    }, {} as any);
  } catch (error) {
    return {};
  }
};
