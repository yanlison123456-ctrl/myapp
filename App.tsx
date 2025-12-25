
import React, { useState, useEffect, useMemo } from 'react';
import { Notice, AppView, User } from './types';
import { INITIAL_NOTICES, STORAGE_KEY, AUTH_KEY, DEFAULT_CATEGORIES } from './constants';
import { NoticeCard } from './NoticeCard';
import { enhanceNoticeContent } from './geminiService';

const App: React.FC = () => {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [currentView, setCurrentView] = useState<AppView>('home');
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isPolishing, setIsPolishing] = useState(false);

  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [noticeForm, setNoticeForm] = useState({ title: '', content: '', category: '健康关爱' });

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    setNotices(saved ? JSON.parse(saved) : INITIAL_NOTICES);
    const auth = localStorage.getItem(AUTH_KEY);
    if (auth) setUser(JSON.parse(auth));
  }, []);

  useEffect(() => {
    if (notices.length > 0) localStorage.setItem(STORAGE_KEY, JSON.stringify(notices));
  }, [notices]);

  const filteredNotices = useMemo(() => {
    return notices
      .filter(n => n.title.includes(searchQuery) || n.content.includes(searchQuery))
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [notices, searchQuery]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginForm.username === 'admin' && loginForm.password === 'admin123') {
      const u = { username: '管理员', isAdmin: true };
      setUser(u);
      localStorage.setItem(AUTH_KEY, JSON.stringify(u));
      setCurrentView('admin');
    } else {
      alert('验证失败 (admin/admin123)');
    }
  };

  const handlePolish = async () => {
    if (!noticeForm.content) return;
    setIsPolishing(true);
    const polished = await enhanceNoticeContent(noticeForm.title, noticeForm.content);
    setNoticeForm({ ...noticeForm, content: polished });
    setIsPolishing(false);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const newNotice: Notice = {
      id: Date.now().toString(),
      ...noticeForm,
      createdAt: Date.now(),
      author: user?.username || '管理处'
    };
    setNotices([newNotice, ...notices]);
    setNoticeForm({ title: '', content: '', category: '健康关爱' });
    setCurrentView('admin');
  };

  return (
    <div className="min-h-screen bg-slate-100 flex justify-center">
      <div className="w-full max-w-md bg-white min-h-screen shadow-2xl flex flex-col relative border-x border-slate-200">
        {/* Header */}
        <header className="bg-blue-800 text-white p-4 sticky top-0 z-30 flex justify-between items-center shadow-lg">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setCurrentView('home')}>
            <div className="bg-white p-1 rounded-full">
               <svg className="w-5 h-5 text-blue-800" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a8 8 0 100 16 8 8 0 000-16zm-1 4a1 1 0 112 0v4a1 1 0 01-1 1H7a1 1 0 110-2h1V6z" /></svg>
            </div>
            <span className="text-xl font-bold tracking-wider italic">惠警暖警</span>
          </div>
          {user ? (
            <div className="flex gap-2">
              <button onClick={() => setCurrentView('admin')} className="text-xs border border-white/50 px-2 py-1 rounded">管理</button>
              <button onClick={() => { setUser(null); localStorage.removeItem(AUTH_KEY); setCurrentView('home'); }} className="text-xs bg-red-600 px-2 py-1 rounded">退出</button>
            </div>
          ) : (
            <button onClick={() => setCurrentView('login')} className="text-xs bg-yellow-500 text-blue-900 px-3 py-1 rounded-full font-bold">后台管理</button>
          )}
        </header>

        <main className="flex-1 p-4 pb-24 overflow-y-auto">
          {currentView === 'home' && (
            <div className="space-y-4">
              <div className="relative">
                <input 
                  type="text" placeholder="搜寻惠警政策、通知公告..." 
                  className="w-full p-4 pl-12 bg-white rounded-2xl border border-slate-200 shadow-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                  value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                />
                <svg className="absolute left-4 top-4 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              </div>
              
              <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                {DEFAULT_CATEGORIES.map(cat => (
                   <span key={cat} className="whitespace-nowrap px-3 py-1 bg-slate-200 text-slate-600 rounded-full text-xs font-medium">{cat}</span>
                ))}
              </div>

              {filteredNotices.map(n => (
                <NoticeCard key={n.id} notice={n} onClick={(notice) => { setSelectedNotice(notice); setCurrentView('detail'); }} />
              ))}
            </div>
          )}

          {currentView === 'detail' && selectedNotice && (
            <div className="animate-in slide-in-from-right duration-300">
              <button onClick={() => setCurrentView('home')} className="text-blue-700 mb-6 flex items-center font-bold">
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                返回列表
              </button>
              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xl overflow-hidden relative">
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 -mr-12 -mt-12 rounded-full opacity-50"></div>
                <span className="bg-blue-800 text-white text-[10px] px-3 py-1 rounded-full font-bold shadow-sm">{selectedNotice.category}</span>
                <h2 className="text-2xl font-bold mt-4 text-slate-900 leading-tight">{selectedNotice.title}</h2>
                <div className="flex items-center gap-3 text-xs text-slate-400 my-6 border-y py-4 border-slate-50">
                   <div className="bg-slate-100 p-2 rounded-full">
                     <svg className="w-4 h-4 text-slate-500" fill="currentColor" viewBox="0 0 20 20"><path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" /></svg>
                   </div>
                   <div>
                     <p className="font-bold text-slate-700">{selectedNotice.author}</p>
                     <p>{new Date(selectedNotice.createdAt).toLocaleString('zh-CN')}</p>
                   </div>
                </div>
                <div className="text-slate-700 leading-relaxed whitespace-pre-wrap text-[15px]">{selectedNotice.content}</div>
              </div>
            </div>
          )}

          {currentView === 'login' && (
            <form onSubmit={handleLogin} className="py-10 space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-extrabold text-blue-900">后台管理登录</h2>
                <p className="text-slate-400 text-sm">请输入管理员凭据以进行内容维护</p>
              </div>
              <div className="space-y-4">
                <input type="text" placeholder="管理员账号" required className="w-full p-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-800 transition-all outline-none" value={loginForm.username} onChange={e => setLoginForm({...loginForm, username: e.target.value})} />
                <input type="password" placeholder="管理密码" required className="w-full p-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-800 transition-all outline-none" value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} />
              </div>
              <button type="submit" className="w-full bg-blue-800 text-white p-4 rounded-2xl font-bold shadow-lg active:scale-[0.98] transition-all">确认进入</button>
              <button type="button" onClick={() => setCurrentView('home')} className="w-full text-slate-400 text-sm py-2">放弃登录</button>
            </form>
          )}

          {currentView === 'admin' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-slate-800">通知内容库</h2>
                <button onClick={() => setCurrentView('create')} className="bg-blue-800 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md">发布资讯</button>
              </div>
              <div className="space-y-3">
                {notices.map(n => (
                  <div key={n.id} className="flex justify-between items-center p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
                    <div className="flex-1 truncate pr-4">
                       <p className="font-bold text-slate-800 truncate">{n.title}</p>
                       <p className="text-[10px] text-slate-400">{n.category}</p>
                    </div>
                    <button onClick={() => setNotices(notices.filter(item => item.id !== n.id))} className="text-red-500 bg-red-50 px-3 py-1 rounded-lg text-xs font-bold">删除</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentView === 'create' && (
            <form onSubmit={handleCreate} className="space-y-5">
              <button type="button" onClick={() => setCurrentView('admin')} className="text-slate-400 text-sm flex items-center mb-2">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                取消发布
              </button>
              <h2 className="text-2xl font-bold text-slate-800">撰写惠警资讯</h2>
              <input type="text" placeholder="资讯标题" required className="w-full p-4 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-800" value={noticeForm.title} onChange={e => setNoticeForm({...noticeForm, title: e.target.value})} />
              <select className="w-full p-4 border border-slate-200 rounded-2xl bg-white outline-none" value={noticeForm.category} onChange={e => setNoticeForm({...noticeForm, category: e.target.value})}>
                {DEFAULT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <div className="relative group">
                <textarea rows={8} placeholder="请输入资讯正文，或点击润色由AI优化措辞..." required className="w-full p-4 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-800 transition-all" value={noticeForm.content} onChange={e => setNoticeForm({...noticeForm, content: e.target.value})} />
                <button 
                  type="button" 
                  onClick={handlePolish}
                  disabled={isPolishing}
                  className="absolute bottom-4 right-4 bg-indigo-600 text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-1"
                >
                  {isPolishing ? <><div className="animate-spin rounded-full h-3 w-3 border-2 border-white/20 border-t-white"></div> 优化中...</> : '✨ AI润色'}
                </button>
              </div>
              <button type="submit" className="w-full bg-blue-800 text-white p-4 rounded-2xl font-bold shadow-xl active:scale-[0.98] transition-all">正式发布</button>
            </form>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
