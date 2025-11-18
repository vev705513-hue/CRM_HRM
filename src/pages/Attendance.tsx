import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import AttendanceWidget from "@/components/attendance/AttendanceWidget";
import { getUserRole, getCurrentUser } from "@/lib/auth";
import { UserRole } from "@/lib/auth";

// 1. Import đồng hồ
import VietnamClock from "@/components/VietnamClock";

const Attendance = () => {
  const [role, setRole] = useState<UserRole>('staff');

  useEffect(() => {
    const loadRole = async () => {
      const user = await getCurrentUser();
      if (!user) return;
      const userRole = await getUserRole(user.id);
      setRole(userRole);
    };
    loadRole();
  }, []);

  return (
    <DashboardLayout role={role}>
      <div className="space-y-6 animate-fade-in pb-20 md:pb-6">
        
        {/* Tiêu đề + đồng hồ */}
        <div className="mb-2 flex justify-between items-start">
          
          <div>
            <h2 className="text-4xl font-heading font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              Chấm Công
            </h2>
            <p className="text-muted-foreground mt-2">
              Theo dõi thời gian làm việc và trạng thái chấm công của bạn
            </p>
          </div>

          <VietnamClock />
        </div>

        <div className="shadow-strong rounded-lg">
          <AttendanceWidget />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Attendance;
