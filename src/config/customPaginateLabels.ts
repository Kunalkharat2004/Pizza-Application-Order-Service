export interface ICustomPaginateLabels {
  docs: string;
  totalDocs: string;
  limit: string;
  page: string;
}

export const customPaginateLabels: ICustomPaginateLabels = {
  docs: "data",
  totalDocs: "total",
  limit: "perPage",
  page: "currentPage",
};
