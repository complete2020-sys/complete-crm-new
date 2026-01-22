import React, { useState, useEffect, useMemo, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged, 
  signInWithCustomToken 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  onSnapshot, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  serverTimestamp,
  setDoc,
  getDoc,
  writeBatch
} from 'firebase/firestore';
import { 
  LayoutDashboard, 
  Briefcase, 
  Users, 
  Settings, 
  LogOut, 
  Plus, 
  Search, 
  Filter, 
  MoreVertical,
  CheckCircle2,
  Clock,
  AlertCircle,
  Package,
  Palette,
  Megaphone,
  Monitor,
  Truck,
  Trash2,
  Shield,
  User,
  CalendarDays,
  Lock,
  Share2, 
  Wifi,    
  Copy,    
  X,
  Download, 
  Upload,   
  FileJson, 
  AlertTriangle,
  HelpCircle // Added Help Icon
} from 'lucide-react';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA571lwo6pLkMjJeD_3rtfuDed8fizyN3w",
  authDomain: "complete-crm-001.firebaseapp.com",
  projectId: "complete-crm-001",
  storageBucket: "complete-crm-001.firebasestorage.app",
  messagingSenderId: "592258733837",
  appId: "1:592258733837:web:781f6bea5da4611f604244"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = "complete-crm-v1"; // 원하는 이름 아무거나

// --- Types ---
type Department = 'design' | 'marketing' | 'homepage' | '3pl';
type Status = 'pending' | 'in-progress' | 'review' | 'completed';
type Role = 'admin' | 'staff' | 'viewer';

interface Project {
  id: string;
  title: string;
  client: string;
  department: Department;
  status: Status;
  assignedTo: string;
  startDate: string;
  dueDate: string;
  createdAt: any;
}

interface UserProfile {
  id: string;
  name: string;
  role: Role;
  email: string; // Simulated for display
  department: Department | 'all';
}

// --- Constants ---
const DEPARTMENTS: Record<Department, { label: string; icon: any; color: string }> = {
  design: { label: '디자인', icon: Palette, color: 'bg-pink-100 text-pink-700' },
  marketing: { label: '마케팅', icon: Megaphone, color: 'bg-blue-100 text-blue-700' },
  homepage: { label: '홈페이지', icon: Monitor, color: 'bg-green-100 text-green-700' },
  '3pl': { label: '3PL 물류', icon: Truck, color: 'bg-orange-100 text-orange-700' },
};

const STATUSES: Record<Status, { label: string; icon: any; color: string }> = {
  pending: { label: '대기중', icon: Clock, color: 'bg-gray-100 text-gray-600' },
  'in-progress': { label: '진행중', icon: Package, color: 'bg-indigo-100 text-indigo-600' },
  review: { label: '검토중', icon: AlertCircle, color: 'bg-yellow-100 text-yellow-600' },
  completed: { label: '완료', icon: CheckCircle2, color: 'bg-emerald-100 text-emerald-600' },
};

// --- Components ---

const LoginScreen = ({ onLogin }: { onLogin: (name: string, isAdmin: boolean) => void }) => {
  const [name, setName] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [password, setPassword] = useState(''); 
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('이름을 입력해주세요.');
      return;
    }

    // Admin Password Check
    if (isAdmin) {
      if (password !== 'admin1234') {
        setError('관리자 암호가 올바르지 않습니다.');
        return;
      }
    }

    onLogin(name, isAdmin);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-lg mx-auto flex items-center justify-center mb-4">
            <span className="text-white text-2xl font-bold">C</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">COMPLETE CRM</h1>
          <p className="text-slate-500 mt-2">내부 업무 통합 관리 시스템</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">이름</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              placeholder="이름을 입력하세요"
            />
          </div>
          
          <div className="flex items-center space-x-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
            <input 
              type="checkbox" 
              id="adminCheck" 
              checked={isAdmin}
              onChange={(e) => {
                setIsAdmin(e.target.checked);
                setError('');
                setPassword('');
              }}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <label htmlFor="adminCheck" className="text-sm text-slate-700 font-medium cursor-pointer">
              관리자 권한으로 로그인
            </label>
          </div>

          {isAdmin && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
              <label className="block text-sm font-medium text-slate-700 mb-1">관리자 암호</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  placeholder="관리자 암호를 입력하세요"
                />
              </div>
              <p className="text-xs text-slate-400 mt-1">
                * 초기 암호: <span className="font-mono font-bold text-slate-600">admin1234</span>
              </p>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center animate-in fade-in zoom-in-95 duration-200">
              <AlertCircle size={16} className="mr-2 flex-shrink-0" />
              {error}
            </div>
          )}

          <button 
            type="submit" 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors shadow-md hover:shadow-lg"
          >
            시스템 접속
          </button>
        </form>
        <p className="text-xs text-center text-slate-400 mt-6">
          © 2024 COMPLETE Corp. All rights reserved.
        </p>
      </div>
    </div>
  );
};

