import Layout from '@/components/Layout';
import { LEVELS } from '@/lib/types';
import { ShoppingBag, Star, Sparkles } from 'lucide-react';

const products = [
  { id: 'free', name: 'Free Sample', description: '1 book from Level 1', price: 'Free', badge: '🎁', featured: false },
  { id: 'level-1', name: 'Level 1 Pack', description: 'All 10 Starting Stories books', price: '£9.99', badge: null, featured: false },
  { id: 'level-2', name: 'Level 2 Pack', description: 'All books in Longer Sounds', price: '£9.99', badge: null, featured: false },
  { id: 'starter', name: 'Starter Bundle', description: 'Levels 1–2 (all books)', price: '£16.99', badge: '⭐ Popular', featured: true },
  { id: 'full', name: 'Full Bundle', description: 'All 32 books, Levels 1–6', price: '£49.99', badge: '🏆 Best Value', featured: true },
  { id: 'subscription', name: 'Monthly Subscription', description: 'New books unlocked each month', price: '£4.99/mo', badge: null, featured: false },
];

const levelBgs: Record<number, string> = {
  1: 'bg-level-1', 2: 'bg-level-2', 3: 'bg-level-3',
  4: 'bg-level-4', 5: 'bg-level-5', 6: 'bg-level-6',
};

export default function Shop() {
  return (
    <Layout>
      <div className="px-4 pt-4 pb-8 max-w-lg mx-auto">
        <h2 className="text-xl font-bold text-foreground mb-1">Shop 🛒</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Choose the right pack for your child's reading journey.
        </p>

        {/* Level overview */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          {LEVELS.map((level) => (
            <div key={level.level} className={`${levelBgs[level.level]} text-white rounded-xl p-3 text-center`}>
              <p className="text-lg font-bold">L{level.level}</p>
              <p className="text-[10px] opacity-90 leading-tight">{level.name}</p>
            </div>
          ))}
        </div>

        {/* Products */}
        <div className="space-y-3">
          {products.map((product) => (
            <div
              key={product.id}
              className={`rounded-2xl border-2 p-4 transition-all ${
                product.featured
                  ? 'border-primary bg-primary/5 shadow-sm'
                  : 'border-border bg-card'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-foreground">{product.name}</h3>
                    {product.badge && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-semibold">
                        {product.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">{product.description}</p>
                </div>
                <span className="text-lg font-bold text-foreground whitespace-nowrap">{product.price}</span>
              </div>
              <button
                className={`w-full py-2.5 rounded-xl font-semibold text-sm transition-all active:scale-[0.98] ${
                  product.id === 'free'
                    ? 'bg-muted text-foreground'
                    : 'bg-primary text-primary-foreground'
                }`}
              >
                {product.id === 'free' ? 'Get Free Sample' : 'Buy Now'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
