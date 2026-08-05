export const productKeys = {
  list: (params) => ["products", "list", params],
  // Sibling of `list`, deliberately NOT nested under it: useQuery caches
  // { data, meta } while useInfiniteQuery caches { pages, pageParams }, so a
  // key that could ever hash equal to a list key would corrupt the entry
  // CollectionPage and HomePage read.
  infinite: (params) => ["products", "infinite", params],
  detail: (slug) => ["products", "detail", slug],
  related: (slug) => ["products", "related", slug],
};
