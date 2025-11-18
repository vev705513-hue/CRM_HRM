import { useState, useEffect, useCallback } from "react"; // 👈 Thêm useCallback (Hàm nhớ)
import { supabase } from "@/integrations/supabase/client";
import { getCurrentUser, UserRole } from "@/lib/auth";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { SkeletonTable } from "@/components/ui/skeleton-table";
import { Tables } from "@/integrations/supabase/types";

// Định nghĩa kiểu dữ liệu cho Yêu cầu Nghỉ phép
type LeaveRequest = Tables<'leave_requests'>;

// Component hiển thị lịch sử yêu cầu nghỉ phép
const LeaveHistory = ({ role }: { role: UserRole }) => {
 // State lưu danh sách yêu cầu nghỉ phép
 const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
 // State trạng thái tải dữ liệu
 const [loading, setLoading] = useState(true);
 // Hook hiển thị thông báo
 const { toast } = useToast();

 // 👇 Dùng useCallback để ổn định hàm lấy dữ liệu (phục vụ cho useEffect và Realtime)
 const fetchLeaves = useCallback(async () => {
  try {
   const user = await getCurrentUser();
   if (!user) return;

   let query = supabase
    .from('leave_requests')
    .select('*')
    .order('created_at', { ascending: false });

   // Lọc theo vai trò: Nếu là nhân viên ('staff'), chỉ lấy yêu cầu của chính họ
   if (role === 'staff') {
    query = query.eq('user_id', user.id);
   }

   const { data, error } = await query;
   if (error) throw error;
   setLeaves((data as LeaveRequest[]) || []);
  } catch (error) {
   console.error('Lỗi khi lấy dữ liệu nghỉ phép:', error);
  } finally {
   setLoading(false);
  }
 }, [role]); // 👈 Dependency của hàm là 'role'

 useEffect(() => {
  fetchLeaves();

  // Thiết lập lắng nghe Realtime cho các thay đổi trong bảng 'leave_requests'
  const channel = supabase
   .channel('leaves-changes')
   .on('postgres_changes', { event: '*', schema: 'public', table: 'leave_requests' }, () => {
    // Khi có thay đổi, tải lại dữ liệu
    fetchLeaves();
   })
   .subscribe();

  // Hàm cleanup: Hủy đăng ký kênh khi component bị hủy
  return () => {
   supabase.removeChannel(channel);
  };
  // Dependency: 'fetchLeaves' đảm bảo hàm subscribe sử dụng phiên bản hàm mới nhất
 }, [fetchLeaves]); 

 // Xử lý phê duyệt yêu cầu nghỉ phép
 const handleApprove = async (leaveId: string) => {
  try {
   const user = await getCurrentUser();
   if (!user) return;

   const { error } = await supabase
    .from('leave_requests')
    .update({
     status: 'approved', // Cập nhật trạng thái
     approved_by: user.id,
     approved_at: new Date().toISOString()
    })
    .eq('id', leaveId); // Chỉ cập nhật yêu cầu có ID tương ứng

   if (error) throw error;

   toast({
    title: "Thành công",
    description: "Yêu cầu nghỉ phép đã được phê duyệt"
   });
  } catch (error) {
   console.error('Lỗi khi phê duyệt:', error);
   toast({
    title: "Lỗi",
    description: "Không thể phê duyệt yêu cầu nghỉ phép",
    variant: "destructive"
   });
  }
 };

 // Xử lý từ chối yêu cầu nghỉ phép
 const handleReject = async (leaveId: string) => {
  try {
   const user = await getCurrentUser();
   if (!user) return;

   const { error } = await supabase
    .from('leave_requests')
    .update({
     status: 'rejected', // Cập nhật trạng thái
     approved_by: user.id,
     approved_at: new Date().toISOString()
    })
    .eq('id', leaveId);

   if (error) throw error;

   toast({
    title: "Thành công",
    description: "Yêu cầu nghỉ phép đã bị từ chối"
   });
  } catch (error) {
   console.error('Lỗi khi từ chối:', error);
   toast({
    title: "Lỗi",
    description: "Không thể từ chối yêu cầu nghỉ phép",
    variant: "destructive"
   });
  }
 };

 // Hiển thị Skeleton khi đang tải dữ liệu
 if (loading) {
  return <SkeletonTable rows={6} columns={role === 'leader' || role === 'admin' ? 7 : 5} />;
 }

 // Render bảng hiển thị lịch sử nghỉ phép
 return (
  <div className="border rounded-lg">
   <Table>
    <TableHeader>
     <TableRow>
      {(role === 'leader' || role === 'admin') && <TableHead>Nhân viên</TableHead>}
      <TableHead>Loại</TableHead>
      <TableHead>Ngày Bắt đầu</TableHead>
      <TableHead>Ngày Kết thúc</TableHead>
      <TableHead>Trạng thái</TableHead>
      <TableHead>Gửi</TableHead>
      {(role === 'leader' || role === 'admin') && <TableHead>Hành động</TableHead>}
     </TableRow>
    </TableHeader>
    <TableBody>
     {leaves.map((leave) => (
      <TableRow key={leave.id}>
       {(role === 'leader' || role === 'admin') && (
        <TableCell>
         User {leave.user_id?.substring(0, 8)}
        </TableCell>
       )}
       <TableCell className="capitalize">{leave.type.replace('_', ' ')}</TableCell>
       <TableCell>{format(new Date(leave.start_date), 'MMM dd, yyyy')}</TableCell>
       <TableCell>{format(new Date(leave.end_date), 'MMM dd, yyyy')}</TableCell>
       <TableCell>
        <Badge
         variant={
          leave.status === 'approved' ? 'default' :
          leave.status === 'rejected' ? 'destructive' : 'secondary'
         }
        >
         {leave.status}
        </Badge>
       </TableCell>
       <TableCell className="text-muted-foreground">
        {format(new Date(leave.created_at), 'MMM dd, yyyy')}
       </TableCell>
       {(role === 'leader' || role === 'admin') && (
        <TableCell>
         {leave.status === 'pending' && (
          <div className="flex gap-2">
           <Button
            size="sm"
            onClick={() => handleApprove(leave.id)}
           >
            Phê duyệt
           </Button>
           <Button
            size="sm"
            variant="destructive"
            onClick={() => handleReject(leave.id)}
           >
            Từ chối
           </Button>
          </div>
         )}
        </TableCell>
       )}
      </TableRow>
     ))}
    </TableBody>
   </Table>
  </div>
 );
};

export default LeaveHistory;