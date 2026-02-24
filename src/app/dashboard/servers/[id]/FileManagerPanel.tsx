'use client'
import { useEffect, useRef, useState } from 'react'
import {
  Folder, File, FileCode, FileText, Package, Terminal as TerminalIcon,
  ScrollText, ChevronLeft, ChevronRight, Loader2, Trash2, Pencil, FolderPlus,
  Check, X, AlertCircle, RefreshCw, Save, Upload, CloudUpload,
} from 'lucide-react'
import api from '@/lib/api'

interface FileEntry {
  name:  string
  dir:   boolean
  size:  number
  mtime: number
}

interface UploadItem {
  file:     File
  path:     string // full destination path
  progress: number // 0-100
  status:   'pending' | 'uploading' | 'done' | 'error'
  error?:   string
}

//  Helpers 

function fmtSize(bytes: number): string {
  if (bytes < 1024)             return `${bytes} B`
  if (bytes < 1024 * 1024)      return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`
}

function fmtDate(ts: number): string {
  return new Date(ts * 1000).toLocaleDateString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

const BINARY_EXTS = new Set([
  '.jar', '.zip', '.tar', '.gz', '.bz2', '.zst', '.lz4', '.7z', '.rar',
  '.dat', '.mca', '.nbt', '.png', '.jpg', '.jpeg', '.gif', '.webp',
  '.ico', '.class', '.bin', '.so', '.db',
])
const CODE_EXTS   = new Set(['.yml', '.yaml', '.toml', '.json', '.properties', '.cfg', '.conf', '.ini', '.xml'])
const SCRIPT_EXTS = new Set(['.sh', '.bash'])
const TEXT_EXTS   = new Set(['.txt', '.md', '.log'])

function extOf(name: string) {
  const i = name.lastIndexOf('.')
  return i >= 0 ? name.slice(i).toLowerCase() : ''
}

function isBinary(name: string) { return BINARY_EXTS.has(extOf(name)) }

function FileIcon({ name, dir }: { name: string; dir: boolean }) {
  if (dir) return <Folder size={14} className="text-amber-400/70 shrink-0" />
  const ext = extOf(name)
  if (ext === '.jar')             return <Package size={14}      className="text-sky-400/70 shrink-0" />
  if (CODE_EXTS.has(ext))         return <FileCode size={14}     className="text-emerald-400/70 shrink-0" />
  if (SCRIPT_EXTS.has(ext))       return <TerminalIcon size={14} className="text-purple-400/70 shrink-0" />
  if (TEXT_EXTS.has(ext))         return <FileText size={14}     className="text-white/50 shrink-0" />
  if (ext === '.log')              return <ScrollText size={14}   className="text-white/30 shrink-0" />
  return <File size={14} className="text-white/30 shrink-0" />
}

function joinSegments(segs: string[]): string {
  return segs.length === 0 ? '/' : '/' + segs.join('/')
}

//  Component 

export default function FileManagerPanel({ serverId }: { serverId: string }) {
  // Navigation
  const [segments, setSegments]       = useState<string[]>([])
  const [entries, setEntries]         = useState<FileEntry[]>([])
  const [listLoading, setListLoading] = useState(true)
  const [listError, setListError]     = useState('')

  // Back / Forward history
  const navRef                            = useRef({ history: [] as string[][], index: -1 })
  const [canGoBack, setCanGoBack]         = useState(false)
  const [canGoForward, setCanGoForward]   = useState(false)

  // Editor
  const [editPath, setEditPath]         = useState<string | null>(null)
  const [editContent, setEditContent]   = useState('')
  const [fileLoading, setFileLoading]   = useState(false)
  const [fileSaving, setFileSaving]     = useState(false)
  const [fileSaved, setFileSaved]       = useState(false)
  const [fileError, setFileError]       = useState('')

  // Rename
  const [renamingName, setRenamingName] = useState<string | null>(null)
  const [renameValue, setRenameValue]   = useState('')
  const renameRef = useRef<HTMLInputElement>(null)

  // New folder
  const [newFolderMode, setNewFolderMode] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const newFolderRef = useRef<HTMLInputElement>(null)

  // Delete confirm
  const [deletingName, setDeletingName] = useState<string | null>(null)
  const [deleting, setDeleting]         = useState(false)

  // Upload
  const fileInputRef  = useRef<HTMLInputElement>(null)
  const [uploads, setUploads]     = useState<UploadItem[]>([])
  const [dragging, setDragging]   = useState(false)

  //  Directory loading 
  const loadDir = async (segs: string[], keepEditor = false, push = true) => {
    setListLoading(true)
    setListError('')
    if (!keepEditor) setEditPath(null)
    try {
      const path = joinSegments(segs)
      const { data } = await api.get(`/api/servers/${serverId}/files`, { params: { path } })
      setEntries(data)
      setSegments(segs)
      if (push) {
        const nav = navRef.current
        const trimmed = nav.history.slice(0, nav.index + 1)
        nav.history = [...trimmed, segs]
        nav.index   = nav.history.length - 1
        setCanGoBack(nav.index > 0)
        setCanGoForward(false)
      }
    } catch (err: any) {
      setListError(err?.response?.data?.error ?? 'Failed to load directory')
    } finally {
      setListLoading(false)
    }
  }

  const goBack = () => {
    const nav = navRef.current
    if (nav.index <= 0) return
    nav.index--
    setCanGoBack(nav.index > 0)
    setCanGoForward(true)
    loadDir(nav.history[nav.index], false, false)
  }

  const goForward = () => {
    const nav = navRef.current
    if (nav.index >= nav.history.length - 1) return
    nav.index++
    setCanGoBack(true)
    setCanGoForward(nav.index < nav.history.length - 1)
    loadDir(nav.history[nav.index], false, false)
  }

  useEffect(() => { loadDir([]) }, [serverId])

  //  File open / editor 
  const openEntry = async (entry: FileEntry) => {
    if (entry.dir) {
      loadDir([...segments, entry.name])
      return
    }
    const filePath = joinSegments([...segments, entry.name])
    setEditPath(filePath)
    setFileError('')
    setFileSaved(false)

    if (isBinary(entry.name)) {
      setEditContent('__BINARY__')
      return
    }

    setFileLoading(true)
    setEditContent('')
    try {
      const { data } = await api.get(`/api/servers/${serverId}/files/content`, {
        params: { path: filePath },
      })
      setEditContent(data.content)
    } catch (err: any) {
      const msg = err?.response?.data?.error ?? 'Failed to read file'
      if (msg.includes('too large') || err?.response?.status === 413) {
        setEditContent('__TOO_LARGE__')
      } else {
        setFileError(msg)
        setEditPath(null)
      }
    } finally {
      setFileLoading(false)
    }
  }

  const saveFile = async () => {
    if (!editPath) return
    setFileSaving(true)
    setFileError('')
    try {
      await api.put(`/api/servers/${serverId}/files/content`, {
        path: editPath, content: editContent,
      })
      setFileSaved(true)
      setTimeout(() => setFileSaved(false), 2500)
    } catch (err: any) {
      setFileError(err?.response?.data?.error ?? 'Failed to save')
    } finally {
      setFileSaving(false)
    }
  }

  //  New folder 
  const startNewFolder = () => {
    setNewFolderMode(true)
    setNewFolderName('')
    setTimeout(() => newFolderRef.current?.focus(), 40)
  }

  const commitNewFolder = async () => {
    if (!newFolderName.trim()) { setNewFolderMode(false); return }
    const path = joinSegments([...segments, newFolderName.trim()])
    try {
      await api.post(`/api/servers/${serverId}/files/mkdir`, { path })
      setNewFolderMode(false)
      setNewFolderName('')
      loadDir(segments, true, false)
    } catch (err: any) {
      setListError(err?.response?.data?.error ?? 'Could not create folder')
      setNewFolderMode(false)
    }
  }

  //  Rename 
  const startRename = (entry: FileEntry, e: React.MouseEvent) => {
    e.stopPropagation()
    setRenamingName(entry.name)
    setRenameValue(entry.name)
    setTimeout(() => { renameRef.current?.select() }, 40)
  }

  const commitRename = async (entry: FileEntry) => {
    const trimmed = renameValue.trim()
    if (!trimmed || trimmed === entry.name) { setRenamingName(null); return }
    const from = joinSegments([...segments, entry.name])
    const to   = joinSegments([...segments, trimmed])
    try {
      await api.post(`/api/servers/${serverId}/files/rename`, { from, to })
      setRenamingName(null)
      loadDir(segments, editPath?.startsWith(to) || editPath?.startsWith(from) ? false : true, false)
    } catch (err: any) {
      setListError(err?.response?.data?.error ?? 'Rename failed')
      setRenamingName(null)
    }
  }

  //  Delete 
  const confirmDelete = async (name: string) => {
    const path = joinSegments([...segments, name])
    setDeleting(true)
    try {
      await api.delete(`/api/servers/${serverId}/files`, { params: { path } })
      setDeletingName(null)
      if (editPath && (editPath === path || editPath.startsWith(path + '/'))) setEditPath(null)
      loadDir(segments, true, false)
    } catch (err: any) {
      setListError(err?.response?.data?.error ?? 'Delete failed')
      setDeletingName(null)
    } finally {
      setDeleting(false)
    }
  }

  //  Upload 
  const enqueueFiles = (files: FileList | File[]) => {
    const arr = Array.from(files)
    const newItems: UploadItem[] = arr.map(f => ({
      file: f,
      path: joinSegments([...segments, f.name]),
      progress: 0,
      status: 'pending',
    }))
    setUploads(prev => [...prev, ...newItems])
    newItems.forEach(item => uploadOne(item))
  }

  const uploadOne = (item: UploadItem) => {
    setUploads(prev =>
      prev.map(u => u.path === item.path && u.status === 'pending'
        ? { ...u, status: 'uploading' } : u
      )
    )
    api.post(
      `/api/servers/${serverId}/files/upload`,
      item.file,
      {
        params:  { path: item.path },
        headers: { 'Content-Type': 'application/octet-stream' },
        maxBodyLength: Infinity,
        onUploadProgress: (evt) => {
          const pct = evt.total ? Math.round((evt.loaded / evt.total) * 100) : 0
          setUploads(prev =>
            prev.map(u => u.path === item.path ? { ...u, progress: pct } : u)
          )
        },
      },
    )
    .then(() => {
      setUploads(prev =>
        prev.map(u => u.path === item.path ? { ...u, status: 'done', progress: 100 } : u)
      )
      loadDir(segments, true, false)
      // Hide completed items after a short delay
      setTimeout(() =>
        setUploads(prev => prev.filter(u => !(u.path === item.path && u.status === 'done'))),
      2500)
    })
    .catch((err: any) => {
      const msg = err?.response?.data?.error ?? 'Upload failed'
      setUploads(prev =>
        prev.map(u => u.path === item.path ? { ...u, status: 'error', error: msg } : u)
      )
    })
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    if (e.dataTransfer.files.length) enqueueFiles(e.dataTransfer.files)
  }

  return (
    <div className="flex flex-col gap-4">

      {/*  Toolbar  */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        {/* Back / Forward + Breadcrumbs */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={goBack}
              disabled={!canGoBack || listLoading}
              className="p-2 rounded-lg hover:bg-white/8 text-white/40 hover:text-white/80 transition-all disabled:opacity-25 disabled:cursor-not-allowed"
              title="Go back"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={goForward}
              disabled={!canGoForward || listLoading}
              className="p-2 rounded-lg hover:bg-white/8 text-white/40 hover:text-white/80 transition-all disabled:opacity-25 disabled:cursor-not-allowed"
              title="Go forward"
            >
              <ChevronRight size={18} />
            </button>
          </div>
          <div className="w-px h-5 bg-white/10 shrink-0" />
        <div className="flex items-center gap-1.5 text-sm text-white/45 flex-wrap min-w-0">
          <button
            onClick={() => loadDir([])}
            className={`transition-colors hover:text-white/70 ${segments.length === 0 ? 'text-white/70 font-medium' : ''}`}
          >
            server root
          </button>
          {segments.map((seg, i) => (
            <span key={i} className="flex items-center gap-1">
              <ChevronRight size={12} className="text-white/20 shrink-0" />
              <button
                onClick={() => loadDir(segments.slice(0, i + 1))}
                className={`transition-colors hover:text-white/70 ${i === segments.length - 1 ? 'text-white/70 font-medium' : ''}`}
              >
                {seg}
              </button>
            </span>
          ))}
        </div>

        </div>

        {/* Actions */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => loadDir(segments, true, false)}
            disabled={listLoading}
            className="p-2 rounded-lg border border-white/12 hover:border-white/30 text-white/45 hover:text-white/80 transition-all disabled:opacity-40"
            title="Refresh"
          >
            <RefreshCw size={15} className={listLoading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={startNewFolder}
            className="flex items-center gap-2 text-sm px-3.5 py-2 rounded-lg border border-white/12 hover:border-white/30 text-white/50 hover:text-white/80 transition-all"
          >
            <FolderPlus size={15} />
            New Folder
          </button>
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={e => { if (e.target.files?.length) { enqueueFiles(e.target.files); e.target.value = '' } }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 text-sm px-3.5 py-2 rounded-lg border border-emerald-500/35 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 transition-all"
          >
            <Upload size={15} />
            Upload
          </button>
        </div>
      </div>

      {/*  Error banner  */}
      {listError && (
        <div className="flex items-center gap-3 border border-red-500/25 bg-red-500/8 rounded-xl px-4 py-3">
          <AlertCircle size={13} className="text-red-400 shrink-0" />
          <p className="text-xs text-red-400 flex-1">{listError}</p>
          <button onClick={() => setListError('')}>
            <X size={12} className="text-red-400/50 hover:text-red-400 transition-colors" />
          </button>
        </div>
      )}

      {/*  Upload queue  */}
      {uploads.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {uploads.map((u, i) => (
            <div key={i} className={`flex items-center gap-3 border rounded-xl px-4 py-2.5 text-xs transition-all ${
              u.status === 'error'    ? 'border-red-500/25 bg-red-500/8'
              : u.status === 'done'  ? 'border-emerald-500/20 bg-emerald-500/6'
              : 'border-white/10 bg-white/3'
            }`}>
              {u.status === 'uploading' && <Loader2 size={12} className="animate-spin text-white/40 shrink-0" />}
              {u.status === 'done'      && <Check   size={12} className="text-emerald-400 shrink-0" />}
              {u.status === 'error'     && <AlertCircle size={12} className="text-red-400 shrink-0" />}
              {u.status === 'pending'   && <CloudUpload size={12} className="text-white/25 shrink-0" />}
              <span className="flex-1 font-mono truncate text-white/55">{u.file.name}</span>
              {u.status === 'uploading' && (
                <div className="w-24 h-1 bg-white/10 rounded-full overflow-hidden shrink-0">
                  <div
                    className="h-full bg-emerald-400 rounded-full transition-all duration-200"
                    style={{ width: `${u.progress}%` }}
                  />
                </div>
              )}
              {u.status === 'uploading' && (
                <span className="text-white/30 w-8 text-right shrink-0">{u.progress}%</span>
              )}
              {u.status === 'error' && (
                <span className="text-red-400/80 truncate max-w-35">{u.error}</span>
              )}
              {(u.status === 'done' || u.status === 'error') && (
                <button
                  onClick={() => setUploads(prev => prev.filter((_, j) => j !== i))}
                  className="text-white/20 hover:text-white/50 transition-colors shrink-0"
                >
                  <X size={11} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/*  File list  */}
      <div
        className={`border rounded-xl overflow-hidden transition-colors ${
          dragging ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-white/10'
        }`}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragging(false) }}
        onDrop={handleDrop}
      >

        {/* New folder input row */}
        {newFolderMode && (
          <div
            className="flex items-center gap-3 px-4 py-2.5 border-b border-white/8 bg-white/3"
            onClick={e => e.stopPropagation()}
          >
            <Folder size={14} className="text-amber-400/70 shrink-0" />
            <input
              ref={newFolderRef}
              value={newFolderName}
              onChange={e => setNewFolderName(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter')  commitNewFolder()
                if (e.key === 'Escape') { setNewFolderMode(false); setNewFolderName('') }
              }}
              placeholder="Folder name…"
              className="flex-1 bg-transparent text-xs text-white font-mono outline-none placeholder-white/20"
            />
            <button onClick={commitNewFolder} className="text-emerald-400 hover:text-emerald-300 transition-colors">
              <Check size={13} />
            </button>
            <button
              onClick={() => { setNewFolderMode(false); setNewFolderName('') }}
              className="text-white/30 hover:text-white/60 transition-colors"
            >
              <X size={13} />
            </button>
          </div>
        )}

        {listLoading ? (
          <div className="flex items-center justify-center py-12 gap-2 text-white/25 text-xs">
            <Loader2 size={13} className="animate-spin" /> Loading…
          </div>
        ) : entries.length === 0 && !newFolderMode ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3 text-white/20 text-xs">
            <CloudUpload size={22} className="text-white/15" />
            <span>Directory is empty — drop files here to upload</span>
          </div>
        ) : (
          entries.map((entry, i) => {
            const isLast      = i === entries.length - 1
            const isRenaming  = renamingName === entry.name
            const isDeleting  = deletingName === entry.name
            const isActive    = editPath === joinSegments([...segments, entry.name])

            return (
              <div
                key={entry.name}
                onClick={() => { if (!isRenaming && !isDeleting) openEntry(entry) }}
                className={`group flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors
                  ${!isLast ? 'border-b border-white/8' : ''}
                  ${isActive ? 'bg-white/5' : 'hover:bg-white/3'}`}
              >
                <FileIcon name={entry.name} dir={entry.dir} />

                {/* Name — editable when renaming */}
                {isRenaming ? (
                  <input
                    ref={renameRef}
                    value={renameValue}
                    onChange={e => setRenameValue(e.target.value)}
                    onKeyDown={e => {
                      e.stopPropagation()
                      if (e.key === 'Enter')  commitRename(entry)
                      if (e.key === 'Escape') setRenamingName(null)
                    }}
                    onClick={e => e.stopPropagation()}
                    className="flex-1 bg-white/8 border border-white/20 rounded px-2 py-0.5 text-xs text-white font-mono outline-none"
                    autoFocus
                  />
                ) : (
                  <span className={`flex-1 text-xs font-mono truncate ${entry.dir ? 'text-white/75' : 'text-white/55'}`}>
                    {entry.name}{entry.dir ? '/' : ''}
                  </span>
                )}

                {/* Size + date — hidden when renaming or on small screens */}
                {!isRenaming && !isDeleting && (
                  <>
                    <span className="text-[10px] text-white/20 shrink-0 hidden sm:block w-16 text-right">
                      {entry.dir ? '—' : fmtSize(entry.size)}
                    </span>
                    <span className="text-[10px] text-white/20 shrink-0 hidden lg:block w-28 text-right">
                      {fmtDate(entry.mtime)}
                    </span>
                  </>
                )}

                {/* Hover actions */}
                {!isRenaming && !isDeleting && (
                  <div
                    className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                    onClick={e => e.stopPropagation()}
                  >
                    <button
                      onClick={e => startRename(entry, e)}
                      className="p-1.5 rounded hover:bg-white/8 text-white/20 hover:text-white/70 transition-all"
                      title="Rename"
                    >
                      <Pencil size={11} />
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); setDeletingName(entry.name) }}
                      className="p-1.5 rounded hover:bg-red-500/12 text-white/20 hover:text-red-400 transition-all"
                      title="Delete"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                )}

                {/* Delete confirmation */}
                {isDeleting && (
                  <div className="flex items-center gap-2 shrink-0" onClick={e => e.stopPropagation()}>
                    <span className="text-[10px] text-red-400/80">Delete?</span>
                    <button
                      onClick={() => confirmDelete(entry.name)}
                      disabled={deleting}
                      className="text-[10px] px-2 py-0.5 rounded bg-red-500/20 hover:bg-red-500/35 text-red-400 border border-red-500/25 transition-all disabled:opacity-40"
                    >
                      {deleting ? '…' : 'Yes'}
                    </button>
                    <button
                      onClick={() => setDeletingName(null)}
                      className="text-[10px] text-white/30 hover:text-white/60 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/*  Editor panel  */}
      {editPath && (
        <div className="border border-white/10 rounded-xl overflow-hidden flex flex-col">

          {/* Editor toolbar */}
          <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-white/10 bg-white/3">
            <div className="flex items-center gap-2 min-w-0">
              <FileIcon name={editPath.split('/').pop()!} dir={false} />
              <span className="text-xs font-mono text-white/50 truncate">{editPath}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {fileError && <span className="text-xs text-red-400">{fileError}</span>}
              {!fileLoading && editContent !== '__BINARY__' && editContent !== '__TOO_LARGE__' && (
                <button
                  onClick={saveFile}
                  disabled={fileSaving}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-white/8 hover:bg-white/12 text-white/70 hover:text-white border border-white/12 transition-all disabled:opacity-40"
                >
                  {fileSaving
                    ? <Loader2 size={11} className="animate-spin" />
                    : fileSaved
                    ? <Check size={11} className="text-emerald-400" />
                    : <Save size={11} />
                  }
                  {fileSaving ? 'Saving…' : fileSaved ? 'Saved!' : 'Save'}
                </button>
              )}
              <button
                onClick={() => setEditPath(null)}
                className="text-white/25 hover:text-white/60 transition-colors p-1"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Editor body */}
          {fileLoading ? (
            <div className="flex items-center justify-center py-12 gap-2 text-white/25 text-xs">
              <Loader2 size={13} className="animate-spin" /> Loading file…
            </div>
          ) : editContent === '__BINARY__' ? (
            <div className="text-center py-10 text-white/20 text-xs">
              Binary file — cannot be displayed or edited in browser
            </div>
          ) : editContent === '__TOO_LARGE__' ? (
            <div className="text-center py-10 text-white/20 text-xs">
              File exceeds 512 KB — use SFTP to edit large files
            </div>
          ) : (
            <textarea
              value={editContent}
              onChange={e => setEditContent(e.target.value)}
              spellCheck={false}
              className="w-full min-h-72 p-4 bg-transparent text-xs font-mono text-white/75 outline-none resize-y leading-relaxed
                [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent
                [&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-thumb]:rounded-full
                hover:[&::-webkit-scrollbar-thumb]:bg-white/35"
            />
          )}
        </div>
      )}
    </div>
  )
}
