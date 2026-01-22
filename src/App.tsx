import React, { useState, useEffect, useMemo, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged, 
  User as FirebaseUser
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  onSnapshot, 
  doc, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp,
  setDoc,
  writeBatch
} from 'firebase/firestore';
import { 
  LayoutDashboard, 
  Briefcase, 
  Users, 
  LogOut, 
  Plus, 
  Search, 
  Filter, 
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
  HelpCircle 
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

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
// 미리보기용 __app_id 대신 고정된 문자열 사용
const appId = 'complete-crm-production';

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
  email: string;
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
            <label htmlFor="adminCheck" className="text-sm
