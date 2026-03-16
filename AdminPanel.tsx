import React, { useState, useEffect } from 'react';
import { 
  Users, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Settings, 
  ChevronLeft, 
  Check, 
  X, 
  Search,
  Filter,
  MoreVertical,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../firebase';
import { collection, query, onSnapshot, doc, updateDoc, getDoc, orderBy } from 'firebase/firestore';

interface AdminPanelProps {
  onClose: () => void;
}

export default function AdminPanel({ onClose }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'users' | 'deposits' | 'withdrawals' | 'settings'>('users');
  const [users, setUsers] = useState<any[]>([]);
  const [deposits, setDeposits] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      setUsers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    const unsubDeposits = onSnapshot(query(collection(db, 'deposits'), orderBy('createdAt', 'desc')), (snap) => {
      setDeposits(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubWithdrawals = onSnapshot(query(collection(db, 'withdrawals'), orderBy('createdAt', 'desc')), (snap) => {
      setWithdrawals(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubUsers();
      unsubDeposits();
      unsubWithdrawals();
    };
  }, []);

  const handleUpdateStatus = async (collectionName: string, id: string, status: string, uid?: string, amount?: number) => {
    try {
      const ref = doc(db, collectionName, id);
      await updateDoc(ref, { status });

      // If deposit is completed, update user balance
      if (collectionName === 'deposits' && status === 'completed' && uid && amount) {
        const userRef = doc(db, 'users', uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const currentBalance = userSnap.data().balance || 0;
          await updateDoc(userRef, { balance: currentBalance + amount });
        }
      }
      
      // If withdrawal is rejected, refund user balance
      if (collectionName === 'withdrawals' && status === 'rejected' && uid && amount) {
        const userRef = doc(db, 'users', uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const currentBalance = userSnap.data().balance || 0;
          await updateDoc(userRef, { balance: currentBalance + amount });
        }
      }
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const filteredUsers = users.filter(u => u.email?.toLowerCase().includes(searchTerm.toLowerCase()) || u.uid?.includes(searchTerm));

  return (
    <div className="fixed inset-0 bg-[#050A18] z-[100] flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-white/10 flex items-center justify-between bg-[#0D1425]">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl transition-colors">
            <ChevronLeft size={24} />
          </button>
          <div>
            <h1 className="text-xl font-bold">Admin Dashboard</h1>
            <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">Management Console</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
          <ShieldCheck size={14} className="text-emerald-400" />
          <span className="text-[10px] font-bold text-emerald-400">SECURE ACCESS</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex p-2 bg-[#0D1425] border-b border-white/10">
        {[
          { id: 'users', label: 'Users', icon: Users },
          { id: 'deposits', label: 'Deposits', icon: ArrowDownLeft },
          { id: 'withdrawals', label: 'Withdrawals', icon: ArrowUpRight },
          { id: 'settings', label: 'Settings', icon: Settings },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all ${
              activeTab === tab.id 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <tab.icon size={18} />
            <span className="text-xs font-bold">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Search Bar */}
      {activeTab !== 'settings' && (
        <div className="p-4 bg-[#050A18]">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input 
              type="text" 
              placeholder="Search by email or UID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 outline-none focus:border-blue-500 transition-colors text-sm"
            />
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <AnimatePresence mode="wait">
          {activeTab === 'users' && (
            <motion.div
              key="users"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {filteredUsers.map((user) => (
                <div key={user.id} className="bg-white/5 border border-white/10 rounded-2xl p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-bold">
                        {user.email?.[0].toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-bold text-sm">{user.email}</h3>
                        <p className="text-[10px] text-gray-500 font-mono">{user.uid}</p>
                      </div>
                    </div>
                    <div className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${
                      user.role === 'admin' ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400'
                    }`}>
                      {user.role}
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-white/5">
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase font-bold">Balance</p>
                      <p className="text-lg font-bold text-emerald-400">{user.balance?.toFixed(2)} USDT</p>
                    </div>
                    <div className="flex gap-2">
                      <button className="p-2 bg-white/5 rounded-lg text-gray-400 hover:text-white transition-colors">
                        <MoreVertical size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {activeTab === 'deposits' && (
            <motion.div
              key="deposits"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {deposits.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 opacity-30">
                  <AlertCircle size={48} className="mb-4" />
                  <p className="font-bold">No deposit requests</p>
                </div>
              ) : (
                deposits.map((dep) => (
                  <div key={dep.id} className="bg-white/5 border border-white/10 rounded-2xl p-4">
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <p className="text-[10px] text-gray-500 uppercase font-bold">Amount</p>
                        <p className="text-xl font-bold text-emerald-400">{dep.amount} USDT</p>
                      </div>
                      <div className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${
                        dep.status === 'pending' ? 'bg-amber-500/20 text-amber-400' :
                        dep.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' :
                        'bg-rose-500/20 text-rose-400'
                      }`}>
                        {dep.status}
                      </div>
                    </div>
                    <div className="space-y-1 mb-4">
                      <p className="text-[10px] text-gray-500">UID: {dep.uid}</p>
                      <p className="text-[10px] text-gray-500">Network: {dep.network}</p>
                    </div>
                    {dep.status === 'pending' && (
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleUpdateStatus('deposits', dep.id, 'completed', dep.uid, dep.amount)}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-500 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                        >
                          <Check size={14} /> Approve
                        </button>
                        <button 
                          onClick={() => handleUpdateStatus('deposits', dep.id, 'rejected')}
                          className="flex-1 bg-rose-600 hover:bg-rose-500 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                        >
                          <X size={14} /> Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </motion.div>
          )}

          {activeTab === 'withdrawals' && (
            <motion.div
              key="withdrawals"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {withdrawals.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 opacity-30">
                  <AlertCircle size={48} className="mb-4" />
                  <p className="font-bold">No withdrawal requests</p>
                </div>
              ) : (
                withdrawals.map((wit) => (
                  <div key={wit.id} className="bg-white/5 border border-white/10 rounded-2xl p-4">
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <p className="text-[10px] text-gray-500 uppercase font-bold">Amount</p>
                        <p className="text-xl font-bold text-rose-400">{wit.amount} USDT</p>
                      </div>
                      <div className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${
                        wit.status === 'pending' ? 'bg-amber-500/20 text-amber-400' :
                        wit.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' :
                        'bg-rose-500/20 text-rose-400'
                      }`}>
                        {wit.status}
                      </div>
                    </div>
                    <div className="space-y-1 mb-4">
                      <p className="text-[10px] text-gray-500">UID: {wit.uid}</p>
                      <p className="text-[10px] text-gray-500">Network: {wit.network}</p>
                      <p className="text-[10px] text-gray-500 break-all">Address: {wit.address}</p>
                    </div>
                    {wit.status === 'pending' && (
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleUpdateStatus('withdrawals', wit.id, 'completed')}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-500 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                        >
                          <Check size={14} /> Approve
                        </button>
                        <button 
                          onClick={() => handleUpdateStatus('withdrawals', wit.id, 'rejected', wit.uid, wit.amount)}
                          className="flex-1 bg-rose-600 hover:bg-rose-500 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                        >
                          <X size={14} /> Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h3 className="font-bold mb-4">Platform Settings</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] text-gray-500 uppercase font-bold mb-2 block">Maintenance Mode</label>
                    <button className="w-full py-3 bg-white/5 border border-white/10 rounded-xl text-sm font-bold text-gray-400">
                      Disabled
                    </button>
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 uppercase font-bold mb-2 block">Minimum Withdrawal</label>
                    <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex justify-between items-center">
                      <span className="text-sm font-bold">10 USDT</span>
                      <button className="text-blue-400 text-xs font-bold">Edit</button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-6">
                <h3 className="font-bold text-rose-400 mb-2">Danger Zone</h3>
                <p className="text-xs text-gray-500 mb-4">Actions here are irreversible and affect all users.</p>
                <button className="w-full py-3 bg-rose-600 hover:bg-rose-500 rounded-xl text-sm font-bold transition-colors">
                  Clear All Transaction History
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
