import { useState } from 'react';
import { 
  Bell, Shield, User, 
  Monitor, Languages, 
  CheckCircle2, Info
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

export default function Settings() {
  const [saved, setSaved] = useState(false);
  
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    approvals: true,
    reminders: false
  });

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const toggleNotif = (key) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="max-w-4xl space-y-8 pb-12"
    >
      <motion.div variants={itemVariants}>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">Account Settings</h1>
        <p className="text-slate-500 font-medium">Manage your profile, preferences, and security settings</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Navigation Sidebar (Local to page) */}
        <motion.div variants={itemVariants} className="space-y-1">
          {[
            { id: 'general', label: 'General', icon: Monitor },
            { id: 'profile', label: 'Profile', icon: User },
            { id: 'notifs', label: 'Notifications', icon: Bell },
            { id: 'security', label: 'Security', icon: Shield },
          ].map((item, i) => (
            <button 
              key={item.id}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300",
                i === 0 ? "bg-primary-50 text-primary-600 shadow-sm" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </button>
          ))}
        </motion.div>

        {/* Content Area */}
        <motion.div variants={itemVariants} className="md:col-span-2 space-y-6">
          {/* Notifications Section */}

          {/* Notifications Section */}
          <section className="card p-6 space-y-6 border-slate-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                <Bell className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Notifications</h3>
                <p className="text-sm text-slate-500 font-medium">Choose what updates you want to receive</p>
              </div>
            </div>

            <div className="space-y-3">
              {[
                { key: 'email', label: 'Email Notifications', desc: 'Summary of goal activities and approvals' },
                { key: 'push', label: 'Push Notifications', desc: 'Real-time alerts for system events' },
                { key: 'approvals', label: 'Approval Alerts', desc: 'Instant notice when your goals are approved' },
                { key: 'reminders', label: 'Cycle Reminders', desc: 'Deadline warnings for verification requests' },
              ].map((notif) => (
                <div key={notif.key} className="flex items-start gap-4 p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                  <button 
                    onClick={() => toggleNotif(notif.key)}
                    className={cn(
                      "mt-0.5 relative h-5 w-9 rounded-full transition-colors flex-shrink-0 focus:outline-none",
                      notifications[notif.key] ? "bg-primary-600 shadow-[0_0_10px_rgba(249,115,22,0.3)]" : "bg-slate-300"
                    )}
                  >
                    <div className={cn(
                      "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform",
                      notifications[notif.key] ? "translate-x-4" : "translate-x-0.5"
                    )} />
                  </button>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-800">{notif.label}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{notif.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Language & Region */}
          <section className="card p-6 space-y-4 border-slate-200">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                <Languages className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Language & Region</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">System Language</label>
                <select className="input text-sm">
                  <option>English (US)</option>
                  <option>English (UK)</option>
                  <option>Hindi</option>
                  <option>French</option>
                </select>
              </div>
              <div>
                <label className="label">Timezone</label>
                <select className="input text-sm">
                  <option>(GMT+05:30) India Standard Time</option>
                  <option>(GMT+00:00) UTC</option>
                  <option>(GMT-08:00) Pacific Time</option>
                </select>
              </div>
            </div>
          </section>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4">
            <div className="flex items-center gap-2 text-slate-500 text-xs font-medium bg-slate-100 px-3 py-1.5 rounded-full">
              <Info className="h-3 w-3" />
              Last updated: Today at 2:30 PM
            </div>
            <button 
              onClick={handleSave}
              className={cn(
                "btn-primary flex items-center gap-2 min-w-[140px] justify-center transition-all duration-300",
                saved && "bg-emerald-500 hover:bg-emerald-600 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
              )}
            >
              {saved ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Saved!
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
