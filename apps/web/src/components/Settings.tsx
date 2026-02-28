
"use client";

import React, { useState } from 'react';
import { 
  User, 
  Settings as SettingsIcon, 
  Bell, 
  Link as LinkIcon, 
  CreditCard, 
  Github, 
  AlertTriangle,
  Info,
  CheckCircle2,
  ChevronRight,
  Globe,
  Clock,
  Layout
} from 'lucide-react';

type SettingsTab = 'account' | 'preferences' | 'notifications' | 'integrations' | 'billing';

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('account');
  const [hasChanges, setHasChanges] = useState(false);

  const tabs = [
    { id: 'account', label: 'Account', icon: User },
    { id: 'preferences', label: 'Preferences', icon: SettingsIcon },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'integrations', label: 'Integrations', icon: LinkIcon },
    { id: 'billing', label: 'Billing', icon: CreditCard },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Manage your account preferences and connected services.</p>
      </div>

      <div className="flex gap-1 bg-card-dark p-1 rounded-xl border border-border-dark w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as SettingsTab)}
            className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-primary/10 text-primary'
                : 'text-slate-500 hover:text-white'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 space-y-6">
          {activeTab === 'account' && <AccountSettings />}
          {activeTab === 'preferences' && <PreferencesSettings onChange={() => setHasChanges(true)} />}
          {activeTab === 'notifications' && <NotificationSettings />}
          {activeTab === 'integrations' && <IntegrationSettings />}
          {activeTab === 'billing' && <BillingSettings />}
        </div>

        <div className="lg:col-span-4 space-y-6 sticky top-24">
          <div className="bg-card-dark border border-border-dark rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-white mb-4">Account Health</h3>
            <div className="space-y-4">
              <HealthItem label="GitHub Connection" status="Connected" color="emerald" />
              <HealthItem label="Sync Status" status="Idle" color="blue" />
              <HealthItem label="API Usage" status="45%" color="amber" />
            </div>
            <div className="mt-8 pt-6 border-t border-border-dark">
              <p className="text-xs text-slate-500 leading-relaxed">
                Your data is synced every 15 minutes. You can trigger a manual sync in the Repositories view.
              </p>
            </div>
          </div>
        </div>
      </div>

      {hasChanges && (
        <div className="fixed bottom-8 right-8 left-64 flex justify-center z-50 animate-in slide-in-from-bottom-8">
          <div className="bg-primary px-6 py-4 rounded-2xl shadow-2xl shadow-primary/40 flex items-center gap-8 border border-white/20">
            <p className="text-white font-bold text-sm">Careful — you have unsaved changes!</p>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setHasChanges(false)}
                className="text-white/80 hover:text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-white/10"
              >
                Reset
              </button>
              <button 
                onClick={() => setHasChanges(false)}
                className="bg-white text-primary px-6 py-2 rounded-lg text-xs font-bold shadow-lg"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const AccountSettings = () => (
  <div className="space-y-6">
    <div className="bg-card-dark border border-border-dark rounded-2xl p-8 shadow-sm">
      <div className="flex items-center gap-6 mb-8">
        <div className="relative group">
          <img src="https://picsum.photos/seed/alex/200/200" className="w-24 h-24 rounded-full border-4 border-border-dark object-cover" />
          <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
            <span className="text-[10px] font-bold text-white uppercase">Change</span>
          </div>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-2xl font-bold text-white">Alex Rivera</h2>
            <div className="bg-emerald-500/10 text-emerald-500 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Connected
            </div>
          </div>
          <p className="text-slate-500 text-sm">arivera@devmetrics.io</p>
          <p className="text-slate-600 text-[11px] mt-2 font-mono uppercase tracking-widest">Joined October 2024</p>
        </div>
        <button className="px-4 py-2 border border-rose-500/30 text-rose-500 text-xs font-bold rounded-lg hover:bg-rose-500 hover:text-white transition-all">
          Disconnect GitHub
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Full Name</label>
          <input type="text" defaultValue="Alex Rivera" className="w-full bg-black/40 border border-border-dark rounded-xl px-4 py-2.5 text-sm text-white focus:ring-1 focus:ring-primary outline-none" />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email Address</label>
          <input type="email" defaultValue="arivera@devmetrics.io" className="w-full bg-black/40 border border-border-dark rounded-xl px-4 py-2.5 text-sm text-white focus:ring-1 focus:ring-primary outline-none" />
        </div>
      </div>
    </div>

    <div className="bg-rose-500/[0.03] border border-rose-500/20 rounded-2xl p-8">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center shrink-0">
          <AlertTriangle className="w-5 h-5 text-rose-500" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-white text-lg">Danger Zone</h3>
          <p className="text-sm text-slate-500 mt-2 leading-relaxed">
            Deleting your account will permanently remove all your indexed repository data, personal insights, and connection settings. This action is irreversible.
          </p>
          <button className="mt-6 px-6 py-2.5 bg-rose-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-rose-500/20 hover:bg-rose-600 transition-all">
            Delete My Account
          </button>
        </div>
      </div>
    </div>
  </div>
);

const PreferencesSettings = ({ onChange }: { onChange: () => void }) => (
  <div className="space-y-6">
    <div className="bg-card-dark border border-border-dark rounded-2xl p-8 shadow-sm">
      <h3 className="font-bold text-white text-lg mb-6 flex items-center gap-2">
        <Globe className="w-5 h-5 text-primary" /> General Preferences
      </h3>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-white">Time Zone</p>
            <p className="text-xs text-slate-500 mt-0.5">Used for commit logs and activity timestamps.</p>
          </div>
          <select onChange={onChange} className="bg-black/40 border border-border-dark rounded-lg px-4 py-2 text-xs font-medium text-slate-300 outline-none">
            <option>(GMT-05:00) Eastern Time</option>
            <option>(GMT+01:00) Central European Time</option>
            <option>(GMT+00:00) UTC</option>
          </select>
        </div>
        <div className="flex items-center justify-between pt-6 border-t border-border-dark">
          <div>
            <p className="text-sm font-bold text-white">Date Format</p>
            <p className="text-xs text-slate-500 mt-0.5">Preferred layout for calendar data.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={onChange} className="px-3 py-1.5 bg-primary/20 text-primary border border-primary/20 rounded-lg text-xs font-bold">MM/DD/YYYY</button>
            <button onClick={onChange} className="px-3 py-1.5 bg-black/40 text-slate-500 border border-border-dark rounded-lg text-xs font-bold">DD/MM/YYYY</button>
          </div>
        </div>
      </div>
    </div>

    <div className="bg-card-dark border border-border-dark rounded-2xl p-8 shadow-sm">
      <h3 className="font-bold text-white text-lg mb-6 flex items-center gap-2">
        <Layout className="w-5 h-5 text-primary" /> Display Settings
      </h3>
      <div className="space-y-6">
        <ToggleRow label="Compact Mode" description="Increase data density in tables and charts." checked={false} onChange={onChange} />
        <ToggleRow label="AI Content Generation" description="Enable automated executive summaries in your dashboard." checked={true} onChange={onChange} />
        <ToggleRow label="Public Profile" description="Allow others in your organization to see your activity." checked={true} onChange={onChange} />
      </div>
    </div>
  </div>
);

const IntegrationSettings = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    <IntegrationCard name="GitHub" status="Connected" icon={<Github className="w-6 h-6" />} synced="2m ago" />
    <IntegrationCard name="Jira" status="Coming Soon" icon={<div className="w-6 h-6 bg-slate-700 rounded-sm" />} disabled />
    <IntegrationCard name="Slack" status="Coming Soon" icon={<div className="w-6 h-6 bg-slate-700 rounded-sm" />} disabled />
    <div className="border-2 border-dashed border-border-dark rounded-2xl flex flex-col items-center justify-center p-8 gap-4 text-center group cursor-pointer hover:border-slate-600 transition-all">
      <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-primary transition-all">
        <LinkIcon className="w-6 h-6 text-slate-500 group-hover:text-white" />
      </div>
      <div>
        <p className="text-sm font-bold text-white">Request Integration</p>
        <p className="text-xs text-slate-500 mt-1">Do not see what you need? Let us know.</p>
      </div>
    </div>
  </div>
);

