import Layout from '@/components/Layout';
import { LEVELS } from '@/lib/types';
import { BookOpen } from 'lucide-react';

const products = [
  { id: 'free', name: 'Free Sample', description: '1 book from Level 1', price: 'Free', badge: null, featured: false, bookCount: 1 },
  { id: 'level-1', name: 'Level 1 Pack', description: 'All Starting Stories books', price: '£9.99', badge: null, featured: false, bookCount: 10 },
  { id: 'level-2', name: 'Level 2 Pack', description: 'All Longer Sounds books', price: '£9.99', badge: null, featured: false, bookCount: 10 },
  { id: 'starter', name: 'Starter Bundle', description: 'Levels 1–2, all books included', price: '£16.99', badge: 'Popular', featured: true, bookCount: 20 },
  { id: 'full', name: 'Full Bundle', description: 'All 32 books, Levels 1–6', price: '£49.99', badge: 'Best Value', featured: true, bookCount: 32 },
  { id: 'subscription', name: 'Monthly Plan', description: 'New books unlocked each month', price: '£4.99/mo', badge: null, featured: false, bookCount: null },
];

const levelBgs: Record<number, string> = {
  1: 'bg-level-1', 2: 'bg-level-2', 3: 'bg-level-3',
  4: 'bg-level-4', 5: 'bg-level-5', 6: 'bg-level-6',
};

export default function Shop() {
  return (
    <Layout>
      <div className="px-4 pt-5 pb-8 max-w-lg mx-auto">
        <h2 className="text-2xl font-extrabold text-foreground mb-1 tracking-tight">Shop</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Choose the right pack for your child's reading journey.
        </p>

        {/* Level overview */}
        <div className="grid grid-cols-3 gap-2.5 mb-8">
          {LEVELS.map((level) => (
            <div
              key={level.level}
              className={`${levelBgs[level.level]} text-white rounded-xl p-3 text-center shadow-card relative overflow-hidden`}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/15 to-black/10" />
              <div className="relative">
                <p className="text-xl font-extrabold">L{level.level}</p>
                <p className="text-[10px] font-medium opacity-90 leading-tight mt-0.5">{level.name}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Products */}
        <div className="space-y-3">
          {products.map((product) => (
            <div
              key={product.id}
              className={`rounded-xl p-4 transition-all duration-200 shadow-card ${
                product.featured
                  ? 'border-2 border-primary bg-tint-pink'
                  : 'border border-border bg-card'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-foreground">{product.name}</h3>
                    {product.badge && (
                      <span className="text-[10px] gradient-primary text-primary-foreground px-2 py-0.5 rounded-full font-bold shadow-sm">
                        {product.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{product.description}</p>
                  {product.bookCount && (
                    <div className="flex items-center gap-1 mt-1.5">
                      <BookOpen className="w-3 h-3 text-muted-foreground" />
                      <span className="text-[10px] font-medium text-muted-foreground">{product.bookCount} books</span>
                    </div>
                  )}
                </div>
                <span className="text-xl font-extrabold text-foreground whitespace-nowrap ml-3">{product.price}</span>
              </div>
              <button
                className={`w-full py-3 rounded-lg font-bold text-sm transition-all duration-200 active:scale-[0.97] ${
                  product.id === 'free'
                    ? 'bg-card border-2 border-primary text-primary'
                    : 'gradient-primary text-primary-foreground shadow-button'
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