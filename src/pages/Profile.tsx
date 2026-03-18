import Layout from '@/components/Layout';
import { User, Baby, LogOut, Download, Settings, ChevronRight, Pencil } from 'lucide-react';

export default function Profile() {
  return (
    <Layout>
      <div className="px-4 pt-5 pb-8 max-w-lg mx-auto">
        <h2 className="text-2xl font-extrabold text-foreground mb-6 tracking-tight">Profile</h2>

        {/* User card */}
        <div className="bg-card rounded-2xl border border-border p-5 mb-6 shadow-card">
          <div className="flex items-center gap-4 mb-5">
            <div className="w-14 h-14 rounded-2xl bg-tint-pink flex items-center justify-center">
              <User className="w-7 h-7 text-primary" />
            </div>
            <div>
              <p className="font-bold text-foreground text-lg">Welcome!</p>
              <p className="text-sm text-muted-foreground">Sign in to access your library</p>
            </div>
          </div>
          <button className="w-full py-3 rounded-xl gradient-primary text-primary-foreground font-bold text-sm shadow-button active:scale-[0.97] transition-transform duration-200">
            Sign In / Sign Up
          </button>
        </div>

        {/* Child details */}
        <div className="bg-card rounded-2xl border border-border p-5 mb-6 shadow-card">
          <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
            <Baby className="w-4 h-4 text-primary" /> Child's Details
          </h3>
          <div className="space-y-0">
            {[
              { label: 'Name', value: 'Not set', isLevel: false },
              { label: 'Age', value: 'Not set', isLevel: false },
              { label: 'Current Level', value: 'Level 1', isLevel: true },
            ].map(({ label, value, isLevel }, i, arr) => (
              <div
                key={label}
                className={`flex items-center justify-between py-3 ${i < arr.length - 1 ? 'border-b border-border' : ''}`}
              >
                <span className="text-sm text-muted-foreground">{label}</span>
                <div className="flex items-center gap-2">
                  {isLevel ? (
                    <span className="text-xs font-bold bg-level-1 text-white px-2.5 py-0.5 rounded-full">
                      {value}
                    </span>
                  ) : (
                    <span className="text-sm text-muted-foreground italic">{value}</span>
                  )}
                  <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Menu items */}
        <div className="bg-card rounded-2xl border border-border divide-y divide-border shadow-card">
          {[
            { icon: Download, label: 'Download History' },
            { icon: Settings, label: 'Account Settings' },
          ].map(({ icon: Icon, label }) => (
            <button key={label} className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors duration-200">
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">{label}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          ))}
        </div>
      </div>
    </Layout>
  );
}