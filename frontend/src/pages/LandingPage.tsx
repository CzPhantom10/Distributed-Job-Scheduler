import React from 'react'
import { Link } from 'react-router-dom'
import {
  Activity,
  Cpu,
  Layers,
  ShieldCheck,
  Zap,
  ArrowRight,
  GitBranch,
  Terminal,
  LineChart
} from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0b0c10] text-slate-100 font-sans selection:bg-indigo-500 selection:text-white overflow-x-hidden">
      {/* Background Glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-emerald-600/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header Navigation */}
      <header className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between border-b border-slate-800/60 relative z-10">
        <div className="flex items-center gap-2">
          <Activity className="h-6 w-6 text-indigo-500 animate-pulse" />
          <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-indigo-400 to-indigo-600 bg-clip-text text-transparent">
            JobFlow
          </span>
        </div>
        <div className="flex items-center gap-6">
          <a href="#features" className="text-sm font-medium text-slate-400 hover:text-slate-200 transition-colors">Features</a>
          <a href="#architecture" className="text-sm font-medium text-slate-400 hover:text-slate-200 transition-colors">Architecture</a>
          <Link
            to="/login"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-sm font-semibold rounded-lg text-white transition-colors shadow-lg shadow-indigo-600/20"
          >
            Access Console
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 pt-24 pb-20 text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-600/10 border border-indigo-500/20 rounded-full text-xs font-semibold text-indigo-400 mb-6 animate-fade-in">
          <Zap className="h-3 w-3" /> Production-Grade Distributed Scheduling
        </div>
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-white mb-6 max-w-4xl mx-auto leading-tight">
          Reliable job distribution for modern <span className="bg-gradient-to-r from-indigo-400 via-indigo-600 to-emerald-400 bg-clip-text text-transparent">applications.</span>
        </h1>
        <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          JobFlow is an open-source, SQLite-powered distributed task manager built from scratch with FastAPI and React. Zero complex configurations, maximum throughput.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/login"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-base font-semibold rounded-xl text-white transition-all shadow-lg shadow-indigo-600/25 hover:translate-y-[-1px]"
          >
            Get Started <ArrowRight className="h-4 w-4" />
          </Link>
          <a
            href="#architecture"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 rounded-xl text-base font-semibold text-slate-300 transition-colors"
          >
            View Architecture
          </a>
        </div>
      </section>

      {/* Live System Demo Concept / Mockup */}
      <section className="max-w-5xl mx-auto px-6 mb-32 relative z-10">
        <div className="bg-[#111827]/70 border border-slate-800 rounded-2xl p-2 shadow-2xl shadow-black/80">
          <div className="bg-[#0b0c10] border border-slate-800/60 rounded-xl overflow-hidden">
            {/* Mock Top bar */}
            <div className="h-10 border-b border-slate-800/60 px-4 flex items-center justify-between bg-slate-900/40">
              <div className="flex gap-1.5">
                <span className="w-3 h-3 rounded-full bg-rose-500/80 block"></span>
                <span className="w-3 h-3 rounded-full bg-amber-500/80 block"></span>
                <span className="w-3 h-3 rounded-full bg-emerald-500/80 block"></span>
              </div>
              <span className="text-xxs font-mono text-slate-500">console@jobflow:~</span>
              <div className="w-12 h-1 bg-slate-800 rounded"></div>
            </div>
            {/* Mock Code window */}
            <div className="p-6 font-mono text-xs text-indigo-300 leading-relaxed overflow-x-auto">
              <p className="text-slate-500"># Enqueue immediate or delayed tasks in python</p>
              <p><span className="text-pink-400">from</span> jobflow <span className="text-pink-400">import</span> Queue, Client</p>
              <p>client = Client(db_url=<span className="text-emerald-400">"sqlite:///./job_scheduler.db"</span>)</p>
              <p>queue = client.get_queue(<span className="text-emerald-400">"default"</span>)</p>
              <br />
              <p>job = queue.enqueue(</p>
              <p className="pl-4">name=<span className="text-emerald-400">"send-invoice-email"</span>,</p>
              <p className="pl-4">{"payload={\"invoice_id\": 4912, \"recipient\": \"user@domain.com\"},"}</p>
              <p className="pl-4">priority=<span className="text-amber-400">100</span>,</p>
              <p className="pl-4">max_retries=<span className="text-amber-400">3</span></p>
              <p>)</p>
              <br />
              <p className="text-emerald-500">&gt;&gt; [JobFlow] Enqueued task ID: e4cd062a-ca7f-4b08-8888-84f932e6005b (status=queued, priority=100)</p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-20 border-t border-slate-800/40 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-white mb-4">Engineered for Reliability</h2>
          <p className="text-slate-400 max-w-xl mx-auto text-sm">Every element of JobFlow is constructed to prioritize predictability, modularity, and clean operational metrics.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div className="bg-[#1f2937]/10 border border-slate-800 rounded-xl p-8 transition-colors hover:border-slate-700">
            <div className="p-3 bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 rounded-lg w-fit mb-6">
              <Cpu className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Atomic Claiming</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Safe transaction boundaries ensure workers claim jobs atomically. Optimistic locks on SQLite prevent duplicate executions in concurrent loops.
            </p>
          </div>
          {/* Card 2 */}
          <div className="bg-[#1f2937]/10 border border-slate-800 rounded-xl p-8 transition-colors hover:border-slate-700">
            <div className="p-3 bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 rounded-lg w-fit mb-6">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Exponential Backoff</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Define custom retry backoffs (fixed, linear, or exponential) directly at the queue level. Persistent dead-letter status keeps logs readable.
            </p>
          </div>
          {/* Card 3 */}
          <div className="bg-[#1f2937]/10 border border-slate-800 rounded-xl p-8 transition-colors hover:border-slate-700">
            <div className="p-3 bg-pink-600/10 border border-pink-500/20 text-pink-400 rounded-lg w-fit mb-6">
              <Layers className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Heuristic Health Tracking</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Automated queue metrics inspect active worker capacity, polling latency, and error ratios to flag health issues before they affect production.
            </p>
          </div>
        </div>
      </section>

      {/* Architecture visualization */}
      <section id="architecture" className="max-w-7xl mx-auto px-6 py-20 border-t border-slate-800/40 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold text-white mb-6">Split-Service Architecture</h2>
            <p className="text-slate-400 text-sm leading-relaxed mb-6">
              Unlike monolithic workers that monitor, schedule, and execute jobs all inside one blocking thread, JobFlow partitions tasks into independent runtime spaces:
            </p>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-none p-1.5 bg-slate-800 rounded text-slate-300 h-fit"><Terminal className="h-4 w-4" /></div>
                <div>
                  <h4 className="font-semibold text-white text-sm mb-1">Scheduler Daemon</h4>
                  <p className="text-xs text-slate-500">Promotes delayed jobs, evaluates scheduled cron expressions, and heartbeats offline nodes.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-none p-1.5 bg-slate-800 rounded text-slate-300 h-fit"><GitBranch className="h-4 w-4" /></div>
                <div>
                  <h4 className="font-semibold text-white text-sm mb-1">Execution Workers</h4>
                  <p className="text-xs text-slate-500">Poll subscribed queues, process payload actions, and stream output log states directly to SQLite.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-none p-1.5 bg-slate-800 rounded text-slate-300 h-fit"><LineChart className="h-4 w-4" /></div>
                <div>
                  <h4 className="font-semibold text-white text-sm mb-1">Consolidated REST API</h4>
                  <p className="text-xs text-slate-500">FastAPI boundary serving real-time throughput metrics, queue status, and dashboard interfaces.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Simple Visual block */}
          <div className="bg-[#1f2937]/10 border border-slate-800 rounded-xl p-8 flex flex-col gap-6 relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
            <div className="border border-slate-800 bg-[#0b0c10] p-4 rounded-lg flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">1. Client / REST API</span>
              <span className="text-indigo-400">Enqueue Job</span>
            </div>
            <div className="h-10 flex justify-center items-center"><ArrowRight className="h-5 w-5 text-slate-700 rotate-90" /></div>
            <div className="border border-slate-800 bg-[#0b0c10] p-4 rounded-lg flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">2. Shared SQLite DB</span>
              <span className="text-indigo-400">atomic state (claimed)</span>
            </div>
            <div className="h-10 flex justify-center items-center"><ArrowRight className="h-5 w-5 text-slate-700 rotate-90" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="border border-slate-800 bg-[#0b0c10] p-4 rounded-lg text-center text-xs font-mono">
                <span className="text-slate-400 block mb-1">Scheduler Process</span>
                <span className="text-emerald-400 text-xxs">Promoting cron/lag</span>
              </div>
              <div className="border border-slate-800 bg-[#0b0c10] p-4 rounded-lg text-center text-xs font-mono">
                <span className="text-slate-400 block mb-1">Worker Nodes</span>
                <span className="text-emerald-400 text-xxs">Executing asyncio tasks</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/40 bg-slate-950/20 py-12 text-center text-xs text-slate-500">
        <p>© 2026 JobFlow Scheduler. Built for pairing. Made by Prateek Sinha</p>
      </footer>
    </div>
  )
}
