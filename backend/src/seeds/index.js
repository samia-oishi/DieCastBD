import { connectDB, disconnectDB } from "../config/db.js";
import { slugify } from "../utils/slugify.js";
import { Brand } from "../modules/brands/brand.model.js";
import { Category } from "../modules/categories/category.model.js";
import { Product } from "../modules/products/product.model.js";
import { Settings } from "../modules/settings/settings.model.js";
import { brands, categories, products } from "./data/catalog.data.js";
import { settingsSeed } from "./data/settings.data.js";

async function seedBrands() {
  const keyToId = {};
  for (const [index, brand] of brands.entries()) {
    const slug = slugify(brand.name);
    const doc = await Brand.findOneAndUpdate(
      { slug },
      { name: brand.name, slug, description: brand.description, sortOrder: index },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
    );
    keyToId[brand.key] = doc._id;
  }
  return keyToId;
}

async function seedCategories() {
  const keyToId = {};
  for (const [index, category] of categories.entries()) {
    const slug = slugify(category.name);
    const doc = await Category.findOneAndUpdate(
      { slug },
      { name: category.name, slug, description: category.description, sortOrder: index },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
    );
    keyToId[category.key] = doc._id;
  }
  return keyToId;
}

async function seedProducts(brandIds, categoryIds) {
  let created = 0;
  let updated = 0;

  for (const item of products) {
    const { brandKey, categoryKey, ...rest } = item;
    const slug = slugify(rest.title);

    const payload = {
      ...rest,
      slug,
      brand: brandIds[brandKey],
      category: [categoryIds[categoryKey]],
      status: "active",
    };

    const existing = await Product.findOne({ sku: item.sku.toUpperCase() });
    await Product.findOneAndUpdate({ sku: item.sku.toUpperCase() }, payload, {
      upsert: true,
      returnDocument: "after",
      setDefaultsOnInsert: true,
      runValidators: true,
    });

    existing ? updated++ : created++;
  }

  return { created, updated };
}

async function seedSettings() {
  // $setOnInsert so re-running the seed never clobbers admin-edited settings —
  // unlike the catalog above, this is CMS content, not a source-of-truth import.
  const before = await Settings.findOneAndUpdate(
    {},
    { $setOnInsert: settingsSeed },
    { upsert: true, setDefaultsOnInsert: true }
  );
  return before === null;
}

async function run() {
  await connectDB();

  const brandIds = await seedBrands();
  console.log(`Brands: ${Object.keys(brandIds).length} upserted`);

  const categoryIds = await seedCategories();
  console.log(`Categories: ${Object.keys(categoryIds).length} upserted`);

  const { created, updated } = await seedProducts(brandIds, categoryIds);
  console.log(`Products: ${created} created, ${updated} updated (${products.length} total)`);

  const settingsCreated = await seedSettings();
  console.log(settingsCreated ? "Settings: created with defaults" : "Settings: already exists, left untouched");

  await disconnectDB();
  console.log("Seed complete.");
}

run().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
