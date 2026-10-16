"use client";

import { useMemo, useState } from "react";
import { ProductCard } from "@/components/product-card";
import type { Product, ProductCategory } from "@/data/catalog";

type ServicesCatalogProps = {
  categories: readonly ProductCategory[];
  products: readonly Product[];
  allFilter: { id: string; name: string; icon: string; description: string };
};

export function ServicesCatalog({ categories, products, allFilter }: ServicesCatalogProps) {
  const [selectedCategoryId, setSelectedCategoryId] = useState(allFilter.id);
  const selectedCategory = categories.find((category) => category.id === selectedCategoryId);
  const filteredProducts = useMemo(
    () => selectedCategoryId === allFilter.id ? products : products.filter((product) => product.categoryIds.includes(selectedCategoryId)),
    [allFilter.id, products, selectedCategoryId],
  );
  const selectedName = selectedCategory?.name ?? allFilter.name;

  return (
    <section className="services-catalog-section" aria-labelledby="catalog-title">
      <div className="page-container">
        <div className="category-toolbar" aria-label="產品分類篩選">
          <p className="category-toolbar-note">目前分類為開發階段暫定架構，後續可由集中資料或 Supabase 調整。</p>
          <div className="category-filter-list" role="group" aria-label="選擇產品分類">
            <button aria-pressed={selectedCategoryId === allFilter.id} className="category-filter" onClick={() => setSelectedCategoryId(allFilter.id)} type="button">
              <span aria-hidden="true">{allFilter.icon}</span><strong>{allFilter.name}</strong><small>{products.length} 項</small>
            </button>
            {categories.map((category) => {
              const count = products.filter((product) => product.categoryIds.includes(category.id)).length;
              return <button aria-pressed={selectedCategoryId === category.id} className="category-filter" key={category.id} onClick={() => setSelectedCategoryId(category.id)} type="button"><span aria-hidden="true">{category.icon}</span><strong>{category.name}</strong><small>{count} 項</small></button>;
            })}
          </div>
        </div>

        <div className="catalog-result-heading">
          <div><p className="eyebrow">Product List</p><h2 id="catalog-title">{selectedName}</h2></div>
          <p aria-live="polite">共 <strong>{filteredProducts.length}</strong> 項產品</p>
        </div>

        {filteredProducts.length > 0 ? <div className="product-grid services-product-grid">{filteredProducts.map((product) => <ProductCard key={product.id} {...product} />)}</div> : <div className="catalog-empty"><h3>目前沒有可顯示的產品</h3><p>請選擇其他分類，或稍後查看更新內容。</p></div>}
      </div>
    </section>
  );
}