const StatusBadge = ({ status }: { status: Status }) => {
  const config = STATUSES[status];
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
      <Icon className="w-3 h-3 mr-1" />
      {config.label}
    </span>
  );
};

const DepartmentBadge = ({ dept }: { dept: Department }) => {
  const config = DEPARTMENTS[dept];
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
      {config.label}
    </span>
  );
};

// --- Main App Component ---

export default function App() {
  const [user, setUser] = useState<any>(null); // Firebase Auth User
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'projects' | 'admin'>('dashboard');
  
  // Data State
  const [projects, setProjects] = useState<Project[]>([]);
  const [teamMembers, setTeamMembers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // UI State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false); // Share Modal
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false); // Help Modal
  const [filterDept, setFilterDept] = useState<Department | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null); // For file upload

  // Form State
  const [newProject, setNewProject] = useState({
    title: '',
    client: '',
    department: 'design' as Department,
    startDate: '', 
    dueDate: '',
    assignedTo: ''
  });

  // --- Firebase Initialization & Effects ---

  useEffect(() => {
    const initAuth = async () => {
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        await signInWithCustomToken(auth, __initial_auth_token);
      } else {
        await signInAnonymously(auth);
      }
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (!firebaseUser) setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Fetch Data
  useEffect(() => {
    if (!user) return;

    // Fetch Projects
    const projectsQuery = collection(db, 'artifacts', appId, 'public', 'data', 'crm_projects');
    const unsubProjects = onSnapshot(projectsQuery, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
      data.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setProjects(data);
      setLoading(false);
    }, (err) => console.error("Projects Error:", err));

    // Fetch Team Members
    const usersQuery = collection(db, 'artifacts', appId, 'public', 'data', 'crm_users');
    const unsubUsers = onSnapshot(usersQuery, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserProfile));
      setTeamMembers(data);
      
      const current = localStorage.getItem('crm_current_user_id');
      if (current) {
        const found = data.find(u => u.id === current);
        if (found) setUserProfile(found);
      }
    }, (err) => console.error("Users Error:", err));

    return () => {
      unsubProjects();
      unsubUsers();
    };
  }, [user]);

  // --- Handlers ---

  const handleLogin = async (name: string, isAdmin: boolean) => {
    if (!user) return;
    
    const userId = user.uid; 
    
    const newProfile: UserProfile = {
      id: userId,
      name: name,
      role: isAdmin ? 'admin' : 'staff',
      email: `${name.toLowerCase()}@complete.com`,
      department: 'all'
    };

    try {
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'crm_users', userId), newProfile, { merge: true });
      localStorage.setItem('crm_current_user_id', userId);
      setUserProfile(newProfile);
    } catch (e) {
      console.error("Error creating user profile", e);
    }
  };

  const handleLogout = () => {
    setUserProfile(null);
    localStorage.removeItem('crm_current_user_id');
    setActiveTab('dashboard');
  };

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !userProfile) return;

    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'crm_projects'), {
        ...newProject,
        status: 'pending',
        createdAt: serverTimestamp(),
        owner: userProfile.name
      });
      setIsModalOpen(false);
      setNewProject({
        title: '',
        client: '',
        department: 'design',
        startDate: '',
        dueDate: '',
        assignedTo: ''
      });
    } catch (error) {
      console.error("Error adding project:", error);
    }
  };

  const handleStatusChange = async (projectId: string, newStatus: Status) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'crm_projects', projectId), {
        status: newStatus
      });
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!user || !confirm("정말로 이 프로젝트를 삭제하시겠습니까?")) return;
    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'crm_projects', projectId));
    } catch (error) {
      console.error("Error deleting project:", error);
    }
  };

  const handleUpdateRole = async (targetUserId: string, newRole: Role) => {
    if(!user) return;
    try {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'crm_users', targetUserId), {
        role: newRole
      });
    } catch(error) {
      console.error("Error updating role:", error);
    }
  };

  // --- Data Export/Import Logic ---
  
  const handleExportData = () => {
    const data = {
      projects,
      users: teamMembers,
      exportedAt: new Date().toISOString(),
      appId: appId
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `complete_crm_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportData = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (!json.projects) throw new Error("Invalid format");
        
        const confirmMsg = `백업 파일에서 ${json.projects.length}개의 프로젝트를 불러오시겠습니까?`;
        if(!confirm(confirmMsg)) return;

        // Simple batch import (just looping for simplicity in this demo)
        const batch = writeBatch(db);
        
        // Import Projects
        json.projects.forEach((p: any) => {
          // Use original ID if possible, or new ID to avoid conflict? 
          // Let's use setDoc to overwrite/restore exact state if IDs match
          const ref = doc(db, 'artifacts', appId, 'public', 'data', 'crm_projects', p.id || String(Date.now()));
          const { id, ...data } = p; // Remove id from data payload if it exists
          batch.set(ref, data, { merge: true });
        });

        await batch.commit();
        alert("데이터 복원이 완료되었습니다!");
      } catch (err) {
        console.error(err);
        alert("파일을 읽는 중 오류가 발생했습니다. 올바른 백업 파일인지 확인해주세요.");
      }
    };
    reader.readAsText(file);
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };


  // --- Derived State ---

  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const matchesDept = filterDept === 'all' || p.department === filterDept;
      const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            p.client.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesDept && matchesSearch;
    });
  }, [projects, filterDept, searchTerm]);

  const stats = useMemo(() => {
    return {
      total: projects.length,
      pending: projects.filter(p => p.status === 'pending').length,
      inProgress: projects.filter(p => p.status === 'in-progress').length,
      completed: projects.filter(p => p.status === 'completed').length,
      byDept: {
        design: projects.filter(p => p.department === 'design').length,
        marketing: projects.filter(p => p.department === 'marketing').length,
        homepage: projects.filter(p => p.department === 'homepage').length,
        '3pl': projects.filter(p => p.department === '3pl').length,
      }
    };
  }, [projects]);


  // --- Render ---

  if (!userProfile) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shadow-xl">
        <div className="p-6 flex items-center space-x-3 border-b border-slate-700">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold">C</div>
          <span className="text-xl font-bold text-white">COMPLETE</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'dashboard' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800'}`}
          >
            <LayoutDashboard size={20} />
            <span>대시보드</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('projects')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'projects' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800'}`}
          >
            <Briefcase size={20} />
            <span>프로젝트 관리</span>
          </button>

          {userProfile.role === 'admin' && (
            <button 
              onClick={() => setActiveTab('admin')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'admin' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800'}`}
            >
              <Users size={20} />
              <span>팀원 및 권한 관리</span>
            </button>
          )}

          <div className="pt-4 mt-2 border-t border-slate-700 space-y-2">
             <button 
              onClick={() => setIsShareModalOpen(true)}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <Share2 size={20} />
              <span>팀원 초대하기</span>
            </button>
            <button 
              onClick={() => setIsHelpModalOpen(true)}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors text-emerald-400 hover:text-emerald-300 hover:bg-slate-800"
            >
              <HelpCircle size={20} />
              <span>사용 가이드</span>
            </button>
          </div>
        </nav>

        <div className="p-4 bg-slate-800">
           {/* Connection Status */}
           <div className="flex items-center space-x-2 text-xs text-green-400 mb-3 px-1">
              <Wifi size={12} />
              <span>실시간 연결됨 (Online)</span>
           </div>

          <div className="flex items-center space-x-3 px-3 py-2 rounded-lg bg-slate-900 mb-2 border border-slate-700">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm">
              {userProfile.name[0]}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium text-white truncate">{userProfile.name}</p>
              <p className="text-xs text-slate-400 capitalize">{userProfile.role === 'admin' ? '관리자' : '팀원'}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 text-slate-400 hover:text-white py-2 text-sm"
          >
            <LogOut size={16} />
            <span>로그아웃</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative">
        <header className="bg-white shadow-sm sticky top-0 z-10 px-8 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-slate-800">
            {activeTab === 'dashboard' && '대시보드'}
            {activeTab === 'projects' && '프로젝트 관리'}
            {activeTab === 'admin' && '팀원 및 권한 설정'}
          </h2>
          {activeTab === 'projects' && (
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 shadow-sm transition-all"
            >
              <Plus size={18} />
              <span>새 프로젝트</span>
            </button>
          )}
        </header>

        <div className="p-8">
          
          {/* Dashboard View */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8">
              {/* Stats Row */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-slate-500 text-sm">총 프로젝트</p>
                      <h3 className="text-3xl font-bold mt-1 text-slate-800">{stats.total}</h3>
                    </div>
                    <div className="p-2 bg-blue-50 rounded-lg text-blue-600"><Briefcase size={24} /></div>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-slate-500 text-sm">진행중</p>
                      <h3 className="text-3xl font-bold mt-1 text-indigo-600">{stats.inProgress}</h3>
                    </div>
                    <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600"><Package size={24} /></div>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-slate-500 text-sm">완료됨</p>
                      <h3 className="text-3xl font-bold mt-1 text-emerald-600">{stats.completed}</h3>
                    </div>
                    <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600"><CheckCircle2 size={24} /></div>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-slate-500 text-sm">대기중</p>
                      <h3 className="text-3xl font-bold mt-1 text-gray-600">{stats.pending}</h3>
                    </div>
                    <div className="p-2 bg-gray-50 rounded-lg text-gray-600"><Clock size={24} /></div>
                  </div>
                </div>
              </div>

              {/* Department Breakdown */}
              <h3 className="text-lg font-bold text-slate-800 mt-8 mb-4">부서별 프로젝트 현황</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {Object.entries(DEPARTMENTS).map(([key, config]) => (
                  <div key={key} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center space-x-4">
                    <div className={`p-3 rounded-full ${config.color.replace('text-', 'bg-').replace('100', '50')}`}>
                      <config.icon className={`w-6 h-6 ${config.color.split(' ')[1]}`} />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">{config.label}</p>
                      <p className="text-2xl font-bold text-slate-800">
                        {stats.byDept[key as Department]} <span className="text-xs font-normal text-slate-400">건</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Projects View */}
          {activeTab === 'projects' && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              {/* Filters */}
              <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50">
                <div className="flex items-center space-x-2">
                  <Filter size={18} className="text-slate-400" />
                  <div className="flex space-x-1">
                    <button 
                      onClick={() => setFilterDept('all')}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${filterDept === 'all' ? 'bg-slate-800 text-white' : 'bg-white text-slate-600 border hover:bg-slate-100'}`}
                    >
                      전체
                    </button>
                    {Object.keys(DEPARTMENTS).map((dept) => (
                      <button 
                        key={dept}
                        onClick={() => setFilterDept(dept as Department)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${filterDept === dept ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 border hover:bg-slate-100'}`}
                      >
                        {DEPARTMENTS[dept as Department].label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input 
                    type="text" 
                    placeholder="프로젝트, 고객사 검색..." 
                    className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none w-full md:w-64"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
                    <tr>
                      <th className="px-6 py-4">프로젝트명</th>
                      <th className="px-6 py-4">부서</th>
                      <th className="px-6 py-4">담당자</th>
                      <th className="px-6 py-4">기간 (시작 ~ 마감)</th>
                      <th className="px-6 py-4">상태</th>
                      <th className="px-6 py-4 text-right">관리</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredProjects.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                          등록된 프로젝트가 없습니다.
                        </td>
                      </tr>
                    ) : (
                      filteredProjects.map((project) => (
                        <tr key={project.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4">
                            <p className="font-semibold text-slate-800">{project.title}</p>
                            <p className="text-xs text-slate-500">{project.client}</p>
                          </td>
                          <td className="px-6 py-4">
                            <DepartmentBadge dept={project.department} />
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600">
                            {project.assignedTo || '-'}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600 font-mono">
                            <div className="flex items-center space-x-1">
                                <CalendarDays size={14} className="text-slate-400" />
                                <span>{project.startDate || '?'} ~ {project.dueDate}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <select 
                              value={project.status}
                              onChange={(e) => handleStatusChange(project.id, e.target.value as Status)}
                              className="text-xs border-0 bg-transparent cursor-pointer font-medium focus:ring-0"
                            >
                              {Object.keys(STATUSES).map(s => (
                                <option key={s} value={s}>{STATUSES[s as Status].label}</option>
                              ))}
                            </select>
                            <div className="mt-1">
                               <StatusBadge status={project.status} />
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                             <button 
                                onClick={() => handleDeleteProject(project.id)}
                                className="p-2 text-slate-400 hover:text-red-600 transition-colors rounded-full hover:bg-red-50"
                                title="삭제"
                              >
                                <Trash2 size={16} />
                              </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Admin View */}
          {activeTab === 'admin' && (
            <div className="space-y-6">
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-yellow-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700">
                      관리자 모드입니다. 팀원의 역할을 변경하여 시스템 접근 권한을 제어할 수 있습니다.
                    </p>
                  </div>
                </div>
              </div>

              {/* Data Management Section */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center space-x-2">
                  <FileJson className="text-slate-500" size={20} />
                  <h3 className="font-bold text-slate-800">데이터 백업 및 복원</h3>
                </div>
                <div className="p-6">
                  <p className="text-sm text-slate-600 mb-4">
                    현재 미리보기(Preview) 환경에서는 URL 공유가 제한될 수 있습니다. 
                    팀원에게 데이터를 공유하려면 <span className="font-bold">백업 파일(.json)</span>을 다운로드하여 전달하세요.
                  </p>
                  <div className="flex flex-col md:flex-row gap-4">
                    <button 
                      onClick={handleExportData}
                      className="flex-1 flex items-center justify-center space-x-2 bg-blue-50 text-blue-700 py-3 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors font-medium"
                    >
                      <Download size={18} />
                      <span>데이터 백업 (내보내기)</span>
                    </button>
                    
                    <div className="flex-1 relative">
                       <input 
                          type="file" 
                          ref={fileInputRef}
                          accept=".json"
                          onChange={handleImportData}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                       />
                       <button className="w-full flex items-center justify-center space-x-2 bg-slate-100 text-slate-700 py-3 rounded-lg border border-slate-200 hover:bg-slate-200 transition-colors font-medium pointer-events-none">
                          <Upload size={18} />
                          <span>데이터 복원 (불러오기)</span>
                       </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
                  <h3 className="font-bold text-slate-800">팀원 목록</h3>
                </div>
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
                    <tr>
                      <th className="px-6 py-4">이름</th>
                      <th className="px-6 py-4">이메일 (가상)</th>
                      <th className="px-6 py-4">현재 역할</th>
                      <th className="px-6 py-4 text-right">역할 변경</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {teamMembers.map((member) => (
                      <tr key={member.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 font-medium text-slate-800">
                          {member.name} {member.id === userProfile.id && <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded ml-2">나</span>}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500">{member.email}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${member.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-700'}`}>
                            {member.role === 'admin' ? <Shield className="w-3 h-3 mr-1"/> : <User className="w-3 h-3 mr-1"/>}
                            {member.role === 'admin' ? '관리자' : '일반 직원'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {member.id !== userProfile.id && (
                            <div className="flex justify-end space-x-2">
                              <button 
                                onClick={() => handleUpdateRole(member.id, 'staff')}
                                disabled={member.role === 'staff'}
                                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${member.role === 'staff' ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-white border hover:bg-slate-50 text-slate-700'}`}
                              >
                                직원으로
                              </button>
                              <button 
                                onClick={() => handleUpdateRole(member.id, 'admin')}
                                disabled={member.role === 'admin'}
                                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${member.role === 'admin' ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-white border border-purple-200 text-purple-700 hover:bg-purple-50'}`}
                              >
                                관리자로
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Share Modal */}
      {isShareModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100">
            <div className="bg-slate-900 px-6 py-4 flex justify-between items-center">
              <h3 className="font-bold text-lg text-white flex items-center gap-2">
                <Share2 size={20} />
                팀원 초대하기
              </h3>
              <button onClick={() => setIsShareModalOpen(false)} className="text-slate-400 hover:text-white">
                <X size={24} />
              </button>
            </div>
            <div className="p-6">
              <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-6">
                <div className="flex">
                  <AlertTriangle className="h-5 w-5 text-amber-400 flex-shrink-0" />
                  <div className="ml-3">
                    <p className="text-sm text-amber-700 font-bold">
                      미리보기(Preview) 환경 주의사항
                    </p>
                    <p className="text-xs text-amber-600 mt-1 leading-relaxed">
                      현재 접속하신 URL은 보안상 외부 접속이 차단된 <strong>개발자 전용 주소</strong>일 수 있습니다. 팀원이 접속하지 못한다면 <strong>관리자 탭 &gt; 데이터 백업</strong> 기능을 이용하여 데이터를 파일로 전달해주세요.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-100 p-4 rounded-lg flex items-center justify-between mb-6 border border-slate-200">
                <code className="text-xs text-slate-600 truncate flex-1 mr-3 font-mono">
                  {window.location.href}
                </code>
                <button 
                  onClick={() => {
                     try {
                        const el = document.createElement('textarea');
                        el.value = window.location.href;
                        document.body.appendChild(el);
                        el.select();
                        document.execCommand('copy');
                        document.body.removeChild(el);
                        alert("주소가 복사되었습니다! (접속 불가 시 백업 기능 사용 권장)");
                     } catch(e) {
                        prompt("아래 주소를 복사하세요:", window.location.href);
                     }
                  }}
                  className="p-2 bg-white text-slate-700 rounded-md shadow-sm hover:bg-slate-50 border border-slate-300"
                  title="주소 복사"
                >
                  <Copy size={16} />
                </button>
              </div>

              <button 
                onClick={() => setIsShareModalOpen(false)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Help Modal */}
      {isHelpModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
             <div className="bg-emerald-600 px-6 py-4 flex justify-between items-center">
              <h3 className="font-bold text-lg text-white flex items-center gap-2">
                <HelpCircle size={20} />
                사용 가이드: 외부 공유 방법
              </h3>
              <button onClick={() => setIsHelpModalOpen(false)} className="text-emerald-100 hover:text-white">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-6">
               <div className="space-y-4">
                  <div className="flex gap-4">
                     <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold shrink-0">1</div>
                     <div>
                        <h4 className="font-bold text-slate-800">임시 공유 (현재 상태)</h4>
                        <p className="text-sm text-slate-600 mt-1">
                           현재는 <strong>'데이터 백업/복원'</strong> 방식이 가장 안전합니다.
                           <br/>관리자 메뉴에서 <code>.json</code> 파일을 다운받아 팀원에게 전달하면, 팀원이 해당 파일을 업로드하여 똑같은 화면을 볼 수 있습니다.
                        </p>
                     </div>
                  </div>
                  <div className="flex gap-4">
                     <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold shrink-0">2</div>
                     <div>
                        <h4 className="font-bold text-slate-800">영구 공유 (웹사이트 만들기)</h4>
                        <p className="text-sm text-slate-600 mt-1">
                           <code>www.my-crm.com</code> 처럼 진짜 웹사이트로 만들려면 <strong>'배포(Deployment)'</strong>가 필요합니다.
                           <br/>무료 호스팅 서비스인 <strong>Vercel</strong> 등을 이용하면 5분 안에 실제 링크를 만들 수 있습니다. 자세한 방법은 함께 제공된 가이드 문서를 참고하세요.
                        </p>
                     </div>
                  </div>
               </div>
               <div className="bg-slate-50 p-4 rounded-lg text-center">
                  <p className="text-xs text-slate-500">
                     이 앱은 React와 Firebase로 제작되었습니다.
                  </p>
               </div>
               <button 
                onClick={() => setIsHelpModalOpen(false)}
                className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 rounded-lg transition-colors"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Project Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-lg text-slate-800">새 프로젝트 추가</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <Plus className="transform rotate-45" size={24} />
              </button>
            </div>
            <form onSubmit={handleAddProject} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">프로젝트명</label>
                <input 
                  type="text" 
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={newProject.title}
                  onChange={e => setNewProject({...newProject, title: e.target.value})}
                  placeholder="예: 2024년 1분기 마케팅 기획"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">고객사</label>
                <input 
                  type="text" 
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={newProject.client}
                  onChange={e => setNewProject({...newProject, client: e.target.value})}
                  placeholder="예: (주)컴플리트"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">업무 구분</label>
                  <select 
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    value={newProject.department}
                    onChange={e => setNewProject({...newProject, department: e.target.value as Department})}
                  >
                    {Object.entries(DEPARTMENTS).map(([key, config]) => (
                      <option key={key} value={key}>{config.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                   {/* Empty for spacing or another field */}
                </div>
              </div>

              {/* Date Range Input */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">시작일</label>
                  <input 
                    type="date" 
                    required
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={newProject.startDate}
                    onChange={e => setNewProject({...newProject, startDate: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">마감일</label>
                  <input 
                    type="date" 
                    required
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={newProject.dueDate}
                    onChange={e => setNewProject({...newProject, dueDate: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">담당자</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={newProject.assignedTo}
                  onChange={e => setNewProject({...newProject, assignedTo: e.target.value})}
                  placeholder="담당자 이름"
                />
              </div>
              <div className="pt-4 flex justify-end space-x-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  취소
                </button>
                <button 
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 shadow-md transition-all"
                >
                  프로젝트 등록
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}