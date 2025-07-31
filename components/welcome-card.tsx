import { Card, CardContent } from "@/components/ui/card";
import { Sun, Calendar } from "lucide-react";

interface WelcomeCardProps {
  userName: string;
  companyName: string;
}

export function WelcomeCard({ userName, companyName }: WelcomeCardProps) {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const getCurrentDate = () => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Sun className="h-5 w-5 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">
                {getGreeting()}, {userName.split('@')[0]}!
              </h1>
            </div>
            <p className="text-gray-600">
              Welcome to <span className="font-semibold text-blue-700">{companyName}</span>
            </p>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Calendar className="h-4 w-4" />
              {getCurrentDate()}
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-sm text-gray-500">Today's Overview</div>
            <div className="text-2xl font-bold text-blue-600">0</div>
            <div className="text-xs text-gray-500">Active Invoices</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 