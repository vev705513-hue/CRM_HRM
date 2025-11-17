import { ReactNode, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  LayoutDashboard, 
  Users, 
  CheckSquare, 
  Calendar, 
  Building2, 
  FileText, 
  LogOut, 
  User,
  Grape, // Giữ lại Grape trong imports nhưng không sử dụng ở logo
  Moon,
  Sun,
  Clock,
  Settings,
  Menu
} from "lucide-react";
// Giả định các hàm này trả về các kiểu đã định nghĩa
import { getCurrentUser, getUserProfile, signOut, UserRole, getUserRole } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import NotificationBell from "@/components/notifications/NotificationBell";

// --- Định nghĩa kiểu dữ liệu để thay thế 'any' ---

// Kiểu cho đối tượng User (từ getCurrentUser)
interface CurrentUser {
  id: string;
  // FIX: Thêm dấu '?' để làm cho 'email' là optional.
  // Điều này giải quyết lỗi: 'email' is optional in type 'User' but required in type 'CurrentUser'.
  email?: string | null; 
  // Thêm các thuộc tính khác nếu cần
}

// Kiểu cho đối tượng UserProfile (từ getUserProfile)
interface UserProfile {
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  // Thêm các thuộc tính hồ sơ khác
}

// --- Hết định nghĩa kiểu ---

interface DashboardLayoutProps {
  children: ReactNode;
  role?: UserRole;
}

const DashboardLayout = ({ children, role = 'staff' }: DashboardLayoutProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  // FIX 1: Sử dụng kiểu CurrentUser | null
  const [user, setUser] = useState<CurrentUser | null>(null);
  // FIX 2: Sử dụng kiểu UserProfile | null
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [userRole, setUserRole] = useState<UserRole>(role);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        navigate("/auth/login");
        return;
      }
      
      setUser(currentUser); // Dòng này giờ đã hợp lệ vì email? khớp với User
      // Giả sử getUserProfile trả về UserProfile | null
      const userProfile = await getUserProfile(currentUser.id);
      setProfile(userProfile);
      
      const fetchedRole = await getUserRole(currentUser.id);
      setUserRole(fetchedRole);
    };
    loadUser();
  }, [navigate]);

  const handleLogout = async () => {
    const { error } = await signOut();
    if (error) {
      // Vì error.message được sử dụng, ta có thể giả định error là một đối tượng lỗi
      toast({
        variant: "destructive",
        title: "Logout Failed",
        description: error.message
      });
      return;
    }
    navigate("/auth/login");
  };

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle("dark");
  };

  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
    { icon: Clock, label: "Attendance", path: "/attendance" },
    { icon: CheckSquare, label: "Tasks", path: "/tasks" },
    { icon: Calendar, label: "Meetings", path: "/meeting-rooms" },
    { icon: FileText, label: "Leave", path: "/leave" },
  ];

  if (userRole === 'admin') {
    menuItems.push({ icon: Settings, label: "Organization", path: "/organization" });
  }

  const isActive = (path: string) => window.location.pathname === path;

  const getInitials = () => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase();
    }
    // Sử dụng optional chaining và type guard
    return user?.email?.[0]?.toUpperCase() || "U";
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 w-full border-b bg-card shadow-soft">
        <div className="flex h-16 items-center px-4 md:px-6">
          {/* Sửa: Bọc logo trong một div có thể nhấp và điều hướng */}
          <div 
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => navigate("/dashboard")}
          >
            {/* THAY THẾ BIỂU TƯỢNG LUCIDE BẰNG THẺ IMG */}
            <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center overflow-hidden p-1">
              <img 
                src="/LOGO.PNG" // <-- Sử dụng đường dẫn logo tùy chỉnh
                alt="HRM CRM Logo"
                className="w-full h-full object-contain"
              />
            </div>
            {/* END THAY THẾ */}
            <div>
              <h1 className="text-xl font-heading font-bold">HRM CRM</h1>
              <p className="text-xs text-muted-foreground capitalize">{userRole} Dashboard</p>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-4">
            <NotificationBell />
            <Button variant="ghost" size="icon" onClick={toggleTheme}>
              {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar>
                    <AvatarImage src={profile?.avatar_url || undefined} />
                    <AvatarFallback className="gradient-primary text-white">
                      {getInitials()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">
                      {profile?.first_name} {profile?.last_name}
                    </p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/profile")}>
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden md:flex w-64 flex-col fixed h-[calc(100vh-4rem)] border-r bg-card">
          <nav className="flex-1 space-y-1 p-4">
            {menuItems.map((item) => {
              const active = isActive(item.path);
              return (
                <Button
                  key={item.path}
                  variant={active ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => navigate(item.path)}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.label}
                </Button>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 md:ml-64 p-6">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t z-50">
        <div className="grid grid-cols-5 gap-1 p-2">
          {menuItems.slice(0, 5).map((item) => {
            const active = isActive(item.path);
            return (
              <Button
                key={item.path}
                variant={active ? "secondary" : "ghost"}
                size="sm"
                className="flex flex-col h-auto py-2"
                onClick={() => navigate(item.path)}
              >
                <item.icon className="h-5 w-5 mb-1" />
                <span className="text-xs">{item.label}</span>
              </Button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default DashboardLayout;