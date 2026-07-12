import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { projectsService } from '../services/queues'
import type { Organization, Project } from '../types/queue'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import EmptyState from '../components/ui/EmptyState'
import { FolderKanban, Plus, Layers, ArrowRight } from 'lucide-react'

export default function ProjectsPage() {
  const [orgs, setOrgs] = useState<Organization[]>([])
  const [selectedOrg, setSelectedOrg] = useState<string>('')
  const [projects, setProjects] = useState<Project[]>([])
  const [loadingOrgs, setLoadingOrgs] = useState(true)
  const [loadingProjects, setLoadingProjects] = useState(false)

  // Modals
  const [showOrgModal, setShowOrgModal] = useState(false)
  const [showProjModal, setShowProjModal] = useState(false)
  const [newOrgName, setNewOrgName] = useState('')
  const [newProjName, setNewProjName] = useState('')

  useEffect(() => {
    projectsService.listOrgs()
      .then((res) => {
        setOrgs(res.items)
        if (res.items.length > 0) {
          setSelectedOrg(res.items[0].id)
        }
      })
      .finally(() => setLoadingOrgs(false))
  }, [])

  useEffect(() => {
    if (!selectedOrg) return
    setLoadingProjects(true)
    projectsService.listProjects(selectedOrg)
      .then((res) => setProjects(res.items))
      .finally(() => setLoadingProjects(false))
  }, [selectedOrg])

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newOrgName) return
    const slug = newOrgName.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    try {
      const org = await projectsService.createOrg({ name: newOrgName, slug })
      setOrgs([...orgs, org])
      setSelectedOrg(org.id)
      setShowOrgModal(false)
      setNewOrgName('')
    } catch (err) {
      alert('Failed to create organization')
    }
  }

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newProjName || !selectedOrg) return
    const slug = newProjName.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    try {
      const proj = await projectsService.createProject(selectedOrg, { name: newProjName, slug })
      setProjects([...projects, proj])
      setShowProjModal(false)
      setNewProjName('')
    } catch (err) {
      alert('Failed to create project')
    }
  }

  if (loadingOrgs) return <LoadingSpinner size="large" />

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Projects Directory</h1>
          <p className="text-sm text-slate-400 mt-1">Manage organizations, project workspaces, and queues</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowOrgModal(true)}
            className="flex items-center gap-2 px-4 py-2 border border-[#374151] rounded-lg text-sm font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700/80 transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            New Organization
          </button>
          <button
            onClick={() => setShowProjModal(true)}
            disabled={!selectedOrg}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-sm font-semibold rounded-lg text-white transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            New Project
          </button>
        </div>
      </div>

      {/* Org Select */}
      {orgs.length > 0 && (
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-slate-400">Current Organization:</span>
          <select
            value={selectedOrg}
            onChange={(e) => setSelectedOrg(e.target.value)}
            className="bg-[#1f2937]/50 border border-[#374151] rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
          >
            {orgs.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Project Grid */}
      {loadingProjects ? (
        <LoadingSpinner />
      ) : projects.length === 0 ? (
        <EmptyState
          title="No projects found"
          message="Create a project to start configuring queues and jobs."
          action={
            <button
              onClick={() => setShowProjModal(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-sm font-semibold rounded-lg text-white transition-colors cursor-pointer"
            >
              Add First Project
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((proj) => (
            <div
              key={proj.id}
              className="bg-[#1f2937]/30 border border-[#374151] rounded-xl p-6 transition-all duration-300 hover:border-indigo-500/30 flex flex-col justify-between"
            >
              <div>
                <div className="p-3 bg-indigo-600/10 rounded-lg text-indigo-400 border border-indigo-500/20 w-fit mb-4">
                  <FolderKanban className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-white text-lg tracking-tight mb-2">{proj.name}</h3>
                <p className="text-sm text-slate-400 line-clamp-2 mb-4">
                  {proj.description || 'No description provided.'}
                </p>
              </div>
              <div className="pt-4 border-t border-[#374151]/40 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-mono">
                  Slug: {proj.slug}
                </span>
                <Link
                  to={`/projects/${proj.id}/queues`}
                  className="flex items-center gap-1 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  View Queues <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Org Modal */}
      {showOrgModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <form
            onSubmit={handleCreateOrg}
            className="bg-[#1f2937] border border-[#374151] rounded-xl max-w-md w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200"
          >
            <div className="p-6">
              <h3 className="text-lg font-bold text-white mb-4">Create Organization</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Organization Name
                  </label>
                  <input
                    type="text"
                    required
                    value={newOrgName}
                    onChange={(e) => setNewOrgName(e.target.value)}
                    placeholder="Engineering Division"
                    className="w-full bg-[#111827] border border-[#374151] rounded-xl py-2.5 px-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 bg-[#111827]/40 border-t border-[#374151]">
              <button
                type="button"
                onClick={() => setShowOrgModal(false)}
                className="px-4 py-2 border border-[#374151] rounded-lg text-sm font-semibold text-slate-300 hover:bg-[#374151]/40 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-semibold text-white transition-colors cursor-pointer"
              >
                Create
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Project Modal */}
      {showProjModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <form
            onSubmit={handleCreateProject}
            className="bg-[#1f2937] border border-[#374151] rounded-xl max-w-md w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200"
          >
            <div className="p-6">
              <h3 className="text-lg font-bold text-white mb-4">Create Project</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Project Name
                  </label>
                  <input
                    type="text"
                    required
                    value={newProjName}
                    onChange={(e) => setNewProjName(e.target.value)}
                    placeholder="Task Scheduler API"
                    className="w-full bg-[#111827] border border-[#374151] rounded-xl py-2.5 px-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 bg-[#111827]/40 border-t border-[#374151]">
              <button
                type="button"
                onClick={() => setShowProjModal(false)}
                className="px-4 py-2 border border-[#374151] rounded-lg text-sm font-semibold text-slate-300 hover:bg-[#374151]/40 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-semibold text-white transition-colors cursor-pointer"
              >
                Create
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
