export const productKeys = {
  list: (params) => ["products", "list", params],
  detail: (slug) => ["products", "detail", slug],
  related: (slug) => ["products", "related", slug],
};
