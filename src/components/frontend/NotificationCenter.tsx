import React from 'react';
import { Bell, Zap, Info, Shield, CheckCircle2, X } from 'lucide-react';

interface Notification {
  id: string;
  type: 'REWARD' | 'SYSTEM' | 'ALERT';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ isOpen, onClose, notifications }) => {
  if (!isOpen) return null;

  return (
    <div className="absolute right-0 mt-2 w-80 glass-panel border border-white/10 shadow-2xl z-[100] animate-in slide-in-from-top-2 duration-200">
      <div className="p-4 border-b border-white/5 flex justify-between items-center bg-white/5">
        <div className="flex items-center gap-2">
          <Bell size={14} className="text-alphabag-yellow" />
          <h3 className="text-[10px] font-black text-white uppercase tracking-widest">Intelligence Center</h3>
        </div>
        <button onClick={onClose} className="text-alphabag-muted hover:text-white transition-colors">
          <X size={16} />
        </button>
      </div>

      <div className="max-h-96 overflow-y-auto custom-scrollbar p-2 space-y-2">
        {notifications.length > 0 ? (
          notifications.map((notif) => (
            <div 
              key={notif.id} 
              className={`p-3 rounded-xl border transition-all ${notif.read ? 'bg-white/[0.02] border-white/5' : 'bg-alphabag-yellow/[0.03] border-alphabag-yellow/20'}`}
            >
              <div className="flex gap-3">
                <div className={`p-2 rounded-lg shrink-0 ${
                  notif.type === 'REWARD' ? 'bg-alphabag-green/10 text-alphabag-green' : 
                  notif.type === 'SYSTEM' ? 'bg-blue-500/10 text-blue-400' : 'bg-alphabag-red/10 text-alphabag-red'
                }`}>
                  {notif.type === 'REWARD' ? <Zap size={14} fill="currentColor" /> : 
                   notif.type === 'SYSTEM' ? <Info size={14} /> : <Shield size={14} />}
                </div>
                <div className="space-y-1">
                  <div className="text-[10px] font-black text-white uppercase tracking-tight">{notif.title}</div>
                  <p className="text-[10px] text-alphabag-subtext leading-relaxed">{notif.message}</p>
                  <div className="text-[8px] text-alphabag-muted font-bold uppercase tracking-widest">{new Date(notif.timestamp).toLocaleTimeString()}</div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="py-12 text-center space-y-2">
            <Bell size={24} className="mx-auto text-alphabag-muted opacity-20" />
            <p className="text-[10px] text-alphabag-muted font-bold uppercase tracking-widest">No New Intel</p>
          </div>
        )}
      </div>

      <div className="p-3 border-t border-white/5 bg-black/40 text-center">
        <button className="text-[9px] font-black text-alphabag-yellow uppercase tracking-[0.2em] hover:text-white transition-colors">
          Mark all as read
        </button>
      </div>
    </div>
  );
};