const NotificationSettings = () => (
  <div className="bg-card-dark border border-border-dark rounded-2xl p-8">
    <h3 className="font-bold text-white text-lg mb-8">Email Subscriptions</h3>
    <div className="space-y-6">
      <CheckboxRow label="Weekly Activity Summary" description="A summary of your engineering metrics delivered every Monday." checked />
      <CheckboxRow label="Security Alerts" description="Immediate notification when we detect vulnerabilities in your repos." checked />
      <CheckboxRow label="New Feature Updates" description="Occasional emails about major updates to DevMetrics." />
      <CheckboxRow label="Productivity Streak" description="Reminders to keep your daily commit streak alive." checked />
    </div>
  </div>
);

const BillingSettings = () => (
  <div className="space-y-6">
    <div className="bg-primary/5 border border-primary/20 rounded-2xl p-8 relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[100px] -mr-32 -mt-32" />
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-10">
          <div>
            <span className="px-3 py-1 bg-primary text-white text-[10px] font-bold uppercase tracking-wider rounded-lg">Current Plan</span>
            <h2 className="text-4xl font-black text-white mt-4 tracking-tighter">Pro Account</h2>
            <p className="text-slate-400 mt-2 font-medium">$29.00 / month</p>
          </div>
          <button className="bg-white text-black px-6 py-2.5 rounded-xl font-bold text-sm shadow-xl hover:bg-slate-200 transition-all">
            Manage Subscription
          </button>
        </div>
        <div className="grid grid-cols-3 gap-8">
          <UsageMetric label="Repositories" current={12} total={50} />
          <UsageMetric label="Team Seats" current={1} total={5} />
          <UsageMetric label="API Syncs" current={45000} total={100000} />
        </div>
      </div>
    </div>
    <div className="bg-card-dark border border-border-dark rounded-2xl p-8">
      <h3 className="font-bold text-white text-lg mb-6">Payment Method</h3>
      <div className="flex items-center justify-between p-4 bg-black/40 border border-border-dark rounded-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-8 bg-slate-800 rounded flex items-center justify-center font-bold text-xs">VISA</div>
          <div>
            <p className="text-sm font-bold text-white">•••• •••• •••• 4242</p>
            <p className="text-[10px] text-slate-500 uppercase font-bold mt-0.5">Expires 12/26</p>
          </div>
        </div>
        <button className="text-primary text-xs font-bold">Edit</button>
      </div>
    </div>
  </div>
);

