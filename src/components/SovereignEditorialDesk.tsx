import React, { useState, useRef, useEffect } from 'react';
import { Article, Writer, Category } from '../types';
import { 
  Shield, ArrowUp, ArrowDown, Trash2, Plus, FileText, 
  Download, Upload, RotateCcw, Edit3, X, Check, AlertTriangle, 
  UserPlus, RefreshCw, Cloud, LogIn, LogOut
} from 'lucide-react';
import { User } from 'firebase/auth';

interface SovereignEditorialDeskProps {
  isOpen: boolean;
  onClose: () => void;
  articles: Article[];
  writers: Writer[];
  setArticles: React.Dispatch<React.SetStateAction<Article[]>>;
  setWriters: React.Dispatch<React.SetStateAction<Writer[]>>;
  onAddNewArticle: (newArticle: Omit<Article, 'id' | 'likes' | 'views' | 'comments'>) => void;
  onAddNewWriter: (newWriter: Writer) => void;
  onEditArticle: (articleId: string, updatedFields: Partial<Article>) => void;
  onDeleteArticle: (articleId: string) => void;
  onResetData: () => void;
  currentUser?: User | null;
  onSignInGoogle?: () => void;
  onSignOutGoogle?: () => void;
}

export default function SovereignEditorialDesk({
  isOpen,
  onClose,
  articles,
  writers,
  setArticles,
  setWriters,
  onAddNewArticle,
  onAddNewWriter,
  onEditArticle,
  onDeleteArticle,
  onResetData,
  currentUser,
  onSignInGoogle,
  onSignOutGoogle
}: SovereignEditorialDeskProps) {
  const [activeSubTab, setActiveSubTab] = useState<'articles' | 'data' | 'writers'>('articles');
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);
  
  // New article state
  const [showNewArticleForm, setShowNewArticleForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSubtitle, setNewSubtitle] = useState('');
  const [newSummary, setNewSummary] = useState('');
  const [newCategory, setNewCategory] = useState<Category>('Politics');
  const [newAuthorId, setNewAuthorId] = useState(writers[0]?.id || 'w-sameera');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newReadTime, setNewReadTime] = useState('6 min read');
  const [newContent, setNewContent] = useState('');
  const [newIsCurrent, setNewIsCurrent] = useState(true);
  const [newIsFeatured, setNewIsFeatured] = useState(false);

  // New writer state
  const [showNewWriterForm, setShowNewWriterForm] = useState(false);
  const [newWriterName, setNewWriterName] = useState('');
  const [newWriterRole, setNewWriterRole] = useState('');
  const [newWriterBio, setNewWriterBio] = useState('');
  const [newWriterAvatar, setNewWriterAvatar] = useState('');
  const [newWriterEmail, setNewWriterEmail] = useState('');
  const [newWriterTwitter, setNewWriterTwitter] = useState('');
  const [newWriterLocation, setNewWriterLocation] = useState('Colombo, Sri Lanka');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCreateArticle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    const paragraphs = newContent
      .split(/\n\n+/)
      .map(p => p.trim())
      .filter(Boolean);

    onAddNewArticle({
      title: newTitle.trim(),
      subtitle: newSubtitle.trim() || newTitle.trim(),
      summary: newSummary.trim() || newSubtitle.trim() || newTitle.trim(),
      content: paragraphs.length > 0 ? paragraphs : [newContent.trim()],
      authorId: newAuthorId || writers[0]?.id || 'w-sameera',
      publishedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      category: newCategory,
      imageUrl: newImageUrl.trim() || 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=1200&h=630',
      readTime: newReadTime.trim() || '6 min read',
      isCurrent: newIsCurrent,
      isFeatured: newIsFeatured,
    });

    setNewTitle('');
    setNewSubtitle('');
    setNewSummary('');
    setNewContent('');
    setNewImageUrl('');
    setShowNewArticleForm(false);
  };

  const handleCreateWriter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWriterName.trim() || !newWriterRole.trim()) return;

    const writerId = `w-${Date.now()}`;
    onAddNewWriter({
      id: writerId,
      name: newWriterName.trim(),
      role: newWriterRole.trim(),
      bio: newWriterBio.trim() || `${newWriterName.trim()} writes on public affairs for The Ceylon Review.`,
      avatarUrl: newWriterAvatar.trim() || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400&h=400',
      email: newWriterEmail.trim() || `${newWriterName.toLowerCase().replace(/\s+/g, '.')}@ceylonreview.com`,
      twitter: newWriterTwitter.trim() || `@${newWriterName.toLowerCase().replace(/\s+/g, '_')}`,
      location: newWriterLocation.trim() || 'Colombo, Sri Lanka',
      joinedDate: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    });

    setNewWriterName('');
    setNewWriterRole('');
    setNewWriterBio('');
    setNewWriterAvatar('');
    setNewWriterEmail('');
    setNewWriterTwitter('');
    setShowNewWriterForm(false);
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Move article up or down in the primary stream (reorder)
  const handleMoveArticle = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === articles.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const reordered = [...articles];
    
    // Swap
    const temp = reordered[index];
    reordered[index] = reordered[targetIndex];
    reordered[targetIndex] = temp;

    setArticles(reordered);
  };

  // Export full articles + writers state to a downloadable JSON file
  const handleExportData = () => {
    const dataStr = JSON.stringify({
      version: 'ceylon_review_v1',
      exportedAt: new Date().toISOString(),
      articles,
      writers
    }, null, 2);
    
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `the_ceylon_review_editorial_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Import JSON backup data and validate its structure before applying
  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportError(null);
    setImportSuccess(false);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        
        // Validate basic structure
        if (!json.articles || !Array.isArray(json.articles) || !json.writers || !Array.isArray(json.writers)) {
          throw new Error('Invalid file format. The backup must contain articles and writers lists.');
        }

        // Verify some properties exist
        const hasValidArticles = json.articles.every((art: any) => art.id && art.title && Array.isArray(art.content));
        const hasValidWriters = json.writers.every((w: any) => w.id && w.name);

        if (!hasValidArticles || !hasValidWriters) {
          throw new Error('Data validation failed. Ensure articles and writers have required fields (id, title, name).');
        }

        // Set states
        setArticles(json.articles);
        setWriters(json.writers);
        setImportSuccess(true);
        setTimeout(() => setImportSuccess(false), 3000);
      } catch (err: any) {
        setImportError(err.message || 'Failed to parse JSON file.');
      }
    };
    reader.readAsText(file);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end"
      id="editorial-desk-overlay"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-lg bg-[#f5eedc] border-l-4 border-[#580a0a] shadow-2xl flex flex-col font-sans text-[#141110] animate-in slide-in-from-right duration-300 h-full"
        onClick={(e) => e.stopPropagation()}
        id="editorial-desk-drawer"
      >
      
      {/* Header Banner */}
      <div className="bg-[#141110] text-[#f5eedc] p-4 flex items-center justify-between border-b-2 border-[#580a0a]">
        <div className="flex items-center gap-2">
          <Shield size={18} className="text-[#ebdcb9] animate-pulse" />
          <div>
            <h2 className="font-serif font-black text-sm uppercase tracking-wider text-white">Sovereign Editor's Desk</h2>
            <p className="font-mono text-[9px] text-[#ebdcb9]/70 uppercase">Interactive Newsroom CMS Control Panel</p>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="p-1 hover:bg-white/10 rounded cursor-pointer transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex bg-[#ebdcb9]/40 border-b border-[#580a0a]/20 text-xs font-mono">
        <button 
          onClick={() => setActiveSubTab('articles')}
          className={`flex-1 py-3 text-center border-r border-[#580a0a]/15 font-bold uppercase cursor-pointer ${activeSubTab === 'articles' ? 'bg-[#580a0a] text-white' : 'hover:bg-[#ebdcb9]/60'}`}
        >
          Manage Dispatches ({articles.length})
        </button>
        <button 
          onClick={() => setActiveSubTab('writers')}
          className={`flex-1 py-3 text-center border-r border-[#580a0a]/15 font-bold uppercase cursor-pointer ${activeSubTab === 'writers' ? 'bg-[#580a0a] text-white' : 'hover:bg-[#ebdcb9]/60'}`}
        >
          Writers ({writers.length})
        </button>
        <button 
          onClick={() => setActiveSubTab('data')}
          className={`flex-1 py-3 text-center font-bold uppercase cursor-pointer ${activeSubTab === 'data' ? 'bg-[#580a0a] text-white' : 'hover:bg-[#ebdcb9]/60'}`}
        >
          CMS Backups & Options
        </button>
      </div>

      {/* Cloud Firestore Status Banner */}
      <div className="bg-[#141110] text-[#f5eedc] px-4 py-2 text-xs border-b border-[#580a0a]/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Cloud size={13} className={currentUser ? "text-emerald-400" : "text-amber-400"} />
          <div className="font-mono text-[10px]">
            {currentUser ? (
              <span className="text-emerald-300">
                Live Cloud Sync Active: <strong>{currentUser.email}</strong>
              </span>
            ) : (
              <span className="text-[#ebdcb9]/80">
                Cloud Sync: Local offline cache active.
              </span>
            )}
          </div>
        </div>
        {currentUser ? (
          onSignOutGoogle && (
            <button
              onClick={onSignOutGoogle}
              className="text-[9px] font-mono text-red-400 hover:text-red-300 underline cursor-pointer"
            >
              Sign Out
            </button>
          )
        ) : (
          onSignInGoogle && (
            <button
              onClick={onSignInGoogle}
              className="flex items-center gap-1 bg-[#580a0a] hover:bg-[#731212] text-white px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase cursor-pointer"
            >
              <LogIn size={9} />
              <span>Login as Editor</span>
            </button>
          )
        )}
      </div>

      {/* Body Area */}
      <div className="flex-grow p-5 overflow-y-auto space-y-6">
        
        {/* SUBTAB: ARTICLES */}
        {activeSubTab === 'articles' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#580a0a]/15">
              <div>
                <h3 className="font-serif font-black text-sm uppercase tracking-wide">Live Dispatch Hierarchy</h3>
                <p className="font-mono text-[9px] text-[#5e5347]">Top article (Index 0) is dynamically FEATURED</p>
              </div>
              <button
                onClick={() => setShowNewArticleForm(!showNewArticleForm)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#580a0a] hover:bg-[#731212] text-white font-mono text-[10px] font-bold uppercase rounded cursor-pointer transition-all shadow-sm"
              >
                <Plus size={12} />
                <span>{showNewArticleForm ? 'Close Composer' : 'Compose New Dispatch'}</span>
              </button>
            </div>

            {/* COMPOSE NEW DISPATCH ACCORDION / FORM */}
            {showNewArticleForm && (
              <form onSubmit={handleCreateArticle} className="p-4 bg-[#ebdcb9]/35 border-2 border-[#580a0a]/30 rounded space-y-3 animate-in fade-in duration-200">
                <div className="flex items-center justify-between border-b border-[#580a0a]/20 pb-2">
                  <h4 className="font-serif font-black text-xs uppercase tracking-wider text-[#580a0a] flex items-center gap-1.5">
                    <FileText size={13} />
                    <span>Publish Weekly Dispatch</span>
                  </h4>
                  <span className="font-mono text-[9px] text-[#5e5347]">Auto-publishes to current edition</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="md:col-span-2">
                    <label className="block font-mono text-[9px] font-bold uppercase text-[#5e5347] mb-1">
                      Dispatch Title *
                    </label>
                    <input 
                      type="text" 
                      required 
                      value={newTitle} 
                      onChange={e => setNewTitle(e.target.value)}
                      placeholder="e.g. Sovereign Debt Realignment: The Treasury Gazette Breakdown"
                      className="w-full text-xs font-serif font-bold p-2 bg-[#f5eedc] border border-[#580a0a]/30 rounded focus:outline-none focus:ring-1 focus:ring-[#580a0a]"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block font-mono text-[9px] font-bold uppercase text-[#5e5347] mb-1">
                      Deck / Subtitle
                    </label>
                    <input 
                      type="text" 
                      value={newSubtitle} 
                      onChange={e => setNewSubtitle(e.target.value)}
                      placeholder="A comprehensive breakdown of legislative compromises and international oversight."
                      className="w-full text-xs font-sans p-2 bg-[#f5eedc] border border-[#580a0a]/30 rounded focus:outline-none focus:ring-1 focus:ring-[#580a0a]"
                    />
                  </div>

                  <div>
                    <label className="block font-mono text-[9px] font-bold uppercase text-[#5e5347] mb-1">
                      Desk Category
                    </label>
                    <select 
                      value={newCategory} 
                      onChange={e => setNewCategory(e.target.value as Category)}
                      className="w-full text-xs font-mono p-2 bg-[#f5eedc] border border-[#580a0a]/30 rounded focus:outline-none focus:ring-1 focus:ring-[#580a0a]"
                    >
                      <option value="Politics">Politics</option>
                      <option value="Opinion">Opinion</option>
                      <option value="Business">Business</option>
                      <option value="Culture">Culture</option>
                      <option value="Tech">Tech</option>
                      <option value="Science">Science</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-mono text-[9px] font-bold uppercase text-[#5e5347] mb-1">
                      Byline Author
                    </label>
                    <select 
                      value={newAuthorId} 
                      onChange={e => setNewAuthorId(e.target.value)}
                      className="w-full text-xs font-mono p-2 bg-[#f5eedc] border border-[#580a0a]/30 rounded focus:outline-none focus:ring-1 focus:ring-[#580a0a]"
                    >
                      {writers.map(w => (
                        <option key={w.id} value={w.id}>{w.name} ({w.role})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-mono text-[9px] font-bold uppercase text-[#5e5347] mb-1">
                      Est. Read Time
                    </label>
                    <input 
                      type="text" 
                      value={newReadTime} 
                      onChange={e => setNewReadTime(e.target.value)}
                      placeholder="e.g. 5 min read"
                      className="w-full text-xs font-mono p-2 bg-[#f5eedc] border border-[#580a0a]/30 rounded focus:outline-none focus:ring-1 focus:ring-[#580a0a]"
                    />
                  </div>

                  <div>
                    <label className="block font-mono text-[9px] font-bold uppercase text-[#5e5347] mb-1">
                      Cover Image URL
                    </label>
                    <input 
                      type="url" 
                      value={newImageUrl} 
                      onChange={e => setNewImageUrl(e.target.value)}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full text-xs font-mono p-2 bg-[#f5eedc] border border-[#580a0a]/30 rounded focus:outline-none focus:ring-1 focus:ring-[#580a0a]"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block font-mono text-[9px] font-bold uppercase text-[#5e5347] mb-1">
                      Summary (Lead Broadsheet Hook)
                    </label>
                    <textarea 
                      rows={2}
                      value={newSummary} 
                      onChange={e => setNewSummary(e.target.value)}
                      placeholder="Brief 2-sentence summary that appears on front page article cards..."
                      className="w-full text-xs font-serif p-2 bg-[#f5eedc] border border-[#580a0a]/30 rounded focus:outline-none focus:ring-1 focus:ring-[#580a0a]"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block font-mono text-[9px] font-bold uppercase text-[#5e5347] mb-1">
                      Full Article Body * (Separate paragraphs with double Enter)
                    </label>
                    <textarea 
                      rows={6}
                      required
                      value={newContent} 
                      onChange={e => setNewContent(e.target.value)}
                      placeholder="Write or paste full article dispatch text here. Each blank line between paragraphs will format automatically into newspaper editorial sections."
                      className="w-full text-xs font-serif p-2 bg-[#f5eedc] border border-[#580a0a]/30 rounded focus:outline-none focus:ring-1 focus:ring-[#580a0a]"
                    />
                  </div>

                  <div className="md:col-span-2 flex items-center gap-6 pt-1">
                    <label className="flex items-center gap-2 cursor-pointer font-mono text-[10px] font-bold text-[#141110]">
                      <input 
                        type="checkbox" 
                        checked={newIsCurrent} 
                        onChange={e => setNewIsCurrent(e.target.checked)}
                        className="accent-[#580a0a]"
                      />
                      <span>Publish to Current News Stream</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer font-mono text-[10px] font-bold text-[#141110]">
                      <input 
                        type="checkbox" 
                        checked={newIsFeatured} 
                        onChange={e => setNewIsFeatured(e.target.checked)}
                        className="accent-[#580a0a]"
                      />
                      <span>Pin as Lead Featured Banner</span>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-[#580a0a]/15">
                  <button 
                    type="button" 
                    onClick={() => setShowNewArticleForm(false)}
                    className="px-3 py-1.5 font-mono text-[10px] font-bold uppercase rounded bg-gray-200 text-gray-800 hover:bg-gray-300 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="px-4 py-1.5 font-mono text-[10px] font-bold uppercase rounded bg-[#580a0a] text-white hover:bg-[#731212] cursor-pointer flex items-center gap-1.5 shadow"
                  >
                    <Check size={12} />
                    <span>Publish Dispatch</span>
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
              {articles.map((art, idx) => (
                <div 
                  key={art.id} 
                  className={`p-3 bg-[#ebdcb9]/20 border border-[#580a0a]/25 rounded hover:bg-[#ebdcb9]/30 transition-all flex items-center justify-between gap-3 ${idx === 1 ? 'ring-2 ring-amber-700/40 bg-amber-500/5' : ''}`}
                >
                  <div className="flex-grow min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-[9px] font-extrabold bg-[#580a0a] text-white px-1.5 py-0.5 rounded">
                        #{idx + 1}
                      </span>
                      {idx === 0 && (
                        <span className="font-mono text-[9px] font-black uppercase text-amber-800 bg-amber-100 border border-amber-300 px-1 rounded">
                          ★ Featured
                        </span>
                      )}
                      {idx === 1 && (
                        <span className="font-mono text-[9px] font-black uppercase text-rose-800 bg-rose-100 border border-rose-300 px-1 rounded">
                          📌 Second Slot
                        </span>
                      )}
                      <span className="font-mono text-[9px] font-semibold text-[#5e5347] uppercase">
                        {art.category}
                      </span>
                    </div>
                    <h4 className="font-serif font-bold text-xs truncate leading-snug text-[#141110]">
                      {art.title}
                    </h4>
                    <p className="font-sans text-[10px] text-[#5e5347] truncate mt-0.5">
                      By {writers.find(w => w.id === art.authorId)?.name || 'Unknown Author'} • {art.publishedAt}
                    </p>
                  </div>

                  {/* Ordering & Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Shift Up */}
                    <button 
                      onClick={() => handleMoveArticle(idx, 'up')}
                      disabled={idx === 0}
                      className={`p-1 border border-[#580a0a]/20 rounded bg-[#ebdcb9]/40 hover:bg-[#ebdcb9]/80 cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed`}
                      title="Move Dispatch Up"
                    >
                      <ArrowUp size={12} />
                    </button>
                    {/* Shift Down */}
                    <button 
                      onClick={() => handleMoveArticle(idx, 'down')}
                      disabled={idx === articles.length - 1}
                      className={`p-1 border border-[#580a0a]/20 rounded bg-[#ebdcb9]/40 hover:bg-[#ebdcb9]/80 cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed`}
                      title="Move Dispatch Down"
                    >
                      <ArrowDown size={12} />
                    </button>
                    {/* Delete */}
                    <button 
                      onClick={() => {
                        if (window.confirm(`Are you absolutely sure you want to delete the dispatch: "${art.title}"? This cannot be undone.`)) {
                          onDeleteArticle(art.id);
                        }
                      }}
                      className="p-1 border border-red-800/20 text-red-700 rounded bg-red-100/40 hover:bg-red-100 cursor-pointer"
                      title="Delete Dispatch"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-[10px] font-sans text-[#5e5347] leading-normal italic text-center pt-2">
              Note: To edit the full text, categories, or summary of any article, simply click the "Modify Article" button when reading it in standard view!
            </p>
          </div>
        )}

        {/* SUBTAB: WRITERS */}
        {activeSubTab === 'writers' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#580a0a]/15">
              <div>
                <h3 className="font-serif font-black text-sm uppercase tracking-wide">Journalists Directory</h3>
                <p className="font-mono text-[9px] text-[#5e5347]">Authorized editorial voices</p>
              </div>
              <button
                onClick={() => setShowNewWriterForm(!showNewWriterForm)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#580a0a] hover:bg-[#731212] text-white font-mono text-[10px] font-bold uppercase rounded cursor-pointer transition-all shadow-sm"
              >
                <UserPlus size={12} />
                <span>{showNewWriterForm ? 'Close Form' : 'Register New Journalist'}</span>
              </button>
            </div>

            {/* REGISTER NEW JOURNALIST FORM */}
            {showNewWriterForm && (
              <form onSubmit={handleCreateWriter} className="p-4 bg-[#ebdcb9]/35 border-2 border-[#580a0a]/30 rounded space-y-3 animate-in fade-in duration-200">
                <h4 className="font-serif font-black text-xs uppercase tracking-wider text-[#580a0a] flex items-center gap-1.5 border-b border-[#580a0a]/15 pb-2">
                  <UserPlus size={13} />
                  <span>New Staff / Contributing Reporter</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-mono text-[9px] font-bold uppercase text-[#5e5347] mb-1">
                      Full Name *
                    </label>
                    <input 
                      type="text" 
                      required 
                      value={newWriterName} 
                      onChange={e => setNewWriterName(e.target.value)}
                      placeholder="e.g. Priyantha Jayasuriya"
                      className="w-full text-xs font-serif font-bold p-2 bg-[#f5eedc] border border-[#580a0a]/30 rounded focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-mono text-[9px] font-bold uppercase text-[#5e5347] mb-1">
                      Desk Role *
                    </label>
                    <input 
                      type="text" 
                      required 
                      value={newWriterRole} 
                      onChange={e => setNewWriterRole(e.target.value)}
                      placeholder="e.g. Senior Parliamentary Reporter"
                      className="w-full text-xs font-mono p-2 bg-[#f5eedc] border border-[#580a0a]/30 rounded focus:outline-none"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block font-mono text-[9px] font-bold uppercase text-[#5e5347] mb-1">
                      Biographical Dossier
                    </label>
                    <textarea 
                      rows={2}
                      value={newWriterBio} 
                      onChange={e => setNewWriterBio(e.target.value)}
                      placeholder="Brief reporting background, focus beats, past coverage..."
                      className="w-full text-xs font-serif p-2 bg-[#f5eedc] border border-[#580a0a]/30 rounded focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-mono text-[9px] font-bold uppercase text-[#5e5347] mb-1">
                      Avatar Photo URL
                    </label>
                    <input 
                      type="url" 
                      value={newWriterAvatar} 
                      onChange={e => setNewWriterAvatar(e.target.value)}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full text-xs font-mono p-2 bg-[#f5eedc] border border-[#580a0a]/30 rounded focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-mono text-[9px] font-bold uppercase text-[#5e5347] mb-1">
                      Contact Email
                    </label>
                    <input 
                      type="email" 
                      value={newWriterEmail} 
                      onChange={e => setNewWriterEmail(e.target.value)}
                      placeholder="journalist@ceylonreview.com"
                      className="w-full text-xs font-mono p-2 bg-[#f5eedc] border border-[#580a0a]/30 rounded focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-[#580a0a]/15">
                  <button 
                    type="button" 
                    onClick={() => setShowNewWriterForm(false)}
                    className="px-3 py-1.5 font-mono text-[10px] font-bold uppercase rounded bg-gray-200 text-gray-800 hover:bg-gray-300 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="px-4 py-1.5 font-mono text-[10px] font-bold uppercase rounded bg-[#580a0a] text-white hover:bg-[#731212] cursor-pointer flex items-center gap-1.5 shadow"
                  >
                    <Check size={12} />
                    <span>Save Journalist</span>
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-2 max-h-[55vh] overflow-y-auto pr-1">
              {writers.map((writer) => {
                const count = articles.filter(a => a.authorId === writer.id).length;
                return (
                  <div key={writer.id} className="p-3 bg-[#ebdcb9]/20 border border-[#580a0a]/25 rounded flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img 
                        src={writer.avatarUrl} 
                        alt={writer.name} 
                        className="w-9 h-9 rounded-full object-cover border border-[#580a0a]/20 shrink-0"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150&h=150';
                        }}
                      />
                      <div>
                        <h4 className="font-serif font-bold text-xs text-[#141110]">
                          {writer.name}
                        </h4>
                        <p className="font-mono text-[9px] text-[#580a0a] font-bold uppercase mt-0.5">
                          {writer.role}
                        </p>
                        <p className="font-sans text-[10px] text-[#5e5347]">
                          {count} publication{count !== 1 ? 's' : ''} • Joined {writer.joinedDate}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="text-[10px] font-sans text-[#5e5347] leading-normal italic text-center pt-2">
              Note: You can add new writers or edit their full profile descriptions (bio, email, avatar, and credentials) directly inside the main "Reporters" tab while in active Editor Mode!
            </p>
          </div>
        )}

        {/* SUBTAB: DATA OPTIONS */}
        {activeSubTab === 'data' && (
          <div className="space-y-6">
            
            {/* Import / Export CMS backups */}
            <div className="bg-[#ebdcb9]/30 border-2 border-[#580a0a]/35 p-4 rounded space-y-4">
              <h3 className="font-serif font-black text-sm uppercase tracking-wide border-b border-[#580a0a]/15 pb-1.5">
                Site Data CMS Portability
              </h3>
              <p className="font-sans text-xs text-[#5e5347] leading-normal">
                Because this website is fully offline-capable, all your live additions, reorderings, and revisions are securely kept in your local browser cache. 
                Use these tools to **backup** or **publish** your edits across different machines!
              </p>

              <div className="grid grid-cols-2 gap-3 pt-2">
                {/* Export Backup JSON Button */}
                <button
                  onClick={handleExportData}
                  className="flex items-center justify-center gap-1.5 p-2.5 bg-[#580a0a] hover:bg-[#731212] text-white font-mono text-[10px] font-bold uppercase tracking-wider rounded cursor-pointer shadow-sm transition-all"
                  title="Download full database as JSON backup file"
                >
                  <Download size={12} />
                  <span>Export Backup</span>
                </button>

                {/* Import Backup JSON Button */}
                <button
                  onClick={triggerFileInput}
                  className="flex items-center justify-center gap-1.5 p-2.5 bg-[#141110] hover:bg-black text-[#f5eedc] font-mono text-[10px] font-bold uppercase tracking-wider rounded cursor-pointer border border-[#580a0a]/20 shadow-sm transition-all"
                  title="Load articles and writers from a JSON file"
                >
                  <Upload size={12} />
                  <span>Import Backup</span>
                </button>
              </div>

              {/* Secret hidden File Input for JSON import */}
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleImportData}
                accept=".json"
                className="hidden"
              />

              {/* Import status display */}
              {importError && (
                <div className="p-3 bg-red-100 border border-red-300 rounded text-red-800 text-[11px] leading-normal flex gap-1.5 items-start">
                  <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                  <span>{importError}</span>
                </div>
              )}

              {importSuccess && (
                <div className="p-3 bg-green-100 border border-green-300 rounded text-green-800 text-[11px] font-bold flex gap-1.5 items-center">
                  <Check size={14} className="shrink-0" />
                  <span>Site content imported and updated successfully!</span>
                </div>
              )}
            </div>

            {/* Reset site state */}
            <div className="p-4 bg-red-500/5 border-2 border-red-800/15 rounded space-y-3">
              <h3 className="font-serif font-black text-sm uppercase tracking-wide text-red-950 flex items-center gap-1.5">
                <AlertTriangle size={15} className="text-red-700" />
                <span>Reset Sovereign Archives</span>
              </h3>
              <p className="font-sans text-xs text-red-950/70 leading-normal">
                Want to erase all browser-side additions, comments, likes, and profile adjustments and restore the Ceylon Review back to the factory-fresh broadsheet?
              </p>

              {showConfirmReset ? (
                <div className="space-y-2 pt-2 animate-in fade-in duration-200">
                  <p className="font-mono text-[10px] text-red-700 font-extrabold uppercase">
                    ⚠ WARNING: This deletes your edits permanently! Proceed?
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        onResetData();
                        setShowConfirmReset(false);
                      }}
                      className="flex-1 py-1.5 bg-red-700 hover:bg-red-800 text-white font-mono text-[9px] font-bold uppercase rounded cursor-pointer"
                    >
                      Yes, Wipe All Changes
                    </button>
                    <button
                      onClick={() => setShowConfirmReset(false)}
                      className="flex-1 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-800 font-mono text-[9px] font-bold uppercase rounded cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowConfirmReset(true)}
                  className="flex items-center justify-center gap-1.5 w-full p-2 bg-red-100 hover:bg-red-200 text-red-800 border border-red-300/30 font-mono text-[10px] font-bold uppercase tracking-wider rounded cursor-pointer transition-all"
                >
                  <RotateCcw size={11} />
                  <span>Revert to Default Broadsheet</span>
                </button>
              )}
            </div>

          </div>
        )}

      </div>

      {/* Control Panel Footer */}
      <div className="bg-[#141110] text-[#f5eedc]/60 p-3 border-t border-[#580a0a]/20 text-center font-mono text-[9px] uppercase font-bold tracking-wider">
        The Ceylon Review • Designed for Editorial Integrity
      </div>

      </div>
    </div>
  );
}
