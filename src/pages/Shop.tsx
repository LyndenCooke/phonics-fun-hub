import Layout from '@/components/Layout';
import { LEVELS } from '@/lib/types';
import { useProducts } from '@/hooks/useBooks';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { BookOpen } from 'lucide-react';

const levelBgs: Record<number, string> = {
  1: 'bg-level-1', 2: 'bg-level-2', 3: 'bg-level-3',
  4: 'bg-level-4', 5: 'bg-level-5', 6: 'bg-level-6',
};

const badgeMap: Record<string, string | null> = {
  starter_bundle: 'Popular',
  full_bundle: 'Best Value',
};

export default function Shop() {
  const { data: products, isLoading } = useProducts();
  const { user } = useAuth();
  const navigate = useNavigate();

  const formatPrice = (pence: number) => {
    if (pence === 0) return 'Free';
    return `£${(pence / 100).toFixed(2)}`;
  };

  return (
    <Layout>
      <div className="px-4 pt-5 pb-8 max-w-lg mx-auto">
        <h2 className="text-2xl font-extrabold text-foreground mb-1 tracking-tight">Shop</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Choose the right pack for your child's reading journey.
        </p>

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

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {(products ?? []).map((product) => {
              const badge = badgeMap[product.product_type] ?? null;
              const featured = product.product_type === 'starter_bundle' || product.product_type === 'full_bundle';
              const isFree = product.product_type === 'free_sample';
              const isSub = product.product_type === 'subscription';

              return (
                <div
                  key={product.id}
                  className={`rounded-xl p-4 transition-all duration-200 shadow-card ${
                    featured ? 'border-2 border-primary bg-tint-pink' : 'border border-border bg-card'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-foreground">{product.name}</h3>
                        {badge && (
                          <span className="text-[10px] gradient-primary text-primary-foreground px-2 py-0.5 rounded-full font-bold shadow-sm">
                            {badge}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{product.description}</p>
                      <div className="flex items-center gap-1 mt-1.5">
                        <BookOpen className="w-3 h-3 text-muted-foreground" />
                        <span className="text-[10px] font-medium text-muted-foreground">
                          {isSub ? 'All books' : `Levels ${product.levels_included.join(', ')}`}
                        </span>
                      </div>
                    </div>
                    <span className="text-xl font-extrabold text-foreground whitespace-nowrap ml-3">
                      {isSub ? `${formatPrice(product.price_pence)}/mo` : formatPrice(product.price_pence)}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      if (!user) {
                        navigate('/auth');
                        return;
                      }
                      // TODO: trigger checkout edge function
                    }}
                    className={`w-full py-3 rounded-lg font-bold text-sm transition-all duration-200 active:scale-[0.97] ${
                      isFree
                        ? 'bg-card border-2 border-primary text-primary'
                        : 'gradient-primary text-primary-foreground shadow-button'
                    }`}
                  >
                    {isFree ? 'Get Free Sample' : 'Buy Now'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
