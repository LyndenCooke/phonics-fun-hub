import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, ClipboardCheck, ShoppingBag, BarChart3, User } from 'lucide-react';

const navItems = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/assess', label: 'Assess', icon: ClipboardCheck },
  { path: '/shop', label: 'Shop', icon: ShoppingBag },
  { path: '/progress', label: 'Progress', icon: BarChart3 },
  { path: '/profile', label: 'Profile', icon: User },
];

export default function Layout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-lg border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">M</span>
          </div>
          <h1 className="text-lg font-bold text-foreground">
            My<span className="text-primary">Phonics</span>Books
          </h1>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 pb-20 md:pb-4">
        {children}
      </main>

      {/* Bottom tab bar (mobile) */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t md:hidden">
        <div className="flex items-center justify-around py-1.5 px-2">
          {navItems.map(({ path, label, icon: Icon }) => {
            const isActive = pathname === path;
            return (
              <Link
                key={path}
                to={path}
                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all ${
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'scale-110' : ''} transition-transform`} />
                <span className="text-[10px] font-semibold">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
