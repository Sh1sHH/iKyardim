import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getAuth, fetchSignInMethodsForEmail } from 'firebase/auth';
import { toast } from 'sonner';
import {
  Users, FileText, Settings, BarChart3, Calculator, 
  FileBox, MessageSquare, CreditCard, PieChart, Brain,
  LogOut, Home
} from 'lucide-react';
import BlogManagement from '@/components/admin/BlogManagement';

interface UserRole {
  email: string;
  role: 'admin' | 'editor' | 'user';
}

interface MenuItem {
  id: string;
  title: string;
  icon: React.ReactNode;
}

const AdminPanel = () => {
  const { currentUser, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [newUserEmail, setNewUserEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<UserRole[]>([]);
  const [activeSection, setActiveSection] = useState('users');

  // Sol menü öğeleri
  const menuItems: MenuItem[] = [
    { id: 'dashboard', title: 'Dashboard', icon: <BarChart3 className="w-5 h-5" /> },
    { id: 'users', title: 'Kullanıcı Yönetimi', icon: <Users className="w-5 h-5" /> },
    { id: 'blog', title: 'Blog Yönetimi', icon: <FileText className="w-5 h-5" /> },
    { id: 'calculator', title: 'Hesaplama Araçları', icon: <Calculator className="w-5 h-5" /> },
    { id: 'documents', title: 'Dosya Yönetimi', icon: <FileBox className="w-5 h-5" /> },
    { id: 'crm', title: 'Soru-Cevap', icon: <MessageSquare className="w-5 h-5" /> },
    { id: 'billing', title: 'Fatura/Abonelik', icon: <CreditCard className="w-5 h-5" /> },
    { id: 'feedback', title: 'Geri Bildirim', icon: <PieChart className="w-5 h-5" /> },
    { id: 'ai', title: 'AI Tavsiyeler', icon: <Brain className="w-5 h-5" /> },
    { id: 'settings', title: 'Ayarlar', icon: <Settings className="w-5 h-5" /> }
  ];

  // Kullanıcı ve admin kontrolü
  useEffect(() => {
    if (!currentUser) {
      navigate('/');
      toast.error('Giriş yapmanız gerekiyor');
      return;
    }

    if (!isAdmin) {
      navigate('/');
      toast.error('Bu sayfaya erişim yetkiniz yok');
      return;
    }

    // Admin listesini getir
    const fetchAdmins = async () => {
      try {
        if (!currentUser) {
          throw new Error('Giriş yapmanız gerekiyor');
        }

        const token = await currentUser.getIdToken();
        const response = await fetch('https://us-central1-minik-a61c5.cloudfunctions.net/listAdmins', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Admin listesi alınamadı');
        }

        const data = await response.json();
        setUsers(data as UserRole[]);
      } catch (error: any) {
        console.error('Admin listesi alınamadı:', error);
        toast.error(error.message || 'Admin listesi alınamadı');
        if (error.message.includes('yetki') || error.message.includes('token')) {
          navigate('/');
        }
      }
    };

    fetchAdmins();
  }, [currentUser, isAdmin, navigate]);

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!currentUser) {
        throw new Error('Giriş yapmanız gerekiyor');
      }

      // Email kontrolü
      if (!newUserEmail) {
        toast.error('Email adresi giriniz');
        return;
      }

      // Admin yetkisi verme isteği
      const token = await currentUser.getIdToken();
      const response = await fetch('https://us-central1-minik-a61c5.cloudfunctions.net/setAdminRole', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: newUserEmail })
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || 'Admin yetkisi verilemedi');
      }

      toast.success(responseData.message || `${newUserEmail} adresine admin yetkisi verildi`);
      setNewUserEmail('');
      
      // Admin listesini güncelle
      const adminsResponse = await fetch('https://us-central1-minik-a61c5.cloudfunctions.net/listAdmins', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!adminsResponse.ok) {
        const errorData = await adminsResponse.json();
        throw new Error(errorData.message || 'Admin listesi alınamadı');
      }

      const adminsData = await adminsResponse.json();
      // Tekrar eden adminleri filtrele
      const uniqueAdmins = adminsData.filter((admin: UserRole, index: number, self: UserRole[]) =>
        index === self.findIndex((t) => t.email === admin.email)
      );
      setUsers(uniqueAdmins);
      
    } catch (error: any) {
      console.error('Admin ekleme hatası:', error);
      toast.error(error.message || 'Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      const auth = getAuth();
      await auth.signOut();
      navigate('/');
    } catch (error) {
      console.error('Çıkış hatası:', error);
    }
  };

  // Kullanıcı girişi yoksa veya admin değilse içeriği gösterme
  if (!currentUser || !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white">
      <div className="flex h-screen">
        {/* Sol Menü */}
        <div className="w-64 bg-black/50 backdrop-blur-sm border-r border-white/5 p-4 flex flex-col">
          <div className="flex items-center gap-2 mb-8">
          {/*<img src="/logo.svg" alt="minİK" className="w-8 h-8" />*/}
            <h1 className="text-xl font-semibold">Admin Panel</h1>
          </div>

          {/* Ana Sayfaya Dönüş */}
          <Link 
            to="/"
            className="flex items-center gap-2 px-4 py-3 text-gray-300 hover:bg-white/5 rounded-lg transition-colors mb-4"
          >
            <Home className="w-5 h-5" />
            <span>Ana Sayfaya Dön</span>
          </Link>

          <nav className="space-y-1 flex-1">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
                  activeSection === item.id 
                    ? 'bg-purple-600 text-white' 
                    : 'hover:bg-white/5 text-gray-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  {item.icon}
                  <span>{item.title}</span>
                </div>
              </button>
            ))}
          </nav>

          <div className="mt-auto pt-4 border-t border-white/5">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-4 py-2 text-red-500 hover:bg-white/5 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Çıkış Yap</span>
            </button>
          </div>
        </div>

        {/* Ana İçerik */}
        <div className="flex-1 overflow-auto">
          <div className="p-8">
            {activeSection === 'users' && (
              <div>
                <h2 className="text-2xl font-semibold mb-6">Kullanıcı Yönetimi</h2>
                <div className="bg-black/50 rounded-xl p-6 backdrop-blur-sm border border-white/5">
                  <form onSubmit={handleAddAdmin} className="mb-6">
                    <div className="flex gap-4">
                      <input
                        type="email"
                        value={newUserEmail}
                        onChange={(e) => setNewUserEmail(e.target.value)}
                        placeholder="Email adresi"
                        className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder:text-gray-400 focus:outline-none focus:border-purple-500 transition-colors"
                        required
                      />
                      <button
                        type="submit"
                        disabled={loading}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? 'İşleniyor...' : 'Admin Yap'}
                      </button>
                    </div>
                  </form>

                  <div>
                    <h3 className="text-lg font-medium text-gray-300 mb-4">Mevcut Adminler</h3>
                    <div className="bg-black/30 rounded-lg">
                      {users
                        .filter((user, index, self) => 
                          index === self.findIndex((t) => t.email === user.email)
                        )
                        .map((user, index) => (
                          <div key={index} className="flex items-center justify-between py-3 px-4 border-b border-white/5">
                            <span>{user.email}</span>
                            <span className="text-purple-400">{user.role}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'blog' && (
              <div>
                <BlogManagement />
              </div>
            )}

            {activeSection !== 'users' && activeSection !== 'blog' && (
              <div className="bg-black/50 rounded-xl p-6 backdrop-blur-sm border border-white/5">
                <h2 className="text-xl font-semibold mb-4">{activeSection} Yakında</h2>
                <p className="text-gray-400">Bu bölüm yakında eklenecek...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel; 