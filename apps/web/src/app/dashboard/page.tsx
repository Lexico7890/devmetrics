'use client';

import { Download, Sparkles } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import KPICard from '@/components/ui/KPICard';

const timelineData = [
  { name: 'Oct 01', main: 400, development: 240 },
  { name: 'Oct 07', main: 300, development: 139 },
  { name: 'Oct 14', main: 900, development: 980 },
  { name: 'Oct 21', main: 200, development: 390 },
  { name: 'Oct 28', main: 1100, development: 480 },
  { name: 'Nov 01', main: 500, development: 380 },
];

const languageData = [
  { name: 'TypeScript', value: 75, color: '#3b82f6' },
  { name: 'Rust', value: 15, color: '#6366f1' },
  { name: 'Go', value: 10, color: '#a855f7' },
];

export default function DashboardPage() {
  return (
    <div className='space-y-8 animate-in fade-in duration-500'>
      <div className='flex justify-between items-center'>
        <div>
          <h1 className='text-3xl font-bold text-white tracking-tight'>Overview</h1>
          <p className='text-sm text-slate-500 mt-1'>Aggregated insights from your GitHub activity</p>
        </div>
        <div className='flex items-center gap-3'>
          <div className='bg-card-dark border border-border-dark rounded-lg p-1 flex'>
            <button className='px-4 py-1.5 text-xs font-medium bg-primary/20 text-primary rounded-md'>Last 30 Days</button>
            <button className='px-4 py-1.5 text-xs font-medium text-slate-500 hover:text-white transition-colors'>90 Days</button>
          </div>
          <button className='flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-lg shadow-primary/20'>
            <Download className='w-4 h-4' />
            Export Report
          </button>
        </div>
      </div>

      <div className='bg-primary/5 border border-primary/20 rounded-xl p-4 flex gap-4 items-center'>
        <div className='w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0'>
          <Sparkles className='w-5 h-5 text-primary' />
        </div>
        <div className='flex-1'>
          <h3 className='text-xs font-bold text-primary uppercase tracking-wider mb-0.5'>AI Insights</h3>
          <p className='text-sm text-slate-300 italic'>Your development velocity is increasing with 12.5% more commits this period.</p>
        </div>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
        <KPICard label='Total Commits' value='1,240' change='+12.5%' trend='up' subtext='+140 vs prev period' />
        <KPICard label='PRs Merged' value='86' change='+8.2%' trend='up' subtext='Average 2.1/day' />
        <KPICard label='Lines Changed' value='42.5k' change='-4.1%' trend='down' subtext='Net +12k additions' />
        <KPICard label='Active Days' value='28' change='0%' trend='neutral' subtext='Out of last 30 days' />
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
        <div className='lg:col-span-2 bg-card-dark border border-border-dark rounded-xl p-6 shadow-sm'>
          <h3 className='text-lg font-bold text-white mb-6'>Commits Timeline</h3>
          <div className='h-64'>
            <ResponsiveContainer width='100%' height='100%'>
              <AreaChart data={timelineData}>
                <defs>
                  <linearGradient id='colorMain' x1='0' y1='0' x2='0' y2='1'>
                    <stop offset='5%' stopColor='#3b82f6' stopOpacity={0.3}/>
                    <stop offset='95%' stopColor='#3b82f6' stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray='3 3' stroke='#27272a' vertical={false} />
                <XAxis dataKey='name' stroke='#52525b' fontSize={10} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip contentStyle={{ backgroundColor: '#161618', border: '1px solid #27272a', borderRadius: '8px' }} />
                <Area type='monotone' dataKey='main' stroke='#3b82f6' fillOpacity={1} fill='url(#colorMain)' strokeWidth={2} />
                <Area type='monotone' dataKey='development' stroke='#3b82f640' fill='transparent' strokeWidth={2} strokeDasharray='5 5' />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className='bg-card-dark border border-border-dark rounded-xl p-6 shadow-sm'>
          <h3 className='text-lg font-bold text-white mb-6'>Languages</h3>
          <div className='h-48 flex justify-center items-center relative'>
            <ResponsiveContainer width='100%' height='100%'>
              <PieChart>
                <Pie data={languageData} cx='50%' cy='50%' innerRadius={60} outerRadius={80} paddingAngle={5} dataKey='value'>
                  {languageData.map((entry, index) => (<Cell key={index} fill={entry.color} />))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className='absolute inset-0 flex flex-col items-center justify-center pointer-events-none'>
              <span className='text-2xl font-bold text-white'>12</span>
              <span className='text-[10px] uppercase text-slate-500 font-bold'>Total Lng</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
