import Layout from '@/components/Layout';
import { User, Mail, Baby, LogOut, Download, Settings, ChevronRight } from 'lucide-react';

export default function Profile() {
  return (
    <Layout>
      <div className="px-4 pt-4 pb-8 max-w-lg mx-auto">
        <h2 className="text-xl font-bold text-foreground mb-6">Profile 👤</h2>

        {/* User card */}
        <div className="bg-card rounded-2xl border p-5 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-7 h-7 text-primary" />
            </div>
            <div>
              <p className="font-bold text-foreground">Welcome!</p>
              <p className="text-sm text-muted-foreground">Sign in to access your library</p>
            </div>
          </div>
          <button className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm">
            Sign In / Sign Up
          </button>
        </div>

        {/* Child details */}
        <div className="bg-card rounded-2xl border p-5 mb-6">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Baby className="w-4 h-4" /> Child's Details
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-border">
              <span className="text-sm text-muted-foreground">Name</span>
              <span className="text-sm text-foreground font-medium">Not set</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border">
              <span className="text-sm text-muted-foreground">Age</span>
              <span className="text-sm text-foreground font-medium">Not set</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-muted-foreground">Current Level</span>
              <span className="text-sm text-foreground font-medium">Level 1</span>
            </div>
          </div>
        </div>

        {/* Menu items */}
        <div className="bg-card rounded-2xl border divide-y divide-border">
          {[
            { icon: Download, label: 'Download History' },
            { icon: Settings, label: 'Account Settings' },
          ].map(({ icon: Icon, label }) => (
            <button key={label} className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
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
