import { useState, useEffect, useCallback } from 'react';
  import { useSearchParams } from 'react-router-dom';
  import ProductCard from '../components/ProductCard.jsx';
  import { productService } from '../services/index.js';

  export default function Products() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    const [filters, setFilters] = useState({
      search: searchParams.get('search') || '',
      category: searchParams.get('category') || '',
      minPrice: '', maxPrice: '',
    });

    const fetchProducts = useCallback(async (p = 1, reset = false) => {
      setLoading(true);
      try {
        const params = { page: p, limit: 20 };
        if (filters.search) params.search = filters.search;
        if (filters.category) params.category = filters.category;
        if (filters.minPrice) params.minPrice = filters.minPrice;
        if (filters.maxPrice) params.maxPrice = filters.maxPrice;
        const data = await productService.listProducts(params);
        const list = Array.isArray(data) ? data : [];
        setProducts(prev => reset ? list : [...prev, ...list]);
        setHasMore(list.length === 20);
      } catch { setProducts([]); } finally { setLoading(false); }
    }, [filters]);

    useEffect(() => {
      productService.getCategories().then(c => setCategories(Array.isArray(c) ? c : [])).catch(() => {});
    }, []);

    useEffect(() => { setPage(1); fetchProducts(1, true); }, [filters.category, filters.search, filters.minPrice, filters.maxPrice]);

    const handleSearch = (e) => { e.preventDefault(); fetchProducts(1, true); };

    const loadMore = () => { const next = page + 1; setPage(next); fetchProducts(next, false); };

    return (
      <div className="page-wrap">
        <h1 className="page-title">All Products</h1>

        <div className="filter-bar">
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8, flex: 1, minWidth: 200 }}>
            <input type="text" placeholder="Search products…" value={filters.search} onChange={e => setFilters(p => ({ ...p, search: e.target.value }))} style={{ flex: 1 }} />
            <button type="submit" className="btn-primary btn-sm">Search</button>
          </form>
          <select value={filters.category} onChange={e => setFilters(p => ({ ...p, category: e.target.value }))}>
            <option value="">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <input type="number" placeholder="Min ₹" style={{ width: 100 }} value={filters.minPrice} onChange={e => setFilters(p => ({ ...p, minPrice: e.target.value }))} />
          <input type="number" placeholder="Max ₹" style={{ width: 100 }} value={filters.maxPrice} onChange={e => setFilters(p => ({ ...p, maxPrice: e.target.value }))} />
          {(filters.search || filters.category || filters.minPrice || filters.maxPrice) && (
            <button className="btn-outline btn-sm" onClick={() => setFilters({ search: '', category: '', minPrice: '', maxPrice: '' })}>Clear</button>
          )}
        </div>

        {loading && products.length === 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 20 }}>
            {[...Array(12)].map((_, i) => <div key={i} style={{ background: '#fff', borderRadius: 12, height: 320, opacity: 0.6 }} />)}
          </div>
        ) : products.length === 0 ? (
          <div className="empty-state">
            <div className="icon">🔍</div>
            <h3>No products found</h3>
            <p>Try adjusting your search or filters</p>
          </div>
        ) : (
          <>
            <p style={{ color: 'var(--muted)', fontSize: '0.88rem', marginBottom: 16 }}>{products.length} product{products.length !== 1 ? 's' : ''} found</p>
            <div className="product-grid">
              {products.map(p => <ProductCard key={p.productId} product={p} />)}
            </div>
            {hasMore && (
              <div style={{ textAlign: 'center', marginTop: 32 }}>
                <button className="btn-outline" onClick={loadMore} disabled={loading}>{loading ? 'Loading…' : 'Load More'}</button>
              </div>
            )}
          </>
        )}
      </div>
    );
  }
  