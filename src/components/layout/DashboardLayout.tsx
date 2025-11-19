import React, { ReactNode, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
    LayoutDashboard, Users, CheckSquare, Calendar, LogOut, User,
    Moon, Sun, Clock, Settings, Menu, X, ListChecks, FileText, Briefcase
} from "lucide-react";
// Giả định các hàm này trả về các kiểu đã định nghĩa
import { getCurrentUser, getUserProfile, signOut, UserRole, getUserRole } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import NotificationBell from "@/components/notifications/NotificationBell";

// --- Định nghĩa kiểu dữ liệu ---

interface CurrentUser { id: string; email?: string | null; }
interface UserProfile { first_name: string; last_name: string; avatar_url: string | null; }

// --- Cấu trúc Menu Điều hướng ---
interface NavItem {
    icon: React.ElementType;
    label: string;
    path: string;
}

interface DashboardLayoutProps {
    children: ReactNode;
    role?: UserRole;
}

const DashboardLayout = ({ children, role = 'staff' }: DashboardLayoutProps) => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [user, setUser] = useState<CurrentUser | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [userRole, setUserRole] = useState<UserRole>(role);
    const [isDark, setIsDark] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // --- LOGIC MENU ITEMS ---
    const baseMenuItems: NavItem[] = [
        { icon: LayoutDashboard, label: "Bảng điều khiển", path: "/dashboard" },
        { icon: Clock, label: "Chấm công", path: "/attendance" }, // Chấm công
        { icon: FileText, label: "Nghỉ phép", path: "/leave" }, // Nghỉ phép (Tách riêng)
        { icon: ListChecks, label: "Công việc", path: "/tasks" },
        { icon: Calendar, label: "Phòng họp", path: "/meeting-rooms" },
    ];

    const menuItems = [...baseMenuItems];
    if (userRole === 'admin') {
        menuItems.push({ icon: Settings, label: "Quản lý Tổ chức", path: "/organization" });
    }


    useEffect(() => {
        const loadUser = async () => {
            const currentUser = await getCurrentUser();
            if (!currentUser) {
                navigate("/auth/login");
                return;
            }
            
            setUser(currentUser); 
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
            toast({
                variant: "destructive",
                title: "Đăng xuất Thất bại",
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

    // Logic kiểm tra trạng thái active
    // Dùng startsWith để highlight cả /attendance/new hay /leave/new
    const isActive = (path: string) => window.location.pathname.startsWith(path);
    
    const getInitials = () => {
        if (profile?.first_name && profile?.last_name) {
            return `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase();
        }
        return user?.email?.[0]?.toUpperCase() || "U";
    };
    
    const getFullName = () => {
        return profile?.first_name && profile?.last_name ? `${profile.last_name} ${profile.first_name}` : 'Người dùng';
    };

    const getRoleDisplayName = (r: UserRole) => {
        if (r === 'admin') return 'Quản trị';
        if (r === 'leader') return 'Trưởng nhóm';
        return 'Nhân viên';
    };


    return (
        <div className="min-h-screen bg-background">
            {/* Top Navigation */}
            <header className="sticky top-0 z-50 w-full border-b bg-card shadow-md">
                <div className="flex h-16 items-center px-4 md:px-6">
                    {/* Logo and App Name */}
                    <div 
                        className="flex items-center gap-3 cursor-pointer"
                        onClick={() => navigate("/dashboard")}
                    >
                        <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center overflow-hidden p-1 shadow-sm">
                            <img 
                                src="/LOGO.PNG" 
                                alt="HRM CRM Logo"
                                className="w-full h-full object-contain"
                            />
                        </div>
                        <div>
                            <h1 className="text-xl font-extrabold tracking-tight">HRM CRM</h1>
                            <p className="text-xs text-muted-foreground">{getRoleDisplayName(userRole)} Dashboard</p>
                        </div>
                    </div>

                    <div className="ml-auto flex items-center gap-4">
                        <NotificationBell />
                        <Button variant="ghost" size="icon" onClick={toggleTheme} className="hidden sm:inline-flex">
                            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                        </Button>

                        {/* User Dropdown */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                                    <Avatar>
                                        <AvatarImage src={profile?.avatar_url || undefined} />
                                        <AvatarFallback className="bg-primary text-white">
                                            {getInitials()}
                                        </AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuLabel>
                                    <div className="flex flex-col space-y-1">
                                        <p className="text-sm font-medium">{getFullName()}</p>
                                        <p className="text-xs text-muted-foreground">{user?.email}</p>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => navigate("/profile")}>
                                    <User className="mr-2 h-4 w-4" />
                                    Hồ sơ Cá nhân
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => navigate("/settings")}>
                                    <Settings className="mr-2 h-4 w-4" />
                                    Cài đặt
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                                    <LogOut className="mr-2 h-4 w-4" />
                                    Đăng xuất
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </header>

            <div className="flex">
                {/* Sidebar (Desktop) */}
                <aside className="hidden md:flex w-64 flex-col fixed h-[calc(100vh-4rem)] border-r bg-card shadow-inner">
                    <nav className="flex-1 space-y-1 p-4 pt-6">
                        {menuItems.map((item) => {
                            const active = isActive(item.path);
                            return (
                                <Button
                                    key={item.path}
                                    variant={active ? "secondary" : "ghost"}
                                    className="w-full justify-start font-medium text-base"
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
                <main className="flex-1 md:ml-64 p-4 md:p-6 pb-20">
                    {children}
                </main>
            </div>

            {/* Mobile Bottom Navigation (Chỉ hiển thị 5 mục đầu tiên) */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t z-50 shadow-2xl">
                <div className="grid grid-cols-5 gap-1 p-1">
                    {menuItems.slice(0, 5).map((item) => {
                        const active = isActive(item.path);
                        return (
                            <Button
                                key={item.path}
                                variant={active ? "secondary" : "ghost"}
                                size="sm"
                                className="flex flex-col h-auto py-2 px-1 text-center"
                                onClick={() => navigate(item.path)}
                            >
                                <item.icon className="h-5 w-5 mb-1 mx-auto" />
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