const HealthItem = ({ label, status, color }: { label: string; status: string; color: string }) => (
  <div className="flex items-center justify-between">
    <span className="text-xs font-medium text-slate-400">{label}</span>
    <span className={`text-[10px] font-bold text-${color}-500 flex items-center gap-1.5`}>
      <div className={`w-1.5 h-1.5 rounded-full bg-${color}-500`} /> {status}
    </span>
  </div>
);

const ToggleRow = ({ label, description, checked, onChange }: any) => (
  <div className="flex items-center justify-between py-2">
    <div className="max-w-md">
      <p className="text-sm font-bold text-white">{label}</p>
      <p className="text-xs text-slate-500 mt-1 leading-relaxed">{description}</p>
    </div>
    <label className="relative inline-flex items-center cursor-pointer">
      <input type="checkbox" className="sr-only peer" defaultChecked={checked} onChange={onChange} />
      <div className="w-10 h-5 bg-zinc-800 rounded-full peer peer-checked:bg-primary after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:after:translate-x-5"></div>
    </label>
  </div>
);

const CheckboxRow = ({ label, description, checked }: any) => (
  <label className="flex items-start gap-4 cursor-pointer group">
    <input type="checkbox" defaultChecked={checked} className="mt-1 w-4 h-4 rounded border-border-dark bg-transparent text-primary focus:ring-0" />
    <div>
      <p className="text-sm font-bold text-white group-hover:text-primary transition-colors">{label}</p>
      <p className="text-xs text-slate-500 mt-1 leading-relaxed">{description}</p>
    </div>
  </label>
);

const IntegrationCard = ({ name, status, icon, synced, disabled }: any) => (
  <div className={`bg-card-dark border border-border-dark rounded-2xl p-6 relative overflow-hidden ${disabled ? 'opacity-60 grayscale' : 'hover:border-primary/40 transition-all cursor-pointer'}`}>
    <div className="flex justify-between items-start mb-6">
      <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-white border border-border-dark">
        {icon}
      </div>
      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded border ${
        status === 'Connected' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-800 text-slate-500 border-border-dark'
      }`}>{status}</span>
    </div>
    <h3 className="text-white font-bold">{name}</h3>
    <p className="text-xs text-slate-500 mt-1">{synced ? `Last synced ${synced}` : 'Sync not configured'}</p>
    {!disabled && <ChevronRight className="absolute bottom-6 right-6 w-4 h-4 text-slate-600" />}
  </div>
);

const UsageMetric = ({ label, current, total }: any) => (
  <div className="space-y-3">
    <div className="flex justify-between items-baseline">
      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{label}</span>
      <span className="text-xs font-bold text-white">{current}/{total}</span>
    </div>
    <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden">
      <div className="h-full bg-primary" style={{ width: `${(current/total) * 100}%` }} />
    </div>
  </div>
);

const HealthItemLabel = ({ label, color }: any) => (
  <div className="flex items-center gap-1.5">
    <div className={`w-1.5 h-1.5 rounded-full bg-${color}-500`} />
    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{label}</span>
  </div>
);

export default Settings;
