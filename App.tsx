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
        <header className="bg-blue-800 text-white p-4 sticky top-0 z-30 flex justify-between items-center shadow-lg">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setCurrentView('home')}>
            <div className="bg-white p-1 rounded-full text-blue-800 font-bold text-xs">惠</div>
            <span className="text-xl font-bold tracking-wider italic">惠警暖警</span>
          </div>
          {user ? (
            <div className="flex gap-2">
              <button onClick={() => setCurrentView('admin')} className="text-xs border border-white/50 px-2 py-1 rounded">管理</button>
              <button onClick={() => { setUser(null); localStorage.removeItem(AUTH_KEY); setCurrentView('home'); }} className="text-xs bg-red-600 px-2 py-1 rounded">退出</button>
            </div>
          ) : (
            <button onClick={() => setCurrentView('login')} className="text-xs bg-yellow-500 text-blue-900 px-3 py-1 rounded-full font-bold">后台登录</button>
          )}
        </header>

        <main className="flex-1 p-4 pb-24 overflow-y-auto">
          {currentView === 'home' && (
            <div className="space-y-4">
              <input 
                type="text" placeholder="搜索资讯..." 
                className="w-full p-4 bg-white rounded-2xl border border-slate-200 shadow-sm outline-none"
                value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              />
              {filteredNotices.map(n => (
                <NoticeCard key={n.id} notice={n} onClick={(notice) => { setSelectedNotice(notice); setCurrentView('detail'); }} />
              ))}
            </div>
          )}

          {currentView === 'detail' && selectedNotice && (
            <div className="animate-in slide-in-from-right duration-300">
              <button onClick={() => setCurrentView('home')} className="text-blue-700 mb-6 font-bold flex items-center">← 返回列表</button>
              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xl">
                <span className="bg-blue-800 text-white text-[10px] px-3 py-1 rounded-full font-bold">{selectedNotice.category}</span>
                <h2 className="text-2xl font-bold mt-4 text-slate-900 leading-tight">{selectedNotice.title}</h2>
                <div className="text-xs text-slate-400 my-4 border-b pb-4">
                  {selectedNotice.author} · {new Date(selectedNotice.createdAt).toLocaleString()}
                </div>
                <div className="text-slate-700 leading-relaxed whitespace-pre-wrap">{selectedNotice.content}</div>
              </div>
            </div>
          )}

          {currentView === 'login' && (
            <form onSubmit={handleLogin} className="py-10 space-y-4">
              <h2 className="text-center text-2xl font-bold text-blue-900">管理员登录</h2>
              <input type="text" placeholder="账号" required className="w-full p-4 border rounded-2xl outline-none" value={loginForm.username} onChange={e => setLoginForm({...loginForm, username: e.target.value})} />
              <input type="password" placeholder="密码" required className="w-full p-4 border rounded-2xl outline-none" value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} />
              <button type="submit" className="w-full bg-blue-800 text-white p-4 rounded-2xl font-bold shadow-lg">进入系统</button>
            </form>
          )}

          {currentView === 'admin' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">内容管理</h2>
                <button onClick={() => setCurrentView('create')} className="bg-blue-800 text-white px-4 py-2 rounded-xl text-sm font-bold">发布资讯</button>
              </div>
              <div className="space-y-2">
                {notices.map(n => (
                  <div key={n.id} className="flex justify-between items-center p-4 bg-white border rounded-2xl shadow-sm">
                    <span className="truncate flex-1 font-bold">{n.title}</span>
                    <button onClick={() => setNotices(notices.filter(item => item.id !== n.id))} className="text-red-500 text-sm ml-2">删除</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentView === 'create' && (
            <form onSubmit={handleCreate} className="space-y-4">
              <button type="button" onClick={() => setCurrentView('admin')} className="text-slate-400 text-sm">← 取消</button>
              <h2 className="text-xl font-bold text-slate-800">发布新通知</h2>
              <input type="text" placeholder="标题" required className="w-full p-4 border rounded-2xl outline-none" value={noticeForm.title} onChange={e => setNoticeForm({...noticeForm, title: e.target.value})} />
              <select className="w-full p-4 border rounded-2xl bg-white outline-none" value={noticeForm.category} onChange={e => setNoticeForm({...noticeForm, category: e.target.value})}>
                {DEFAULT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <div className="relative">
                <textarea rows={8} placeholder="详情内容..." required className="w-full p-4 border rounded-2xl outline-none" value={noticeForm.content} onChange={e => setNoticeForm({...noticeForm, content: e.target.value})} />
                <button 
                  type="button" 
                  onClick={handlePolish}
                  disabled={isPolishing}
                  className="absolute bottom-4 right-4 bg-indigo-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg disabled:opacity-50"
                >
                  {isPolishing ? '润色中...' : '✨ AI 润色'}
                </button>
              </div>
              <button type="submit" className="w-full bg-blue-800 text-white p-4 rounded-2xl font-bold">正式发布</button>
            </form>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;