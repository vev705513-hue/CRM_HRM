import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  TrendingUp,
  Calendar,
  FileText
} from "lucide-react";
import { getUserRole, getCurrentUser } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { UserRole } from "@/lib/auth";
import { SkeletonStatCard } from "@/components/ui/skeleton-card";
import { userInfo } from "os";

const Dashboard = () => {
  const [role, setRole] = useState<UserRole>('staff');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    todayAttendance: false,
    leaveBalance: 12,
    upcomingMeetings: 0
  });

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const user = await getCurrentUser();
        if (!user) return;

        const userRole = await getUserRole(user.id);
        setRole(userRole);

        // Load stats theo quyền
        if (userRole === 'staff') {
          await loadStaffStats(user.id);
        } else if (userRole === 'leader') {
          await loadLeaderStats(user.id);
        } else if (userRole === 'admin') {
          await loadAdminStats();
        }
      } finally {
        setLoading(false);
      }
    };
    loadDashboard();
  }, []);

  const loadStaffStats = async (userId: string) => {
    // Load tasks
    const { data: tasks } = await supabase
      .from('tasks')
      .select('status')
      .eq('assignee_id', userId);

    const totalTasks = tasks?.length || 0;
    const completedTasks = tasks?.filter(t => t.status === 'done').length || 0;
    const pendingTasks = tasks?.filter(t => t.status !== 'done').length || 0;

    // Kiểm tra điểm danh hôm nay
    const today = new Date().toISOString().split('T')[0];
    const { data: attendance } = await supabase
      .from('attendance')
      .select('*')
      .eq('user_id', userId)
      .gte('timestamp', `${today}T00:00:00`)
      .eq('type', 'check_in')
      .limit(1);

    // Load số ngày phép
    const { data: profile } = await supabase
      .from('profiles')
      .select('annual_leave_balance')
      .eq('id', userId)
      .single();

    // Load cuộc họp sắp tới
    const { data: meetings } = await supabase
      .from('room_bookings')
      .select('*')
      .eq('user_id', userId)
      .gte('start_time', new Date().toISOString())
      .limit(5);

    setStats({
      totalTasks,
      completedTasks,
      pendingTasks,
      todayAttendance: (attendance?.length || 0) > 0,
      leaveBalance: profile?.annual_leave_balance || 12,
      upcomingMeetings: meetings?.length || 0
    });
  };

  const loadLeaderStats = async (userId: string) => {
    loadStaffStats(userId);
  };

  const loadAdminStats = async () => {
    // Load toàn công ty
    const { data: tasks } = await supabase
      .from('tasks')
      .select('status');

    const { data: profiles } = await supabase
      .from('profiles')
      .select('*');

    const totalTasks = tasks?.length || 0;
    const completedTasks = tasks?.filter(t => t.status === 'done').length || 0;

    setStats(prev => ({
      ...prev,
      totalTasks,
      completedTasks,
      pendingTasks: totalTasks - completedTasks
    }));
  };

  const taskCompletionRate = stats.totalTasks > 0 
    ? Math.round((stats.completedTasks / stats.totalTasks) * 100) 
    : 0;

  if (loading) {
    return (
      <DashboardLayout role={role}>
        <div className="space-y-6 animate-fade-in pb-20 md:pb-6">
          <div className="mb-2">
            <h2 className="text-4xl font-heading font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              Dashboard
            </h2>
            <p className="text-muted-foreground mt-2">Chào mừng quay Tên người dùng!</p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <SkeletonStatCard />
            <SkeletonStatCard />
            <SkeletonStatCard />
            <SkeletonStatCard />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role={role}>
      <div className="space-y-6 animate-fade-in pb-20 md:pb-6">
        <div className="mb-2">
          <h2 className="text-4xl font-heading font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
            Bảng Điều Khiển
          </h2>
          <p className="text-muted-foreground mt-2">Chào mừng quay trở lại! Đây là tổng quan của bạn</p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="shadow-medium transition-smooth hover:shadow-strong overflow-hidden relative">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-primary opacity-10 rounded-full -mr-8 -mt-8" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tổng Công Việc</CardTitle>
              <div className="p-2 bg-primary/10 rounded-lg">
                <FileText className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalTasks}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.pendingTasks} đang chờ
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-medium transition-smooth hover:shadow-strong overflow-hidden relative">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-success/20 to-success/5 rounded-full -mr-8 -mt-8" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Công việc đã hoàn Thành</CardTitle>
              <div className="p-2 bg-success/10 rounded-lg">
                <CheckCircle2 className="h-4 w-4 text-success" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.completedTasks}</div>
              <div className="mt-3 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Tiến độ</span>
                  <span className="font-semibold text-success">{taskCompletionRate}%</span>
                </div>
                <Progress value={taskCompletionRate} className="h-2" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-medium transition-smooth hover:shadow-strong overflow-hidden relative">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-warning/20 to-warning/5 rounded-full -mr-8 -mt-8" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Điểm Danh</CardTitle>
              <div className="p-2 bg-warning/10 rounded-lg">
                <Clock className="h-4 w-4 text-warning" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="mt-1">
                {stats.todayAttendance ? (
                  <Badge className="bg-success text-success-foreground">Đã điểm danh</Badge>
                ) : (
                  <Badge variant="outline" className="border-muted-foreground/50">Chưa điểm danh</Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-3">Trạng thái hôm nay</p>
            </CardContent>
          </Card>

          <Card className="shadow-medium transition-smooth hover:shadow-strong overflow-hidden relative bg-gradient-primary">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-primary-foreground">Ngày Phép</CardTitle>
              <div className="p-2 bg-white/20 rounded-lg">
                <Calendar className="h-4 w-4 text-primary-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary-foreground">{stats.leaveBalance}</div>
              <p className="text-xs text-primary-foreground/80 mt-1">ngày còn lại</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="shadow-strong">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Hành Động Nhanh
            </CardTitle>
            <CardDescription>Các thao tác bạn có thể cần dùng</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <button className="group p-6 rounded-lg border-2 border-border hover:border-primary transition-smooth text-left hover:shadow-medium bg-gradient-to-br from-card to-secondary/30">
                <div className="p-3 bg-primary/10 rounded-lg w-fit group-hover:bg-primary/20 transition-smooth">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
                <h4 className="font-semibold mt-4 mb-1">Điểm danh</h4>
                <p className="text-sm text-muted-foreground">Ghi nhận thời gian làm việc</p>
              </button>
              
              <button className="group p-6 rounded-lg border-2 border-border hover:border-primary transition-smooth text-left hover:shadow-medium bg-gradient-to-br from-card to-secondary/30">
                <div className="p-3 bg-primary/10 rounded-lg w-fit group-hover:bg-primary/20 transition-smooth">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <h4 className="font-semibold mt-4 mb-1">Tạo Công Việc</h4>
                <p className="text-sm text-muted-foreground">Thêm nhiệm vụ mới</p>
              </button>
              
              <button className="group p-6 rounded-lg border-2 border-border hover:border-primary transition-smooth text-left hover:shadow-medium bg-gradient-to-br from-card to-secondary/30">
                <div className="p-3 bg-primary/10 rounded-lg w-fit group-hover:bg-primary/20 transition-smooth">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <h4 className="font-semibold mt-4 mb-1">Đặt Phòng Họp</h4>
                <p className="text-sm text-muted-foreground">Đặt phòng họp nhanh</p>
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="shadow-strong">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-primary" />
              Hoạt Động Gần Đây
            </CardTitle>
            <CardDescription>Các cập nhật mới nhất</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 rounded-lg bg-secondary/50 border border-border">
                <div className="w-2 h-2 mt-2 rounded-full bg-primary animate-pulse-glow" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Hệ thống đã khởi tạo</p>
                  <p className="text-xs text-muted-foreground mt-1">Chào mừng đến HRM CRM</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
