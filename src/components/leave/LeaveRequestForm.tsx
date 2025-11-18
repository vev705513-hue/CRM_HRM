import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentUser } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { TablesInsert, Enums } from "@/integrations/supabase/types";

// Kiểu enum từ Supabase
type LeaveType = Enums<'leave_type'>;
type LeaveInsert = TablesInsert<'leave_requests'>;

const LeaveRequestForm = () => {
  const [type, setType] = useState<LeaveType>("annual");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Xử lý Select: ép kiểu an toàn
  const handleTypeChange = (value: string) => {
    setType(value as LeaveType);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const user = await getCurrentUser();
      if (!user) throw new Error("Not authenticated");

      const newLeaveRequest: LeaveInsert = {
        user_id: user.id,
        type: type,
        start_date: startDate,
        end_date: endDate,
        reason: reason || null,
        status: "pending",
      };

      const { error } = await supabase.from("leave_requests").insert([newLeaveRequest]);

      if (error) throw error;

      toast({
        title: "Yêu cầu đã gửi",
        description: "Yêu cầu nghỉ phép của bạn đã được gửi thành công.",
      });

      resetForm();
    } catch (error) {
      console.error("Error submitting leave request:", error);
      toast({
        title: "Lỗi",
        description: "Không thể gửi yêu cầu nghỉ phép. Vui lòng thử lại.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setType("annual");
    setStartDate("");
    setEndDate("");
    setReason("");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gửi yêu cầu nghỉ phép</CardTitle>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">

          <div>
            <Label htmlFor="type">Loại nghỉ phép *</Label>
            <Select value={type} onValueChange={handleTypeChange}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn loại nghỉ phép" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="annual">Nghỉ phép năm</SelectItem>
                <SelectItem value="sick">Nghỉ ốm</SelectItem>
                <SelectItem value="personal">Nghỉ cá nhân</SelectItem>
                <SelectItem value="unpaid">Nghỉ không lương</SelectItem>
                <SelectItem value="unpaid">Nghỉ do thời tiết xấu</SelectItem>
                <SelectItem value="unpaid">Nghỉ để đi học</SelectItem>
                <SelectItem value="unpaid">Nghỉ khác</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start">Ngày nghỉ *</Label>
              <Input
                id="start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="end">Ngày kết thúc *</Label>
              <Input
                id="end"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>
          </div>
          <div>
            <div>
              <Label htmlFor="end">Ngày công *</Label>
              <Select value={type} onValueChange={handleTypeChange}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn loại nghỉ phép" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="annual">Nghỉ nửa ngày công sáng</SelectItem>
                <SelectItem value="sick">Nghỉ nửa ngày công chiều</SelectItem>
                <SelectItem value="personal">Nghỉ cả ngày</SelectItem>
              </SelectContent>
            </Select>
            </div>
          </div>

            
          <div>
            <Label htmlFor="reason">Lý do nghỉ phép</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="Nhập lý do nghỉ phép"
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={loading}>
              {loading ? "Đang gửi..." : "Gửi yêu cầu"}
            </Button>
          </div>

        </form>
      </CardContent>
    </Card>
  );
};

export default LeaveRequestForm;
